-- Current image scores and current brand aggregates only; no Pool history.
begin;
alter table public.image_evaluations rename column status to fidelity_status;
alter table public.image_evaluations rename column score to fidelity;
alter table public.image_evaluations rename column model_version to fidelity_version;
alter table public.image_evaluations rename column reason to fidelity_reason;
alter table public.image_evaluations drop constraint image_evaluations_check;
alter table public.image_evaluations alter column fidelity_status drop not null;
alter table public.image_evaluations add column brand_id uuid,
  add foreign key(workspace_id,brand_id) references public.brands(workspace_id,id);
alter table public.image_evaluations add column bf numeric, add column bf_status text, add column bf_reason text, add column bf_version text;
alter table public.image_evaluations add column tq numeric, add column tq_status text, add column tq_reason text, add column tq_version text;
alter table public.image_evaluations add column overall numeric, add column overall_status text, add column overall_reason text, add column overall_version text;
-- Retain just the latest Fidelity result per generated asset.
delete from public.image_evaluations e using (
  select id,row_number() over(partition by workspace_id,asset_id order by evaluated_at desc,id desc) as n
  from public.image_evaluations
) d where e.id=d.id and d.n>1;
alter table public.image_evaluations add constraint one_current_image_evaluation unique(workspace_id,asset_id);
-- Merge the latest BF result, if any, before removing the superseded tables.
insert into public.image_evaluations(workspace_id,asset_id,ai_run_id,brand_id,bf,bf_status,bf_reason,bf_version,evaluated_at)
select distinct on(workspace_id,generated_asset_id) workspace_id,generated_asset_id,ai_run_id,brand_id,score,status,reason,scoring_version,evaluated_at
from public.brand_fit_evaluations order by workspace_id,generated_asset_id,evaluated_at desc,id desc
on conflict(workspace_id,asset_id) do update set brand_id=excluded.brand_id,bf=excluded.bf,bf_status=excluded.bf_status,
 bf_reason=excluded.bf_reason,bf_version=excluded.bf_version,evaluated_at=greatest(public.image_evaluations.evaluated_at,excluded.evaluated_at);
create function studio_private.valid_current_score(v numeric,s text,r text,version text) returns boolean
language sql immutable set search_path='' as $$
 select coalesce(
   (s is null and v is null and r is null and version is null)
   or (s='scored' and v is not null and v between 0 and 100 and nullif(trim(version),'') is not null and r is null)
   or (s in ('unavailable','not_applicable') and v is null and nullif(trim(r),'') is not null),false)
$$;
grant execute on function studio_private.valid_current_score(numeric,text,text,text) to authenticated,service_role;
alter table public.image_evaluations add constraint valid_fidelity_current_score check(studio_private.valid_current_score(fidelity,fidelity_status,fidelity_reason,fidelity_version));
alter table public.image_evaluations add constraint valid_bf_current_score check(studio_private.valid_current_score(bf,bf_status,bf_reason,bf_version));
alter table public.image_evaluations add constraint valid_tq_current_score check(studio_private.valid_current_score(tq,tq_status,tq_reason,tq_version));
alter table public.image_evaluations add constraint valid_overall_current_score check(studio_private.valid_current_score(overall,overall_status,overall_reason,overall_version));
alter table public.image_evaluations add constraint fidelity_requires_original check(fidelity_status is distinct from 'scored' or original_asset_id is not null),
 add constraint bf_requires_brand check(bf_status is distinct from 'scored' or brand_id is not null);
-- Adapt the existing atomic history RPC without changing its browser payload.
do $patch$
declare definition text; previous text:=$old$insert into public.image_evaluations(id,workspace_id,asset_id,original_asset_id,status,score,model_version,reason)
        values((input->>'id')::uuid,p_workspace,(item->>'asset_id')::uuid,nullif(input->>'original_asset_id','')::uuid,input->>'status',(input->>'score')::numeric,input->>'model_version',input->>'reason') on conflict(id) do nothing;$old$;
 replacement text:=$new$insert into public.image_evaluations(id,workspace_id,asset_id,original_asset_id,fidelity_status,fidelity,fidelity_version,fidelity_reason)
        values((input->>'id')::uuid,p_workspace,(item->>'asset_id')::uuid,nullif(input->>'original_asset_id','')::uuid,input->>'status',(input->>'score')::numeric,input->>'model_version',input->>'reason')
        on conflict(workspace_id,asset_id) do update set original_asset_id=excluded.original_asset_id,
          fidelity_status=excluded.fidelity_status,fidelity=excluded.fidelity,fidelity_version=excluded.fidelity_version,
          fidelity_reason=excluded.fidelity_reason,evaluated_at=now()
        where (public.image_evaluations.original_asset_id,public.image_evaluations.fidelity_status,public.image_evaluations.fidelity,public.image_evaluations.fidelity_version,public.image_evaluations.fidelity_reason)
          is distinct from (excluded.original_asset_id,excluded.fidelity_status,excluded.fidelity,excluded.fidelity_version,excluded.fidelity_reason);$new$;
begin
 select pg_get_functiondef('studio_private.studio_commit_20261125(uuid,uuid,text,jsonb)'::regprocedure) into definition;
 -- Normalize line endings for migrations applied from Windows checkouts.
 definition:=replace(definition,chr(13),'');
 if position(previous in definition)=0 then raise exception 'History RPC definition differs; refusing partial upgrade'; end if;
 execute replace(definition,previous,replacement);
end $patch$;

drop function public.studio_create_brand_pool_snapshot(uuid,uuid,uuid,text,bigint);
drop table public.brand_fit_evaluations;
drop table public.brand_pool_snapshot_examples;
drop table public.brand_pool_snapshots;
drop table public.asset_appearance_embeddings;
drop table public.appearance_encoders;
drop function studio_private.validate_bf_evaluation();
drop function studio_private.protect_pool_example();
drop function studio_private.seal_pool_snapshot();
drop function studio_private.validate_appearance_embedding();
drop function studio_private.prevent_feature_update();

create table public.brand_embeddings(
 workspace_id uuid not null,
 brand_id uuid not null,
 pool_revision bigint not null check(pool_revision>=0),
 encoder_signature text not null check(length(trim(encoder_signature)) between 1 and 512),
 encoder_config jsonb not null check(jsonb_typeof(encoder_config)='object'
   and nullif(trim(encoder_config->>'model_name'),'') is not null
   and coalesce(encoder_config->>'resolved_revision','') ~ '^[0-9a-f]{40,64}$'
   and nullif(trim(encoder_config->>'feature_version'),'') is not null
   and nullif(trim(encoder_config->>'preprocessing_version'),'') is not null),
 aggregation_version text not null check(length(trim(aggregation_version))>0),
 color_dimension integer not null default 512 check(color_dimension between 1 and 4096),
 design_dimension integer not null default 384 check(design_dimension between 1 and 4096),
 positive_count integer not null check(positive_count>=0),
 negative_count integer not null check(negative_count>=0),
 positive_color_sum double precision[] not null,
 positive_design_sum double precision[] not null,
 negative_color_sum double precision[] not null,
 negative_design_sum double precision[] not null,
 updated_at timestamptz not null default now(),
 primary key(workspace_id,brand_id),
 foreign key(workspace_id,brand_id) references public.brands(workspace_id,id)
);
create function studio_private.validate_brand_aggregate() returns trigger language plpgsql set search_path='' as $$
declare revision bigint; vec double precision[]; n integer; dim integer; norm_squared double precision; i integer;
begin
 if tg_op='UPDATE' and (new.workspace_id,new.brand_id) is distinct from (old.workspace_id,old.brand_id) then
   raise exception 'Aggregate identity is immutable' using errcode='23514'; end if;
 select pool_revision into revision from public.brands where workspace_id=new.workspace_id and id=new.brand_id and deleted_at is null for update;
 if not found then raise exception 'Active brand not found' using errcode='23503'; end if;
 if revision<>new.pool_revision then raise exception 'Brand changed while aggregating' using errcode='40001'; end if;
 for i in 1..4 loop
   if i<=2 then n:=new.positive_count; else n:=new.negative_count; end if;
   if i in(1,3) then dim:=new.color_dimension; else dim:=new.design_dimension; end if;
   vec:=case i when 1 then new.positive_color_sum when 2 then new.positive_design_sum when 3 then new.negative_color_sum else new.negative_design_sum end;
   if array_ndims(vec) is distinct from 1 or array_lower(vec,1)<>1 or cardinality(vec)<>dim
     or exists(select 1 from unnest(vec) x where x is null or not(x between -n::double precision and n::double precision))
     or (i in(1,3) and exists(select 1 from unnest(vec) x where x<0)) then
     raise exception 'Invalid aggregate dimensions or values' using errcode='23514'; end if;
   select sum(x*x) into norm_squared from unnest(vec) x;
   if norm_squared>n::double precision*n::double precision+0.005 or (n=1 and abs(norm_squared-1)>0.005) then
     raise exception 'Aggregate is inconsistent with normalized examples/count' using errcode='23514'; end if;
 end loop;
 new.updated_at:=clock_timestamp();
 return new;
end $$;
create trigger validate_brand_aggregate before insert or update on public.brand_embeddings
 for each row execute function studio_private.validate_brand_aggregate();
alter table public.brand_embeddings enable row level security;
revoke all on public.brand_embeddings from anon,authenticated;
grant select on public.brand_embeddings to authenticated;
grant all on public.brand_embeddings to service_role;
create policy read_workspace on public.brand_embeddings for select to authenticated using(studio_private.is_member(workspace_id));
revoke all on function studio_private.validate_brand_aggregate() from public,anon,authenticated;
comment on table public.brand_embeddings is 'One current aggregate per brand; sums/counts reconstruct four directions and concentrations in O(d). No historical Pool or per-image embeddings.';
comment on table public.image_evaluations is 'One current row per generated asset; Fidelity/BF/TQ/overall scores. Re-evaluation updates existing fields, no diagnostic or Pool history.';
notify pgrst,'reload schema';
commit;
