begin;
do $$
declare u uuid:=gen_random_uuid(); ws uuid:=gen_random_uuid(); b uuid:=gen_random_uuid();
 a uuid:=gen_random_uuid(); original uuid:=gen_random_uuid(); rev bigint; version bigint; payload jsonb;
 color double precision[]:=array[1::double precision]||array_fill(0::double precision,array[511]);
 design double precision[]:=array[1::double precision]||array_fill(0::double precision,array[383]);
begin
 if to_regclass('public.appearance_encoders') is not null or to_regclass('public.brand_pool_snapshots') is not null
   or to_regclass('public.brand_fit_evaluations') is not null or to_regclass('public.asset_appearance_embeddings') is not null then
   raise exception 'Superseded storage remains'; end if;
 insert into auth.users(id) values(u);
 insert into public.workspaces(id,name,created_by) values(ws,'aggregate test',u);
 insert into public.workspace_members(workspace_id,user_id,role) values(ws,u,'owner');
 insert into public.assets(id,workspace_id,created_by,bucket,object_key,filename,mime_type,status)
 select x,ws,u,'test',x::text,'test.png','image/png','ready' from unnest(array[a,original]) x;
 payload:=jsonb_build_object('id',b,'name','brand','expected_version',0,'images',jsonb_build_array(jsonb_build_object('asset_id',a,'name','example','case_type','positive','position',0)));
 perform public.studio_commit(ws,u,'brand',payload);
 select pool_revision,lock_version into rev,version from public.brands where id=b;
 insert into public.brand_embeddings(workspace_id,brand_id,pool_revision,encoder_signature,encoder_config,aggregation_version,
   positive_count,negative_count,positive_color_sum,positive_design_sum,negative_color_sum,negative_design_sum)
 values(ws,b,rev,'test',jsonb_build_object('model_name','test','resolved_revision',repeat('a',40),'feature_version','test','preprocessing_version','test'),
   'mean-pairwise-cosine-v1',1,0,color,design,array_fill(0::double precision,array[512]),array_fill(0::double precision,array[384]));
 begin
   update public.brand_embeddings set positive_color_sum=array[1::double precision] where brand_id=b;
   raise exception 'Wrong dimensions accepted';
 exception when check_violation then null; end;
 begin
   update public.brand_embeddings set negative_count=1 where brand_id=b;
   raise exception 'Nonunit single example accepted';
 exception when check_violation then null; end;
 perform public.studio_commit(ws,u,'brand',payload||jsonb_build_object('name','rename','expected_version',version));
 if(select pool_revision from public.brands where id=b)<>rev then raise exception 'Rename changed Pool'; end if;
 perform public.studio_brandfit_feedback(ws,u,b,a,'negative',array['bf']);
 begin
   update public.brand_embeddings set encoder_signature='stale update' where brand_id=b;
   raise exception 'Stale aggregate accepted';
 exception when serialization_failure then null; end;
 insert into public.image_evaluations(workspace_id,asset_id,original_asset_id,brand_id,fidelity,fidelity_status,fidelity_version,bf,bf_status,bf_version)
 values(ws,a,original,b,90,'scored','fidelity-v1',75,'scored','prototype-concentration-v2');
 update public.image_evaluations set bf=80 where workspace_id=ws and asset_id=a;
 if(select count(*) from public.image_evaluations where workspace_id=ws and asset_id=a)<>1 then raise exception 'Evaluation history retained'; end if;
 begin
   insert into public.image_evaluations(workspace_id,asset_id) values(ws,a);
   raise exception 'Duplicate current row accepted';
 exception when unique_violation then null; end;
 begin
   update public.image_evaluations set tq=101,tq_status='scored',tq_version='tq-v1' where workspace_id=ws and asset_id=a;
   raise exception 'Out of range score accepted';
 exception when check_violation then null; end;
 begin
   update public.image_evaluations set bf=null where workspace_id=ws and asset_id=a;
   raise exception 'Scored NULL accepted';
 exception when check_violation then null; end;
 update public.image_evaluations set bf=null,bf_status='not_applicable',bf_reason='pool_not_selected',brand_id=null where workspace_id=ws and asset_id=a;
 if has_table_privilege('authenticated','public.brand_embeddings','INSERT') or has_table_privilege('anon','public.brand_embeddings','SELECT') then
   raise exception 'Unsafe aggregate privileges'; end if;
 raise notice 'PASS: current aggregate, revision conflicts, dimensions/counts, unified scores, uniqueness, NULL/status/range and privileges';
end $$;
rollback;
