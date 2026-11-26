-- Historical test: run after 20261125020000 only, before the current aggregate migration.
-- For the latest schema run current_brand_embeddings.sql instead.
begin;
do $$
declare
  u uuid:=gen_random_uuid(); ws uuid:=gen_random_uuid(); b uuid:=gen_random_uuid();
  a uuid:=gen_random_uuid(); alias_asset uuid:=gen_random_uuid(); unlabeled uuid:=gen_random_uuid();
  e uuid; snap jsonb; repeated jsonb; rev bigint; lock_ver bigint;
  color real[]:=array[1::real]||array_fill(0::real,array[511]);
  design real[]:=array[1::real]||array_fill(0::real,array[383]);
  sig text:='test-only-'||gen_random_uuid()::text;
begin
  insert into auth.users(id) values(u);
  insert into public.workspaces(id,name,created_by) values(ws,'BF test',u);
  insert into public.workspace_members(workspace_id,user_id,role) values(ws,u,'owner');
  insert into public.assets(id,workspace_id,created_by,bucket,object_key,filename,mime_type,status,checksum)
    select x,ws,u,'test',x::text,'test.png','image/png','ready',repeat('a',64) from unnest(array[a,alias_asset,unlabeled]) x;
  insert into public.appearance_encoders(signature,model_name,resolved_revision,feature_version,preprocessing_version,manifest)
    values(sig,'test-only',repeat('a',40),'test','test','{}');
  perform public.studio_commit(ws,u,'brand',jsonb_build_object('id',b,'name','BF','expected_version',0,'images',
    jsonb_build_array(jsonb_build_object('name','test','position',0,'asset_id',a,'case_type','positive'),jsonb_build_object('name','test','position',0,'asset_id',alias_asset,'case_type','positive'),jsonb_build_object('name','test','position',0,'asset_id',unlabeled))));
  begin
    perform public.studio_create_brand_pool_snapshot(ws,u,b,sig);
    raise exception 'Missing embeddings accepted';
  exception when serialization_failure then null; end;
  begin
    insert into public.asset_appearance_embeddings(workspace_id,asset_id,content_sha256,normalized_image_sha256,encoder_signature,color_embedding,design_embedding)
      values(ws,a,repeat('a',64),repeat('b',64),sig,array[1::real],design);
    raise exception 'Bad dimensions accepted';
  exception when check_violation then null; end;
  begin
    insert into public.asset_appearance_embeddings(workspace_id,asset_id,content_sha256,normalized_image_sha256,encoder_signature,color_embedding,design_embedding)
      values(ws,a,repeat('c',64),repeat('b',64),sig,color,design);
    raise exception 'Wrong content accepted';
  exception when check_violation then null; end;
  insert into public.asset_appearance_embeddings(workspace_id,asset_id,content_sha256,normalized_image_sha256,encoder_signature,color_embedding,design_embedding)
    select ws,x,repeat('a',64),repeat('b',64),sig,color,design from unnest(array[a,alias_asset]) x;
  select id into e from public.asset_appearance_embeddings where workspace_id=ws and asset_id=a;
  snap:=public.studio_create_brand_pool_snapshot(ws,u,b,sig);
  repeated:=public.studio_create_brand_pool_snapshot(ws,u,b,sig);
  if snap->>'id'<>repeated->>'id' or (snap->>'example_count')::int<>2 or (snap->>'positive_count')::int<>1 then
    raise exception 'Snapshot reuse or canonical dedup failed'; end if;
  if exists(select 1 from public.brand_pool_snapshot_examples where snapshot_id=(snap->>'id')::uuid and asset_id=unlabeled) then
    raise exception 'NULL label silently classified'; end if;
  begin
    delete from public.brand_pool_snapshot_examples where snapshot_id=(snap->>'id')::uuid;
    raise exception 'Sealed snapshot mutated';
  exception when check_violation then null; end;
  begin
    update public.asset_appearance_embeddings set normalized_image_sha256=repeat('d',64) where id=e;
    raise exception 'Cache mutated';
  exception when check_violation then null; end;
  select pool_revision,lock_version into rev,lock_ver from public.brands where id=b;
  perform public.studio_commit(ws,u,'brand',jsonb_build_object('id',b,'name','renamed','expected_version',lock_ver,'images',
    jsonb_build_array(jsonb_build_object('name','test','position',0,'asset_id',a,'case_type','positive','position',2),jsonb_build_object('name','test','position',0,'asset_id',alias_asset,'case_type','positive','position',1),jsonb_build_object('name','test','position',0,'asset_id',unlabeled))));
  if (select pool_revision from public.brands where id=b)<>rev then raise exception 'Rename invalidated Pool'; end if;
  begin
    perform public.studio_brandfit_feedback(ws,u,b,alias_asset,'negative',array['tq']);
    raise exception 'Unrelated negative accepted';
  exception when check_violation then null; end;
  select lock_version into lock_ver from public.brands where id=b;
  perform public.studio_brandfit_feedback(ws,u,b,alias_asset,'negative',array['bf']);
  if (select lock_version from public.brands where id=b)<=lock_ver then raise exception 'Feedback did not invalidate stale UI'; end if;
  begin
    perform public.studio_create_brand_pool_snapshot(ws,u,b,sig);
    raise exception 'Opposite labels for same image accepted';
  exception when serialization_failure then null; end;
  insert into public.brand_fit_evaluations(workspace_id,generated_asset_id,result_content_sha256,generated_embedding_id,brand_id,snapshot_id,encoder_signature,status,score,positive_similarity,scoring_version)
    values(ws,a,repeat('a',64),e,b,(snap->>'id')::uuid,sig,'scored',80,0.8,'bf-test');
  insert into public.brand_fit_evaluations(workspace_id,generated_asset_id,status,reason,scoring_version)
    values(ws,a,'not_applicable','pool_not_selected','bf-test');
  if has_function_privilege('authenticated','public.studio_brandfit_feedback(uuid,uuid,uuid,uuid,text,text[],bigint)','execute')
    or has_function_privilege('anon','public.studio_create_brand_pool_snapshot(uuid,uuid,uuid,text,bigint)','execute') then
    raise exception 'Browser can mutate BF state'; end if;
  raise notice 'PASS: checksum/dimension validation, immutable cache/snapshot, dedup, NULL labels, conflicts, feedback, BF results and server-only RPC';
end $$;
rollback;

