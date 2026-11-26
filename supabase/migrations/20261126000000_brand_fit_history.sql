-- Persist BF atomically with generation history, preserving other score fields.
begin;
do $patch$
declare definition text;
 marker text := $old$      if item->>'asset_id' is not null then$old$;
 replacement text := $new$      if item->'brand_evaluation' is not null and item->'brand_evaluation'<>'null'::jsonb then
        input:=item->'brand_evaluation';
        insert into public.image_evaluations(workspace_id,asset_id,brand_id,bf_status,bf,bf_version,bf_reason)
        values(p_workspace,(item->>'asset_id')::uuid,nullif(input->>'brand_id','')::uuid,
          input->>'status',(input->>'score')::numeric,input->>'model_version',input->>'reason')
        on conflict(workspace_id,asset_id) do update set brand_id=excluded.brand_id,
          bf_status=excluded.bf_status,bf=excluded.bf,bf_version=excluded.bf_version,
          bf_reason=excluded.bf_reason,evaluated_at=now()
        where (public.image_evaluations.brand_id,public.image_evaluations.bf_status,public.image_evaluations.bf,public.image_evaluations.bf_version,public.image_evaluations.bf_reason)
          is distinct from (excluded.brand_id,excluded.bf_status,excluded.bf,excluded.bf_version,excluded.bf_reason);
      end if;
      if item->>'asset_id' is not null then$new$;
begin
 select replace(pg_get_functiondef('studio_private.studio_commit_20261125(uuid,uuid,text,jsonb)'::regprocedure),chr(13),'') into definition;
 if position(marker in definition)=0 then raise exception 'History RPC definition differs; refusing partial upgrade'; end if;
 execute replace(definition,marker,replacement);
end $patch$;
commit;
