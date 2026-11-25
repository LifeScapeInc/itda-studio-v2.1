-- Run only against a development/test database after applying migrations.
begin;
do $$
declare
  u uuid := gen_random_uuid(); outsider uuid := gen_random_uuid();
  ws uuid := gen_random_uuid(); ws2 uuid := gen_random_uuid();
  p uuid := gen_random_uuid(); w uuid := gen_random_uuid(); unscoped uuid := gen_random_uuid();
  h uuid := gen_random_uuid(); s uuid := gen_random_uuid(); a uuid := gen_random_uuid();
  a2 uuid := gen_random_uuid(); r uuid := gen_random_uuid();
begin
  if (select count(*) from pg_tables where schemaname = 'public' and tablename in
    ('users','workspaces','workspace_members','assets','request_cases','request_case_assets','projects',
     'project_works','work_revisions','work_revision_assets','work_events','editor_sessions',
     'generation_histories','generation_shots','generation_shot_inputs','ai_runs','image_evaluations',
     'bookmarks','brands','brand_assets','moodboards','moodboard_items','furniture_categories','furniture_items','usage_records')) <> 25 then
    raise exception 'Expected 25 tables';
  end if;
  if exists (select 1 from pg_tables where schemaname = 'public' and not rowsecurity) then
    raise exception 'RLS missing on public table';
  end if;
  insert into auth.users(id) values (u), (outsider);
  if not exists (select 1 from public.users where id = u) then raise exception 'Profile trigger missing'; end if;
  insert into public.workspaces(id, name, created_by) values (ws, 'test', u), (ws2, 'other', outsider);
  insert into public.workspace_members(workspace_id, user_id, role) values (ws,u,'owner'), (ws2,outsider,'owner');
  insert into public.projects(id,workspace_id,created_by,name,work_type) values(p,ws,u,'project','studio_cut');
  insert into public.project_works(id,workspace_id,project_id,created_by,kind) values(w,ws,p,u,'studio_cut'),(unscoped,ws,null,u,'studio_cut');
  insert into public.generation_histories(id,workspace_id,project_id,work_id,created_by) values(h,ws,p,w,u);
  insert into public.generation_histories(workspace_id,project_id,work_id,created_by) values(ws,null,unscoped,u);
  begin
    insert into public.generation_histories(workspace_id,project_id,work_id,created_by) values(ws,null,w,u);
    raise exception 'Expected project mismatch rejection';
  exception when check_violation then null; end;
  begin
    insert into public.generation_histories(workspace_id,project_id,work_id,created_by) values(ws2,p,w,outsider);
    raise exception 'Expected cross-workspace rejection';
  exception when foreign_key_violation then null; end;
  insert into public.assets(id,workspace_id,created_by,bucket,object_key,filename,mime_type,status)
    values(a,ws,u,'test',a::text,'image.webp','image/webp','ready'),(a2,ws,u,'test',a2::text,'original.webp','image/webp','ready');
  insert into public.generation_shots(id,workspace_id,history_id,label,position,ratio,asset_id) values(s,ws,h,'cut',0,'1:1',a);
  insert into public.image_evaluations(workspace_id,asset_id,original_asset_id,status,score,model_version)
    values(ws,a,a2,'scored',92,'v1');
  begin
    insert into public.image_evaluations(workspace_id,asset_id,original_asset_id,status,score,model_version) values(ws,a,a2,'scored',101,'v1');
    raise exception 'Expected invalid score rejection';
  exception when check_violation then null; end;
  insert into public.image_evaluations(workspace_id,asset_id,status,reason) values(ws,a,'unavailable','offline');
  insert into public.work_revisions(id,workspace_id,work_id,revision_number,created_by) values(r,ws,w,1,u);
  update public.work_revisions set state = '{"prompt":"saved"}' where id=r and lock_version=1;
  if (select lock_version from public.work_revisions where id=r) <> 2 then raise exception 'Lock version not advanced'; end if;
  update public.work_revisions set state='{}' where id=r and lock_version=1;
  if found then raise exception 'Stale write succeeded'; end if;
  begin
    insert into public.work_revisions(workspace_id,work_id,revision_number,created_by) values(ws,w,2,u);
    raise exception 'Expected duplicate draft rejection';
  exception when unique_violation then null; end;
  insert into public.editor_sessions(workspace_id,user_id,project_id,kind,work_id,revision_id,active_history_id,selected_shot_id)
    values(ws,u,p,'studio_cut',w,r,h,s);
  begin
    insert into public.editor_sessions(workspace_id,user_id,kind,work_id,active_history_id) values(ws,u,'studio_cut',unscoped,h);
    raise exception 'Expected foreign history rejection';
  exception when check_violation then null; end;
  insert into public.furniture_items(workspace_id,created_by,name,images)
    values(ws,u,'chair',jsonb_build_array(jsonb_build_object('asset_id',a::text,'is_primary',true)));
  begin
    insert into public.furniture_items(workspace_id,created_by,name,images)
      values(ws2,outsider,'bad',jsonb_build_array(jsonb_build_object('asset_id',a::text)));
    raise exception 'Expected furniture asset scope rejection';
  exception when foreign_key_violation then null; end;
  begin
    delete from public.assets where id=a;
    raise exception 'Expected referenced asset deletion rejection';
  exception when foreign_key_violation then null; end;
  insert into public.ai_runs(workspace_id,created_by,work_id,shot_id,kind,idempotency_key) values(ws,u,w,s,'cut_generation','test-key');
  begin
    insert into public.ai_runs(workspace_id,created_by,work_id,shot_id,kind,idempotency_key) values(ws,u,w,s,'cut_generation','other-key');
    raise exception 'Expected concurrent cut rejection';
  exception when unique_violation then null; end;
  update public.projects set deleted_at=now() where id=p;
  if (select project_id from public.generation_histories where id=h) is distinct from p then raise exception 'Project deletion lost history scope'; end if;
  -- RLS checks through actual authenticated role, including hidden foreign workspace.
  perform set_config('request.jwt.claim.sub', u::text, true);
  execute 'set local role authenticated';
  if (select count(*) from public.workspaces) <> 1 then raise exception 'Workspace read isolation failed'; end if;
  if exists(select 1 from public.workspaces where id=ws2) then raise exception 'Foreign workspace visible'; end if;
  begin
    insert into public.bookmarks(workspace_id,user_id,asset_id) values(ws,outsider,a);
    raise exception 'Expected forged bookmark rejection';
  exception when insufficient_privilege then null; end;
  insert into public.bookmarks(workspace_id,user_id,asset_id) values(ws,u,a);
  execute 'reset role';
  raise notice 'PASS: schema, scopes, scores, drafts, locks, furniture, runs, deletion and RLS';
end $$;
rollback;
