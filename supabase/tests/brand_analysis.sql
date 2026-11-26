begin;
do $$
declare u uuid:=gen_random_uuid(); ws uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); job jsonb; initial_run uuid;
begin
 insert into auth.users(id) values(u);
 insert into public.workspaces(id,name,created_by) values(ws,'analysis test',u);
 insert into public.workspace_members(workspace_id,user_id,role) values(ws,u,'owner');
 insert into public.brands(id,workspace_id,created_by,name) values(b,ws,u,'analysis brand');
 with added as (
   insert into public.assets(workspace_id,created_by,bucket,object_key,filename,mime_type,status)
   select ws,u,'test',gen_random_uuid()::text,'image.png','image/png','ready' from generate_series(1,20) returning id
 ) insert into public.brand_assets(workspace_id,brand_id,asset_id,name,case_type) select ws,b,id,'example','positive' from added;
 update public.brand_assets set case_type='negative' where brand_id=b and asset_id=(select asset_id from public.brand_assets where brand_id=b limit 1);
 job:=public.studio_request_brand_analysis(ws,u,b,'initial');
 if job->>'status'<>'insufficient_data' or (job->>'started')::boolean then raise exception '19 positives started'; end if;
 update public.brand_assets set case_type='positive' where brand_id=b;
 job:=public.studio_request_brand_analysis(ws,u,b,'initial'); initial_run:=(job->>'run_id')::uuid;
 if job->>'status'<>'queued' or not (job->>'started')::boolean then raise exception '20 positives did not start'; end if;
 job:=public.studio_request_brand_analysis(ws,u,b,'manual');
 if (job->>'started')::boolean or (job->>'run_id')::uuid<>initial_run then raise exception 'Duplicate job started'; end if;
 if not public.studio_finish_brand_analysis(ws,u,b,initial_run,'ready','{"description":"saved","palette":[]}',null) then raise exception 'Completion was not stored'; end if;
 job:=public.studio_request_brand_analysis(ws,u,b,'initial');
 if (job->>'started')::boolean then raise exception 'Initial reran after successful result'; end if;
 job:=public.studio_request_brand_analysis(ws,u,b,'manual');
 if not (job->>'started')::boolean or job->'result'->>'description'<>'saved' then raise exception 'Refresh lost previous result'; end if;
 if (job->>'run_id')::uuid=initial_run then raise exception 'Refresh reused stale job ID'; end if;
 if public.studio_finish_brand_analysis(ws,u,b,initial_run,'ready','{"description":"stale"}',null) then raise exception 'Stale completion overwrote latest run'; end if;
 if not public.studio_finish_brand_analysis(ws,u,b,(job->>'run_id')::uuid,'failed',null,'offline') then raise exception 'Failure was not saved'; end if;
 if (select result->>'description' from public.brand_analyses where brand_id=b)<>'saved' then raise exception 'Failure cleared saved result'; end if;
 if has_table_privilege('authenticated','public.brand_analyses','INSERT') or has_function_privilege('authenticated','public.studio_request_brand_analysis(uuid,uuid,uuid,text)','EXECUTE') then raise exception 'Unsafe analysis privileges'; end if;
 raise notice 'PASS: threshold, deduplication, initial-once/manual refresh, result retention and privileges';
end $$;
rollback;
