-- BF storage contract. No model weights or fabricated embeddings are seeded.
begin;

alter table public.brands add column pool_revision bigint not null default 0 check (pool_revision >= 0);
alter table public.brand_assets
  add column source text not null default 'reference' check (source in ('reference','feedback')),
  add column feedback_reasons text[] not null default '{}',
  add constraint brand_feedback_requires_bf_reason check (
    source <> 'feedback' or case_type <> 'negative' or 'bf' = any(feedback_reasons)
  ),
  add constraint brand_feedback_requires_label check (source <> 'feedback' or case_type is not null),
  add constraint brand_feedback_known_reasons check (
    feedback_reasons <@ array['fidelity','bf','tq']::text[] and array_position(feedback_reasons,null) is null
  );

create table public.appearance_encoders (
  signature text primary key check (length(trim(signature)) between 1 and 512),
  model_name text not null check (length(trim(model_name)) > 0),
  resolved_revision text not null check (resolved_revision ~ '^[0-9a-f]{40,64}$'),
  feature_version text not null check (length(trim(feature_version)) > 0),
  preprocessing_version text not null check (length(trim(preprocessing_version)) > 0),
  color_dimension integer not null default 512 check (color_dimension between 1 and 4096),
  design_dimension integer not null default 384 check (design_dimension between 1 and 4096),
  manifest jsonb not null check (jsonb_typeof(manifest)='object'),
  created_at timestamptz not null default now()
);

create table public.asset_appearance_embeddings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  asset_id uuid not null,
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  normalized_image_sha256 text not null check (normalized_image_sha256 ~ '^[0-9a-f]{64}$'),
  encoder_signature text not null references public.appearance_encoders(signature),
  color_embedding real[] not null,
  design_embedding real[] not null,
  created_at timestamptz not null default now(),
  foreign key (workspace_id,asset_id) references public.assets(workspace_id,id),
  unique (workspace_id,asset_id,content_sha256,encoder_signature),
  unique (workspace_id,id,asset_id,content_sha256,encoder_signature,normalized_image_sha256),
  unique (workspace_id,id,asset_id,content_sha256,encoder_signature)
);

create table public.brand_pool_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  brand_id uuid not null,
  pool_revision bigint not null check (pool_revision >= 0),
  encoder_signature text not null references public.appearance_encoders(signature),
  fingerprint text check (fingerprint ~ '^[0-9a-f]{64}$'),
  example_count integer not null default 0 check (example_count >= 0),
  positive_count integer not null default 0 check (positive_count >= 0),
  negative_count integer not null default 0 check (negative_count >= 0),
  created_at timestamptz not null default now(),
  sealed_at timestamptz,
  foreign key (workspace_id,brand_id) references public.brands(workspace_id,id),
  unique (workspace_id,brand_id,pool_revision,encoder_signature),
  unique (workspace_id,id,encoder_signature),
  unique (workspace_id,id,brand_id,encoder_signature),
  check (sealed_at is null or fingerprint is not null)
);
create table public.brand_pool_snapshot_examples (
  workspace_id uuid not null,
  snapshot_id uuid not null,
  asset_id uuid not null,
  embedding_id uuid not null,
  content_sha256 text not null,
  normalized_image_sha256 text not null,
  encoder_signature text not null,
  label text not null check (label in ('positive','negative')),
  source text not null check (source in ('reference','feedback')),
  feedback_reasons text[] not null default '{}',
  is_representative boolean not null,
  primary key (snapshot_id,asset_id),
  foreign key (workspace_id,snapshot_id,encoder_signature)
    references public.brand_pool_snapshots(workspace_id,id,encoder_signature),
  foreign key (workspace_id,embedding_id,asset_id,content_sha256,encoder_signature,normalized_image_sha256)
    references public.asset_appearance_embeddings(workspace_id,id,asset_id,content_sha256,encoder_signature,normalized_image_sha256)
);
create unique index one_canonical_example_per_snapshot
  on public.brand_pool_snapshot_examples(snapshot_id,normalized_image_sha256) where is_representative;

create table public.brand_fit_evaluations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  generated_asset_id uuid not null,
  result_content_sha256 text check (result_content_sha256 ~ '^[0-9a-f]{64}$'),
  generated_embedding_id uuid,
  brand_id uuid,
  snapshot_id uuid,
  encoder_signature text references public.appearance_encoders(signature),
  ai_run_id uuid,
  status text not null check (status in ('scored','unavailable','not_applicable')),
  score double precision,
  positive_similarity double precision,
  negative_similarity double precision,
  scoring_version text not null check (length(trim(scoring_version)) > 0),
  reason text,
  diagnostics jsonb not null default '{}' check (jsonb_typeof(diagnostics)='object'),
  evaluated_at timestamptz not null default now(),
  foreign key (workspace_id,generated_asset_id) references public.assets(workspace_id,id),
  foreign key (workspace_id,brand_id) references public.brands(workspace_id,id),
  foreign key (workspace_id,snapshot_id,brand_id,encoder_signature)
    references public.brand_pool_snapshots(workspace_id,id,brand_id,encoder_signature),
  foreign key (workspace_id,generated_embedding_id,generated_asset_id,result_content_sha256,encoder_signature)
    references public.asset_appearance_embeddings(workspace_id,id,asset_id,content_sha256,encoder_signature),
  foreign key (workspace_id,ai_run_id) references public.ai_runs(workspace_id,id),
  check (snapshot_id is null or (brand_id is not null and encoder_signature is not null)),
  check (generated_embedding_id is null or (result_content_sha256 is not null and encoder_signature is not null)),
  check (
    (status='scored' and score is not null and score between 0 and 100 and reason is null
      and positive_similarity is not null and positive_similarity between 0 and 1
      and (negative_similarity is null or negative_similarity between 0 and 1)
      and brand_id is not null and snapshot_id is not null and generated_embedding_id is not null)
    or (status='unavailable' and brand_id is not null and score is null
      and positive_similarity is null and negative_similarity is null and nullif(trim(reason),'') is not null)
    or (status='not_applicable' and brand_id is null and snapshot_id is null
      and generated_embedding_id is null and score is null and positive_similarity is null
      and negative_similarity is null and reason is not null and reason='pool_not_selected')
  )
);

create function studio_private.validate_appearance_embedding() returns trigger
language plpgsql set search_path='' as $$
declare encoder public.appearance_encoders; source public.assets; norm double precision;
begin
  select * into strict encoder from public.appearance_encoders where signature=new.encoder_signature;
  select * into strict source from public.assets where workspace_id=new.workspace_id and id=new.asset_id;
  if source.status<>'ready' or source.deleted_at is not null or source.mime_type not like 'image/%'
     or source.checksum is distinct from new.content_sha256 then
    raise exception 'Embedding source must be a ready image with the verified content checksum' using errcode='23514';
  end if;
  if array_ndims(new.color_embedding) is distinct from 1 or array_lower(new.color_embedding,1)<>1
     or cardinality(new.color_embedding)<>encoder.color_dimension
     or exists(select 1 from unnest(new.color_embedding) x where x is null or not(x between 0 and 1.0001)) then
    raise exception 'Invalid color embedding dimensions or values' using errcode='23514';
  end if;
  if array_ndims(new.design_embedding) is distinct from 1 or array_lower(new.design_embedding,1)<>1
     or cardinality(new.design_embedding)<>encoder.design_dimension
     or exists(select 1 from unnest(new.design_embedding) x where x is null or not(x between -1.0001 and 1.0001)) then
    raise exception 'Invalid design embedding dimensions or values' using errcode='23514';
  end if;
  select sum(x::double precision*x::double precision) into norm from unnest(new.color_embedding) x;
  if abs(norm-1)>0.005 then raise exception 'Color embedding must have unit L2 norm' using errcode='23514'; end if;
  select sum(x::double precision*x::double precision) into norm from unnest(new.design_embedding) x;
  if abs(norm-1)>0.005 then raise exception 'Design embedding must have unit L2 norm' using errcode='23514'; end if;
  return new;
end $$;
create trigger validate_appearance_embedding before insert on public.asset_appearance_embeddings
  for each row execute function studio_private.validate_appearance_embedding();
create function studio_private.prevent_feature_update() returns trigger
language plpgsql set search_path='' as $$
begin
  if new is distinct from old then raise exception 'Feature records are immutable; use a new signature or content hash' using errcode='23514'; end if;
  return new;
end $$;
create trigger immutable_encoder before update on public.appearance_encoders
  for each row execute function studio_private.prevent_feature_update();
create trigger immutable_embedding before update on public.asset_appearance_embeddings
  for each row execute function studio_private.prevent_feature_update();
create trigger immutable_bf_evaluation before update on public.brand_fit_evaluations
  for each row execute function studio_private.prevent_feature_update();

create function studio_private.bump_brand_pool_revision() returns trigger
language plpgsql set search_path='' as $$
begin
  if tg_op='UPDATE' then
    if (new.workspace_id,new.brand_id,new.asset_id) is distinct from (old.workspace_id,old.brand_id,old.asset_id) then
      raise exception 'Brand example identity is immutable' using errcode='23514';
    end if;
    if (new.case_type,new.source,new.feedback_reasons) is not distinct from (old.case_type,old.source,old.feedback_reasons) then return new; end if;
  end if;
  if tg_op='DELETE' then
    update public.brands set pool_revision=pool_revision+1 where workspace_id=old.workspace_id and id=old.brand_id;
    return old;
  end if;
  update public.brands set pool_revision=pool_revision+1 where workspace_id=new.workspace_id and id=new.brand_id;
  return new;
end $$;
create trigger bump_brand_pool_revision after insert or update or delete on public.brand_assets
  for each row execute function studio_private.bump_brand_pool_revision();
create function studio_private.bump_asset_pool_revision() returns trigger
language plpgsql set search_path='' as $$
begin
  if (new.checksum,new.status,new.deleted_at) is distinct from (old.checksum,old.status,old.deleted_at) then
    update public.brands b set pool_revision=pool_revision+1 where b.workspace_id=new.workspace_id
      and exists(select 1 from public.brand_assets a where a.workspace_id=b.workspace_id and a.brand_id=b.id and a.asset_id=new.id);
  end if;
  return new;
end $$;
create trigger bump_asset_pool_revision after update on public.assets
  for each row execute function studio_private.bump_asset_pool_revision();

-- Existing Pool contents are the initial revision. NULL labels remain NULL.
update public.brands b set pool_revision=(select count(*) from public.brand_assets a where a.workspace_id=b.workspace_id and a.brand_id=b.id);

create index appearance_embeddings_lookup on public.asset_appearance_embeddings(workspace_id,encoder_signature,normalized_image_sha256);
create index pool_snapshots_recent on public.brand_pool_snapshots(workspace_id,brand_id,created_at desc);
create index pool_examples_workspace on public.brand_pool_snapshot_examples(workspace_id,snapshot_id);
create index bf_evaluations_asset on public.brand_fit_evaluations(workspace_id,generated_asset_id,evaluated_at desc);

alter table public.appearance_encoders enable row level security;
revoke all on public.appearance_encoders from anon,authenticated;
grant select on public.appearance_encoders to authenticated;
grant all on public.appearance_encoders to service_role;
create policy read_encoder_metadata on public.appearance_encoders for select to authenticated using(true);
do $$
declare t text;
begin
  foreach t in array array['asset_appearance_embeddings','brand_pool_snapshots','brand_pool_snapshot_examples','brand_fit_evaluations'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon,authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('grant all on public.%I to service_role',t);
    execute format('create policy read_workspace on public.%I for select to authenticated using (studio_private.is_member(workspace_id))',t);
  end loop;
end $$;

-- Functions below finalize snapshots and preserve the existing app RPC contract.
create function studio_private.require_brandfit_scope(p_workspace uuid,p_owner uuid) returns void
language plpgsql set search_path='' as $$
begin
  if not exists(select 1 from public.workspace_members m join public.workspaces w on w.id=m.workspace_id
    where m.workspace_id=p_workspace and m.user_id=p_owner and m.role in ('owner','admin','member') and w.deleted_at is null) then
    raise exception 'Workspace membership required' using errcode='42501';
  end if;
end $$;

create function studio_private.protect_pool_example() returns trigger
language plpgsql set search_path='' as $$
declare target_snapshot uuid; target_workspace uuid; sealed timestamptz;
begin
  if tg_op='DELETE' then target_snapshot:=old.snapshot_id;target_workspace:=old.workspace_id;
  else target_snapshot:=new.snapshot_id;target_workspace:=new.workspace_id; end if;
  if tg_op='UPDATE' and (new.workspace_id,new.snapshot_id,new.asset_id) is distinct from (old.workspace_id,old.snapshot_id,old.asset_id) then
    raise exception 'Snapshot example identity is immutable' using errcode='23514';
  end if;
  select sealed_at into sealed from public.brand_pool_snapshots where workspace_id=target_workspace and id=target_snapshot for update;
  if not found then raise exception 'Snapshot not found' using errcode='23503'; end if;
  if sealed is not null then raise exception 'Sealed Pool examples are immutable' using errcode='23514'; end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
create trigger protect_pool_example before insert or update or delete on public.brand_pool_snapshot_examples
  for each row execute function studio_private.protect_pool_example();

create function studio_private.seal_pool_snapshot() returns trigger
language plpgsql set search_path='' as $$
declare examples jsonb; representatives integer; canonical_count integer;
begin
  if tg_op='DELETE' then raise exception 'Pool snapshots are retained for evaluation provenance' using errcode='23514'; end if;
  if old.sealed_at is not null or new.sealed_at is null
    or (to_jsonb(new)-array['sealed_at','fingerprint','example_count','positive_count','negative_count'])
       is distinct from (to_jsonb(old)-array['sealed_at','fingerprint','example_count','positive_count','negative_count']) then
    raise exception 'Pool snapshots can only be sealed once' using errcode='23514';
  end if;
  if exists(select 1 from public.brand_pool_snapshot_examples where snapshot_id=old.id
    group by normalized_image_sha256 having count(distinct label)>1) then
    raise exception 'The same normalized image cannot have opposite Pool labels' using errcode='23514';
  end if;
  select count(*),count(*) filter(where is_representative and label='positive'),count(*) filter(where is_representative and label='negative'),
    count(*) filter(where is_representative),count(distinct normalized_image_sha256)
  into new.example_count,new.positive_count,new.negative_count,representatives,canonical_count
  from public.brand_pool_snapshot_examples where snapshot_id=old.id;
  if representatives<>canonical_count then raise exception 'Every canonical image needs one representative' using errcode='23514'; end if;
  select coalesce(jsonb_agg(to_jsonb(e)-array['workspace_id','snapshot_id'] order by e.asset_id),'[]'::jsonb)
  into examples from public.brand_pool_snapshot_examples e where e.snapshot_id=old.id;
  new.fingerprint:=encode(sha256(convert_to(jsonb_build_object('workspace_id',new.workspace_id,'brand_id',new.brand_id,
    'pool_revision',new.pool_revision,'encoder_signature',new.encoder_signature,'examples',examples)::text,'UTF8')),'hex');
  return new;
end $$;
create trigger seal_pool_snapshot before update or delete on public.brand_pool_snapshots
  for each row execute function studio_private.seal_pool_snapshot();

create function public.studio_create_brand_pool_snapshot(
  p_workspace uuid,p_owner uuid,p_brand uuid,p_encoder_signature text,p_expected_revision bigint default null
) returns jsonb language plpgsql set search_path='' as $$
declare revision bigint; snapshot public.brand_pool_snapshots; examples jsonb;
begin
  perform studio_private.require_brandfit_scope(p_workspace,p_owner);
  select pool_revision into revision from public.brands where workspace_id=p_workspace and id=p_brand and deleted_at is null for update;
  if not found then raise exception 'Active brand not found' using errcode='23503'; end if;
  if p_expected_revision is not null and p_expected_revision<>revision then raise exception 'Brand Pool changed' using errcode='40001'; end if;
  if not exists(select 1 from public.appearance_encoders where signature=p_encoder_signature) then
    raise exception 'Register the resolved encoder signature first' using errcode='22023';
  end if;
  -- Never silently reuse a previous image version or omit an unencoded eligible case.
  if exists(select 1 from public.brand_assets b join public.assets a on a.workspace_id=b.workspace_id and a.id=b.asset_id
    left join public.asset_appearance_embeddings e on e.workspace_id=a.workspace_id and e.asset_id=a.id
      and e.content_sha256=a.checksum and e.encoder_signature=p_encoder_signature
    where b.workspace_id=p_workspace and b.brand_id=p_brand and b.case_type is not null
      and a.status='ready' and a.deleted_at is null and (a.mime_type not like 'image/%' or a.checksum is null or e.id is null)) then
    raise exception 'Brand Pool embeddings are not ready for this encoder/content version' using errcode='40001';
  end if;
  select * into snapshot from public.brand_pool_snapshots where workspace_id=p_workspace and brand_id=p_brand
    and pool_revision=revision and encoder_signature=p_encoder_signature and sealed_at is not null;
  if found then return to_jsonb(snapshot); end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.asset_id),'[]'::jsonb) into examples from (
    select b.asset_id,e.id as embedding_id,e.content_sha256,e.normalized_image_sha256,e.encoder_signature,
      b.case_type as label,b.source,b.feedback_reasons,
      row_number() over(partition by e.normalized_image_sha256 order by b.asset_id)=1 as is_representative
    from public.brand_assets b join public.assets a on a.workspace_id=b.workspace_id and a.id=b.asset_id
    join public.asset_appearance_embeddings e on e.workspace_id=a.workspace_id and e.asset_id=a.id
      and e.content_sha256=a.checksum and e.encoder_signature=p_encoder_signature
    where b.workspace_id=p_workspace and b.brand_id=p_brand and b.case_type is not null and a.status='ready' and a.deleted_at is null
  ) x;
  if exists(select 1 from jsonb_array_elements(examples) e group by e->>'normalized_image_sha256' having count(distinct(e->>'label'))>1) then
    raise exception 'Conflicting labels for one normalized image; resolve the examples first' using errcode='40001';
  end if;
  insert into public.brand_pool_snapshots(workspace_id,brand_id,pool_revision,encoder_signature)
    values(p_workspace,p_brand,revision,p_encoder_signature) returning * into snapshot;
  insert into public.brand_pool_snapshot_examples(workspace_id,snapshot_id,asset_id,embedding_id,content_sha256,normalized_image_sha256,
    encoder_signature,label,source,feedback_reasons,is_representative)
  select p_workspace,snapshot.id,x.asset_id,x.embedding_id,x.content_sha256,x.normalized_image_sha256,x.encoder_signature,
    x.label,x.source,x.feedback_reasons,x.is_representative from jsonb_to_recordset(examples) as x(
      asset_id uuid,embedding_id uuid,content_sha256 text,normalized_image_sha256 text,encoder_signature text,
      label text,source text,feedback_reasons text[],is_representative boolean);
  update public.brand_pool_snapshots set sealed_at=now() where id=snapshot.id returning * into snapshot;
  return to_jsonb(snapshot);
end $$;

create function studio_private.validate_bf_evaluation() returns trigger
language plpgsql set search_path='' as $$
declare snapshot public.brand_pool_snapshots; source public.assets;
begin
  if new.snapshot_id is not null then
    select * into strict snapshot from public.brand_pool_snapshots where workspace_id=new.workspace_id and id=new.snapshot_id;
    if snapshot.sealed_at is null then raise exception 'Evaluation requires a sealed snapshot' using errcode='23514'; end if;
    if new.status='scored' and (snapshot.positive_count=0
      or (snapshot.negative_count>0 and new.negative_similarity is null)
      or (snapshot.negative_count=0 and new.negative_similarity is not null)) then
      raise exception 'Scored evaluation does not match positive/negative Pool availability' using errcode='23514';
    end if;
  end if;
  if new.generated_embedding_id is not null then
    select * into strict source from public.assets where workspace_id=new.workspace_id and id=new.generated_asset_id;
    if source.status<>'ready' or source.deleted_at is not null or source.checksum is distinct from new.result_content_sha256 then
      raise exception 'Result image content changed before evaluation was saved' using errcode='23514';
    end if;
  end if;
  return new;
end $$;
create trigger validate_bf_evaluation before insert on public.brand_fit_evaluations
  for each row execute function studio_private.validate_bf_evaluation();

create function public.studio_brandfit_feedback(
  p_workspace uuid,p_owner uuid,p_brand uuid,p_asset uuid,p_label text,p_reasons text[] default '{}',p_expected_revision bigint default null
) returns jsonb language plpgsql set search_path='' as $$
declare revision bigint; reasons text[]; previous_revision bigint;
begin
  perform studio_private.require_brandfit_scope(p_workspace,p_owner);
  select pool_revision into revision from public.brands where workspace_id=p_workspace and id=p_brand and deleted_at is null for update;
  if not found then raise exception 'Active brand not found' using errcode='23503'; end if;
  if p_expected_revision is not null and revision<>p_expected_revision then raise exception 'Brand Pool changed' using errcode='40001'; end if;
  if p_label is null or p_label not in ('positive','negative') then raise exception 'Feedback must have a polarity' using errcode='22023'; end if;
  select coalesce(array_agg(distinct x order by x),'{}'::text[]) into reasons from unnest(p_reasons) x;
  if p_label='negative' and not('bf'=any(reasons)) then raise exception 'Only BF-negative feedback may enter the negative Pool' using errcode='23514'; end if;
  if not exists(select 1 from public.assets where workspace_id=p_workspace and id=p_asset and status='ready' and deleted_at is null and mime_type like 'image/%') then
    raise exception 'Feedback requires a ready image in the same workspace' using errcode='23503';
  end if;
  previous_revision:=revision;
  insert into public.brand_assets(workspace_id,brand_id,asset_id,name,case_type,source,feedback_reasons)
    values(p_workspace,p_brand,p_asset,'',p_label,'feedback',reasons)
  on conflict(brand_id,asset_id) do update set case_type=excluded.case_type,source=excluded.source,feedback_reasons=excluded.feedback_reasons
    where public.brand_assets.workspace_id=p_workspace;
  select pool_revision into revision from public.brands where workspace_id=p_workspace and id=p_brand;
  if revision<>previous_revision then
    update public.brands set lock_version=lock_version+1 where workspace_id=p_workspace and id=p_brand;
  end if;
  return jsonb_build_object('pool_revision',revision);
end $$;

-- Incremental brand writes keep feedback provenance and do not invalidate an
-- unchanged Pool just because a brand was renamed or thumbnails reordered.
create function studio_private.save_brand_with_pool(p_workspace uuid,p_owner uuid,p_data jsonb) returns jsonb
language plpgsql set search_path='' as $$
declare entity uuid:=(p_data->>'id')::uuid; expected bigint:=coalesce((p_data->>'expected_version')::bigint,0);
  current_version bigint; item jsonb;
begin
  perform studio_private.require_brandfit_scope(p_workspace,p_owner);
  perform pg_advisory_xact_lock(hashtextextended(p_workspace::text||'brand'||entity::text,0));
  select lock_version into current_version from public.brands where workspace_id=p_workspace and id=entity and deleted_at is null for update;
  if current_version is null then
    if expected<>0 or exists(select 1 from public.brands where id=entity) then raise exception 'Brand changed' using errcode='40001'; end if;
    insert into public.brands(id,workspace_id,created_by,name) values(entity,p_workspace,p_owner,p_data->>'name') returning lock_version into current_version;
  else
    if current_version<>expected then raise exception 'Brand changed' using errcode='40001'; end if;
    update public.brands set name=p_data->>'name',lock_version=lock_version+1 where id=entity returning lock_version into current_version;
  end if;
  if exists(select 1 from jsonb_array_elements(p_data->'images') x group by x->>'asset_id' having count(*)>1) then
    raise exception 'Duplicate brand image' using errcode='23505';
  end if;
  delete from public.brand_assets where workspace_id=p_workspace and brand_id=entity
    and asset_id not in(select (value->>'asset_id')::uuid from jsonb_array_elements(p_data->'images'));
  for item in select value from jsonb_array_elements(p_data->'images') loop
    insert into public.brand_assets(workspace_id,brand_id,asset_id,name,case_type,position)
      values(p_workspace,entity,(item->>'asset_id')::uuid,item->>'name',item->>'case_type',(item->>'position')::integer)
    on conflict(brand_id,asset_id) do update set name=excluded.name,case_type=excluded.case_type,position=excluded.position
      where public.brand_assets.workspace_id=p_workspace;
  end loop;
  return jsonb_build_object('version',current_version);
end $$;

-- Keep all existing callers on the same public RPC. The previous implementation
-- remains private and only handles operations other than brand writes.
alter function public.studio_commit(uuid,uuid,text,jsonb) set schema studio_private;
alter function studio_private.studio_commit(uuid,uuid,text,jsonb) rename to studio_commit_20261125;
create function public.studio_commit(p_workspace uuid,p_owner uuid,p_operation text,p_data jsonb)
returns jsonb language plpgsql set search_path='' as $$
begin
  if p_operation='brand' then return studio_private.save_brand_with_pool(p_workspace,p_owner,p_data); end if;
  return studio_private.studio_commit_20261125(p_workspace,p_owner,p_operation,p_data);
end $$;
grant usage on schema studio_private to service_role;
revoke all on function public.studio_commit(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.studio_commit(uuid,uuid,text,jsonb) to service_role;
revoke all on function public.studio_create_brand_pool_snapshot(uuid,uuid,uuid,text,bigint) from public,anon,authenticated;
grant execute on function public.studio_create_brand_pool_snapshot(uuid,uuid,uuid,text,bigint) to service_role;
revoke all on function public.studio_brandfit_feedback(uuid,uuid,uuid,uuid,text,text[],bigint) from public,anon,authenticated;
grant execute on function public.studio_brandfit_feedback(uuid,uuid,uuid,uuid,text,text[],bigint) to service_role;
revoke all on function studio_private.require_brandfit_scope(uuid,uuid),studio_private.save_brand_with_pool(uuid,uuid,jsonb),
  studio_private.validate_appearance_embedding(),studio_private.prevent_feature_update(),studio_private.bump_brand_pool_revision(),
  studio_private.bump_asset_pool_revision(),studio_private.protect_pool_example(),studio_private.seal_pool_snapshot(),studio_private.validate_bf_evaluation()
  from public,anon,authenticated;
grant execute on function studio_private.require_brandfit_scope(uuid,uuid),studio_private.save_brand_with_pool(uuid,uuid,jsonb),
  studio_private.studio_commit_20261125(uuid,uuid,text,jsonb) to service_role;

comment on column public.brands.pool_revision is 'BF Pool change counter, separate from UI lock_version; not a historical brand guide version.';
comment on table public.asset_appearance_embeddings is 'Reusable per-asset/per-content/per-encoder features. Arrays remain individual examples; no mean brand vector.';
comment on table public.brand_pool_snapshots is 'Sealed, immutable evaluation Pool manifest. NULL brand labels are not automatically positive.';
comment on column public.brand_pool_snapshot_examples.is_representative is 'One representative per normalized PNG hash; aliases remain for provenance without double weighting.';
comment on table public.brand_fit_evaluations is 'BF-only results, independent of existing Fidelity image_evaluations. No selected Pool means not_applicable, not zero.';
commit;
