begin;
do $$
declare
  u uuid:=gen_random_uuid(); ws uuid:=gen_random_uuid(); a uuid:=gen_random_uuid(); original uuid:=gen_random_uuid();
  h uuid:=gen_random_uuid(); w uuid:=gen_random_uuid(); revision uuid:=gen_random_uuid(); shot uuid:=gen_random_uuid();
  b uuid:=gen_random_uuid(); bad_brand uuid:=gen_random_uuid(); editor uuid:=gen_random_uuid(); editor_revision uuid:=gen_random_uuid();
  payload jsonb; result jsonb; version bigint;
begin
  insert into auth.users(id)values(u);
  insert into public.workspaces(id,name,created_by)values(ws,'cloud test',u);
  insert into public.workspace_members(workspace_id,user_id,role)values(ws,u,'owner');
  insert into public.assets(id,workspace_id,created_by,bucket,object_key,filename,mime_type,status)
  values(a,ws,u,'test',a::text,'result.webp','image/webp','ready'),(original,ws,u,'test',original::text,'original.webp','image/webp','ready');
  payload:=jsonb_build_object('id',h,'project_id',null,'work_id',w,'revision_id',revision,'title','test','created_at',now(),'expected_version',0,'state','{}'::jsonb,'assets',jsonb_build_array(a,original),'shots',jsonb_build_array(jsonb_build_object('id',shot,'label','cut','position',0,'ratio','1:1','asset_id',a,'final_prompt','prompt','settings','{}'::jsonb,'bookmarked',true,'bookmark_snapshot',jsonb_build_object('label','original bookmark'),'inputs',jsonb_build_array(jsonb_build_object('asset_id',original,'role','product','label','product','position',0)),'evaluation',jsonb_build_object('id',gen_random_uuid(),'original_asset_id',original,'status','scored','score',0,'model_version','v1'))));
  result:=public.studio_commit(ws,u,'history',payload);
  if(result->>'version')::integer<>1 then raise exception 'First history version should be 1';end if;
  result:=public.studio_commit(ws,u,'history',payload||jsonb_build_object('expected_version',1,'title','renamed'));
  if(result->>'version')::integer<>2 then raise exception 'History version did not advance';end if;
  update public.image_evaluations set tq=80,tq_status='scored',tq_version='tq-test' where workspace_id=ws and asset_id=a;
  result:=public.studio_commit(ws,u,'history',jsonb_set(payload,'{shots,0,evaluation,score}','77'::jsonb)||jsonb_build_object('expected_version',2));
  if (select fidelity from public.image_evaluations where workspace_id=ws and asset_id=a)<>77
    or (select tq from public.image_evaluations where workspace_id=ws and asset_id=a)<>80 then
    raise exception 'Re-evaluation did not update Fidelity independently'; end if;
  begin
    perform public.studio_commit(ws,u,'history',payload||jsonb_build_object('expected_version',1));
    raise exception 'Stale history save succeeded';
  exception when serialization_failure then null;end;
  if(select count(*) from public.image_evaluations where workspace_id=ws)<>1 then raise exception 'Evaluation duplicated on rename';end if;
  if(select count(*) from public.bookmarks where workspace_id=ws)<>1 then raise exception 'Bookmark missing';end if;
  begin
    perform public.studio_commit(ws,u,'brand',jsonb_build_object('id',bad_brand,'name','bad','expected_version',0,'images',jsonb_build_array(jsonb_build_object('asset_id',gen_random_uuid(),'name','missing','position',0))));
    raise exception 'Missing brand asset accepted';
  exception when foreign_key_violation then null;end;
  if exists(select 1 from public.brands where id=bad_brand)then raise exception 'Failed transaction left partial brand';end if;
  result:=public.studio_commit(ws,u,'brand',jsonb_build_object('id',b,'name','brand','expected_version',0,'images',jsonb_build_array(jsonb_build_object('asset_id',a,'name','image','position',0))));
  begin
    perform public.studio_commit(ws,u,'brand',jsonb_build_object('id',b,'name','stale','expected_version',0,'images','[]'::jsonb));
    raise exception 'Stale brand save succeeded';
  exception when serialization_failure then null;end;
  result:=public.studio_commit(ws,u,'workspace',jsonb_build_object('id',editor,'work_id',editor,'revision_id',editor_revision,'kind','studio_cut','project_id',null,'title','editor','expected_version',0,'state',jsonb_build_object('prompt','resume me','activeHistoryId',h),'assets',jsonb_build_array(a)));
  if(select state->'snapshot'->>'prompt' from public.work_revisions where id=editor_revision)<>'resume me' then raise exception 'Workspace state missing';end if;
  if(select work_id from public.editor_sessions where workspace_id=ws)<>editor then raise exception 'Session not linked to editor';end if;
  perform public.studio_commit(ws,u,'delete_history',jsonb_build_object('id',h));
  if not exists(select 1 from public.bookmarks where workspace_id=ws and snapshot->>'label'='original bookmark')then raise exception 'History deletion removed bookmark snapshot';end if;
  begin
    perform public.studio_commit(ws,u,'history',payload||jsonb_build_object('expected_version',2));
    raise exception 'Deleted history resurrected';
  exception when serialization_failure then null;end;
  insert into public.usage_records(workspace_id,model,total)values(ws,'legacy-unlinked',5);
  if has_function_privilege('authenticated','public.studio_commit(uuid,uuid,text,jsonb)','execute') or has_function_privilege('anon','public.studio_commit(uuid,uuid,text,jsonb)','execute') then
    raise exception 'Browser role can call server-only transaction';
  end if;
  raise notice 'PASS: atomic history/brand saves, optimistic conflicts, workspace recovery, bookmark preservation, server-only RPC';
end $$;
rollback;
