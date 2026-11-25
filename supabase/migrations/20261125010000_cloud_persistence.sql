begin;
alter table public.generation_shots add column deleted_at timestamptz;
alter table public.brands add column lock_version bigint not null default 1 check(lock_version > 0);
alter table public.bookmarks add column snapshot jsonb not null default '{}' check(jsonb_typeof(snapshot)='object');
-- Older usage records do not necessarily identify an individual AI call.
alter table public.usage_records alter column ai_run_id drop not null;

-- Server-only transaction boundary. Browser roles cannot invoke this function.
create function public.studio_commit(p_workspace uuid, p_owner uuid, p_operation text, p_data jsonb)
returns jsonb language plpgsql set search_path='' as $$
declare
  entity uuid := (p_data->>'id')::uuid;
  project uuid := nullif(p_data->>'project_id','')::uuid;
  work uuid; revision uuid; current_version bigint; expected bigint := coalesce((p_data->>'expected_version')::bigint,0);
  item jsonb; input jsonb; found_session uuid; source_case uuid; result_version bigint;
begin
  if not exists(select 1 from public.workspace_members m join public.workspaces w on w.id=m.workspace_id
    where m.workspace_id=p_workspace and m.user_id=p_owner and m.role in ('owner','admin','member') and w.deleted_at is null) then
    raise exception 'Workspace membership required' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_workspace::text||p_operation||coalesce(entity::text,''),0));
  if project is not null and not exists(select 1 from public.projects where workspace_id=p_workspace and id=project and deleted_at is null) then
    raise exception 'Project not found' using errcode='23503';
  end if;
  if p_operation='project' then
    if p_data->'source_case' is not null and p_data->'source_case'<>'null'::jsonb then
      source_case := (p_data->>'case_id')::uuid;
      insert into public.request_cases(id,workspace_id,created_by,name,source_system,external_case_id,customer_name,email,service_label,status,delivery_due_date,request_data)
      values(source_case,p_workspace,p_owner,p_data->'source_case'->>'case_name','itda-neo',p_data->>'case_key',p_data->'source_case'->>'name',p_data->'source_case'->>'email',p_data->'source_case'->>'service_label',coalesce(p_data->'source_case'->>'status','draft'),nullif(p_data->'source_case'->>'delivery_due_date','')::date,p_data->'source_case')
      on conflict(workspace_id,source_system,external_case_id) do update set request_data=excluded.request_data returning id into source_case;
    end if;
    insert into public.projects(id,workspace_id,created_by,case_id,name,work_type,stage,manager,company,email,delivery_due_date)
    values(entity,p_workspace,p_owner,source_case,p_data->>'name',p_data->>'work_type',p_data->>'stage',coalesce(p_data->>'manager',''),coalesce(p_data->>'company',''),coalesce(p_data->>'email',''),nullif(p_data->>'delivery_due_date','')::date);
    return jsonb_build_object('id',entity);
  elsif p_operation='delete_project' then
    update public.projects set deleted_at=now() where workspace_id=p_workspace and id=entity;
    return '{}'::jsonb;
  elsif p_operation='delete_history' then
    update public.generation_histories set deleted_at=now() where workspace_id=p_workspace and id=entity;
    return '{}'::jsonb;
  elsif p_operation='history' then
    select h.work_id into work from public.generation_histories h where h.workspace_id=p_workspace and h.id=entity and h.deleted_at is null for update;
    if work is null then
      if expected<>0 or exists(select 1 from public.generation_histories where id=entity) then raise exception 'History conflict' using errcode='40001'; end if;
      work := (p_data->>'work_id')::uuid; revision := (p_data->>'revision_id')::uuid;
      insert into public.project_works(id,workspace_id,project_id,created_by,kind,title)
      values(work,p_workspace,project,p_owner,'studio_cut',p_data->>'title');
      insert into public.generation_histories(id,workspace_id,project_id,work_id,created_by,title,created_at)
      values(entity,p_workspace,project,work,p_owner,p_data->>'title',(p_data->>'created_at')::timestamptz);
      insert into public.work_revisions(id,workspace_id,work_id,revision_number,created_by,state)
      values(revision,p_workspace,work,1,p_owner,p_data->'state') returning lock_version into result_version;
      insert into public.work_events(workspace_id,work_id,actor_id,event_type,payload) values(p_workspace,work,p_owner,'generation_created',jsonb_build_object('history_id',entity));
    else
      if not exists(select 1 from public.generation_histories where id=entity and project_id is not distinct from project) then raise exception 'History scope is immutable' using errcode='23514'; end if;
      select id,lock_version into revision,current_version from public.work_revisions where workspace_id=p_workspace and work_id=work and is_draft for update;
      if current_version is distinct from expected then raise exception 'History changed' using errcode='40001'; end if;
      update public.work_revisions set state=p_data->'state' where id=revision returning lock_version into result_version;
      update public.generation_histories set title=p_data->>'title' where id=entity;
      update public.project_works set title=p_data->>'title' where id=work;
    end if;
    for item in select value from jsonb_array_elements(p_data->'shots') loop
      insert into public.generation_shots(id,workspace_id,history_id,label,position,ratio,resolution,asset_id,final_prompt,settings,model,is_mock,generated_at)
      values((item->>'id')::uuid,p_workspace,entity,item->>'label',(item->>'position')::integer,item->>'ratio',item->>'resolution',nullif(item->>'asset_id','')::uuid,item->>'final_prompt',item->'settings',item->>'model',coalesce((item->>'is_mock')::boolean,false),nullif(item->>'generated_at','')::timestamptz)
      on conflict(id) do update set label=excluded.label,asset_id=excluded.asset_id,final_prompt=excluded.final_prompt,settings=excluded.settings,model=excluded.model,is_mock=excluded.is_mock,generated_at=excluded.generated_at,deleted_at=null
      where public.generation_shots.workspace_id=p_workspace and public.generation_shots.history_id=entity;
      delete from public.generation_shot_inputs where workspace_id=p_workspace and shot_id=(item->>'id')::uuid;
      for input in select value from jsonb_array_elements(item->'inputs') loop
        insert into public.generation_shot_inputs(workspace_id,shot_id,asset_id,role,label,position)
        values(p_workspace,(item->>'id')::uuid,(input->>'asset_id')::uuid,input->>'role',input->>'label',(input->>'position')::integer);
      end loop;
      if item->'evaluation' is not null and item->'evaluation'<>'null'::jsonb then
        input:=item->'evaluation';
        insert into public.image_evaluations(id,workspace_id,asset_id,original_asset_id,status,score,model_version,reason)
        values((input->>'id')::uuid,p_workspace,(item->>'asset_id')::uuid,nullif(input->>'original_asset_id','')::uuid,input->>'status',(input->>'score')::numeric,input->>'model_version',input->>'reason') on conflict(id) do nothing;
      end if;
      if item->>'asset_id' is not null then
        if (item->>'bookmarked')::boolean then
          insert into public.bookmarks(workspace_id,user_id,asset_id,snapshot)
          values(p_workspace,p_owner,(item->>'asset_id')::uuid,item->'bookmark_snapshot')
          on conflict(workspace_id,user_id,asset_id) do update set snapshot=excluded.snapshot;
        else
          delete from public.bookmarks where workspace_id=p_workspace and user_id=p_owner and asset_id=(item->>'asset_id')::uuid;
        end if;
      end if;
    end loop;
    update public.generation_shots set deleted_at=now() where workspace_id=p_workspace and history_id=entity and id not in(select (value->>'id')::uuid from jsonb_array_elements(p_data->'shots'));
    delete from public.work_revision_assets where workspace_id=p_workspace and revision_id=revision;
    for item in select value from jsonb_array_elements(p_data->'assets') loop
      insert into public.work_revision_assets(workspace_id,revision_id,asset_id,role) values(p_workspace,revision,(item#>>'{}')::uuid,'snapshot');
    end loop;
    return jsonb_build_object('version',result_version);
  elsif p_operation='brand' then
    select lock_version into current_version from public.brands where workspace_id=p_workspace and id=entity and deleted_at is null for update;
    if current_version is null then
      if expected<>0 or exists(select 1 from public.brands where id=entity) then raise exception 'Brand conflict' using errcode='40001'; end if;
      insert into public.brands(id,workspace_id,created_by,name) values(entity,p_workspace,p_owner,p_data->>'name'); result_version:=1;
    else
      if current_version<>expected then raise exception 'Brand changed' using errcode='40001'; end if;
      update public.brands set name=p_data->>'name',lock_version=lock_version+1 where id=entity returning lock_version into result_version;
    end if;
    delete from public.brand_assets where workspace_id=p_workspace and brand_id=entity;
    for item in select value from jsonb_array_elements(p_data->'images') loop
      insert into public.brand_assets(workspace_id,brand_id,asset_id,name,case_type,position)
      values(p_workspace,entity,(item->>'asset_id')::uuid,item->>'name',item->>'case_type',(item->>'position')::integer);
    end loop;
    return jsonb_build_object('version',result_version);
  elsif p_operation='delete_brand' then
    update public.brands set deleted_at=now() where workspace_id=p_workspace and id=entity and lock_version=expected;
    if not found then raise exception 'Brand changed' using errcode='40001'; end if;
    return '{}'::jsonb;
  elsif p_operation='workspace' then
    work:=(p_data->>'work_id')::uuid; revision:=(p_data->>'revision_id')::uuid;
    if p_data->'state'->>'activeHistoryId' is not null and not exists(select 1 from public.generation_histories where workspace_id=p_workspace and id=(p_data->'state'->>'activeHistoryId')::uuid and project_id is not distinct from project and deleted_at is null) then
      raise exception 'Active history must belong to project' using errcode='23514';
    end if;
    select lock_version into current_version from public.work_revisions where workspace_id=p_workspace and id=revision for update;
    if current_version is null then
      if expected<>0 then raise exception 'Workspace changed' using errcode='40001'; end if;
      insert into public.project_works(id,workspace_id,project_id,created_by,kind,title) values(work,p_workspace,project,p_owner,p_data->>'kind',p_data->>'title');
      insert into public.work_revisions(id,workspace_id,work_id,revision_number,created_by,state) values(revision,p_workspace,work,1,p_owner,jsonb_build_object('kind','workspace','snapshot',p_data->'state')) returning lock_version into result_version;
    else
      if current_version<>expected then raise exception 'Workspace changed' using errcode='40001'; end if;
      update public.work_revisions set state=jsonb_build_object('kind','workspace','snapshot',p_data->'state') where workspace_id=p_workspace and id=revision returning lock_version into result_version;
    end if;
    delete from public.work_revision_assets where workspace_id=p_workspace and revision_id=revision;
    for item in select value from jsonb_array_elements(p_data->'assets') loop
      insert into public.work_revision_assets(workspace_id,revision_id,asset_id,role) values(p_workspace,revision,(item#>>'{}')::uuid,'snapshot');
    end loop;
    select id into found_session from public.editor_sessions where workspace_id=p_workspace and user_id=p_owner and project_id is not distinct from project and kind=p_data->>'kind' for update;
    if found_session is null then
      insert into public.editor_sessions(workspace_id,user_id,project_id,kind,work_id,revision_id,ui_state) values(p_workspace,p_owner,project,p_data->>'kind',work,revision,'{}');
    else
      update public.editor_sessions set work_id=work,revision_id=revision,active_history_id=null,selected_shot_id=null where id=found_session;
    end if;
    return jsonb_build_object('version',result_version);
  end if;
  raise exception 'Unknown operation' using errcode='22023';
end $$;
revoke all on function public.studio_commit(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.studio_commit(uuid,uuid,text,jsonb) to service_role;
commit;
