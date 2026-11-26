begin;
create table public.brand_analyses (
 workspace_id uuid not null references public.workspaces(id),
 brand_id uuid not null,
 status text not null default 'not_started' check(status in ('not_started','insufficient_data','queued','running','ready','failed')),
 result jsonb check(result is null or jsonb_typeof(result)='object'),
 error text,
 run_id uuid,
 trigger text not null default 'initial' check(trigger in ('initial','manual')),
 requested_at timestamptz,
 completed_at timestamptz,
 updated_at timestamptz not null default now(),
 primary key(workspace_id,brand_id),
 foreign key(workspace_id,brand_id) references public.brands(workspace_id,id),
 check(status<>'ready' or result is not null)
);
alter table public.brand_analyses enable row level security;
revoke all on public.brand_analyses from anon,authenticated;
grant select on public.brand_analyses to authenticated;
grant all on public.brand_analyses to service_role;
create policy read_workspace on public.brand_analyses for select to authenticated using(studio_private.is_member(workspace_id));

create function public.studio_request_brand_analysis(p_workspace uuid,p_owner uuid,p_brand uuid,p_trigger text)
returns jsonb language plpgsql set search_path='' as $$
declare analysis public.brand_analyses; image_count integer;
begin
 perform studio_private.require_brandfit_scope(p_workspace,p_owner);
 if p_trigger not in ('initial','manual') or p_trigger is null then raise exception 'Invalid trigger' using errcode='22023'; end if;
 perform 1 from public.brands where workspace_id=p_workspace and id=p_brand and deleted_at is null for update;
 if not found then raise exception 'Brand not found' using errcode='23503'; end if;
 select * into analysis from public.brand_analyses where workspace_id=p_workspace and brand_id=p_brand for update;
 if found and (analysis.status in ('queued','running') or (p_trigger='initial' and (analysis.result is not null or analysis.status='failed'))) then
   return to_jsonb(analysis)||jsonb_build_object('started',false);
 end if;
 select count(*) into image_count from public.brand_assets b join public.assets a on a.workspace_id=b.workspace_id and a.id=b.asset_id
 where b.workspace_id=p_workspace and b.brand_id=p_brand and b.case_type='positive' and a.status='ready' and a.deleted_at is null;
 if image_count<20 then
   return jsonb_build_object('status','insufficient_data','result',analysis.result,'error',null,'started',false);
 end if;
 insert into public.brand_analyses(workspace_id,brand_id,status,run_id,trigger,requested_at,updated_at)
 values(p_workspace,p_brand,'queued',gen_random_uuid(),p_trigger,now(),now())
 on conflict(workspace_id,brand_id) do update set status='queued',run_id=excluded.run_id,trigger=excluded.trigger,requested_at=now(),completed_at=null,error=null,updated_at=now()
 returning * into analysis;
 return to_jsonb(analysis)||jsonb_build_object('started',true);
end $$;
revoke all on function public.studio_request_brand_analysis(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.studio_request_brand_analysis(uuid,uuid,uuid,text) to service_role;
create function public.studio_finish_brand_analysis(p_workspace uuid,p_owner uuid,p_brand uuid,p_run uuid,p_status text,p_result jsonb default null,p_error text default null)
returns boolean language plpgsql set search_path='' as $$
begin
 perform studio_private.require_brandfit_scope(p_workspace,p_owner);
 if p_status not in ('running','ready','failed','insufficient_data') or p_status is null then raise exception 'Invalid analysis state' using errcode='22023'; end if;
 if p_status='ready' and (p_result is null or jsonb_typeof(p_result)<>'object') then raise exception 'Completed analysis requires a result' using errcode='23514'; end if;
 update public.brand_analyses a set status=p_status,
   result=case when p_status='ready' then p_result else a.result end,
   error=case when p_status='failed' then p_error else null end,
   completed_at=case when p_status in ('ready','failed','insufficient_data') then now() else a.completed_at end,
   updated_at=now()
 where a.workspace_id=p_workspace and a.brand_id=p_brand and a.run_id=p_run
   and a.status in ('queued','running')
   and exists(select 1 from public.brands b where b.workspace_id=p_workspace and b.id=p_brand and b.deleted_at is null);
 return found;
end $$;
revoke all on function public.studio_finish_brand_analysis(uuid,uuid,uuid,uuid,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.studio_finish_brand_analysis(uuid,uuid,uuid,uuid,text,jsonb,text) to service_role;
comment on table public.brand_analyses is 'Latest brand color analysis plus durable asynchronous run state; older successful result is retained during refresh/failure.';
notify pgrst,'reload schema';
commit;
