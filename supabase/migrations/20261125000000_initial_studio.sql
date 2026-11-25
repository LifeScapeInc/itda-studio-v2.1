-- R2 stores bytes; public.assets stores stable object keys, never signed URLs.
-- All writes except personal bookmarks/sessions go through a trusted server.
begin;

create schema if not exists studio_private;
revoke all on schema studio_private from public;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id),
  user_id uuid not null references public.users(id),
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  created_by uuid not null references public.users(id),
  bucket text not null check (length(trim(bucket)) > 0),
  object_key text not null check (length(trim(object_key)) > 0),
  filename text not null,
  mime_type text not null,
  byte_size bigint check (byte_size >= 0),
  width integer check (width > 0),
  height integer check (height > 0),
  checksum text,
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed', 'deleted')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (bucket, object_key), unique (workspace_id, id)
);
create table public.request_cases (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  created_by uuid not null references public.users(id),
  source_system text,
  external_case_id text,
  name text not null,
  customer_name text,
  email text,
  service_label text,
  status text not null default 'draft',
  delivery_due_date date,
  request_data jsonb not null default '{}' check (jsonb_typeof(request_data) = 'object'),
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((source_system is null) = (external_case_id is null)),
  unique (workspace_id, source_system, external_case_id), unique (workspace_id, id)
);
create table public.request_case_assets (
  workspace_id uuid not null,
  case_id uuid not null,
  asset_id uuid not null,
  role text not null default 'attachment',
  position integer not null default 0 check (position >= 0),
  primary key (case_id, asset_id, role),
  foreign key (workspace_id, case_id) references public.request_cases(workspace_id, id),
  foreign key (workspace_id, asset_id) references public.assets(workspace_id, id)
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  created_by uuid not null references public.users(id),
  case_id uuid,
  name text not null check (length(trim(name)) > 0),
  work_type text not null check (work_type in ('detail_page', 'studio_cut')),
  stage text not null default 'draft' check (stage in ('draft', 'final')),
  manager text not null default '',
  company text not null default '',
  email text not null default '',
  delivery_due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (workspace_id, id),
  foreign key (workspace_id, case_id) references public.request_cases(workspace_id, id)
);
create table public.project_works (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  project_id uuid,
  created_by uuid not null references public.users(id),
  kind text not null check (kind in ('studio_cut', 'detail_page')),
  title text not null default '새 작업',
  status text not null default 'draft' check (status in ('draft', 'final', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (workspace_id, id),
  foreign key (workspace_id, project_id) references public.projects(workspace_id, id)
);
create table public.work_revisions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  work_id uuid not null,
  revision_number integer not null check (revision_number > 0),
  schema_version integer not null default 1 check (schema_version > 0),
  state jsonb not null default '{}' check (jsonb_typeof(state) = 'object'),
  is_draft boolean not null default true,
  lock_version bigint not null default 1 check (lock_version > 0),
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (work_id, revision_number), unique (workspace_id, id), unique (workspace_id, work_id, id),
  foreign key (workspace_id, work_id) references public.project_works(workspace_id, id)
);
create unique index one_draft_per_work on public.work_revisions(work_id) where is_draft;
create table public.work_revision_assets (
  workspace_id uuid not null,
  revision_id uuid not null,
  asset_id uuid not null,
  role text not null,
  position integer not null default 0 check (position >= 0),
  primary key (revision_id, asset_id, role),
  foreign key (workspace_id, revision_id) references public.work_revisions(workspace_id, id),
  foreign key (workspace_id, asset_id) references public.assets(workspace_id, id)
);
create table public.work_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  work_id uuid not null,
  actor_id uuid not null references public.users(id),
  event_type text not null,
  payload jsonb not null default '{}' check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  foreign key (workspace_id, work_id) references public.project_works(workspace_id, id)
);
create table public.generation_histories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  project_id uuid,
  work_id uuid not null,
  created_by uuid not null references public.users(id),
  title text not null default '새 생성',
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (workspace_id, id),
  foreign key (workspace_id, project_id) references public.projects(workspace_id, id),
  foreign key (workspace_id, work_id) references public.project_works(workspace_id, id)
);
create table public.generation_shots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  history_id uuid not null,
  label text not null,
  position integer not null check (position >= 0),
  ratio text not null check (ratio in ('1:1', '3:4', '4:5', '9:16', '16:9', '3:2', 'original')),
  resolution text,
  asset_id uuid,
  final_prompt text not null default '',
  settings jsonb not null default '{}' check (jsonb_typeof(settings) = 'object'),
  model text,
  is_mock boolean not null default false,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (history_id, position), unique (workspace_id, id), unique (workspace_id, history_id, id),
  foreign key (workspace_id, history_id) references public.generation_histories(workspace_id, id),
  foreign key (workspace_id, asset_id) references public.assets(workspace_id, id)
);
create table public.generation_shot_inputs (
  workspace_id uuid not null,
  shot_id uuid not null,
  asset_id uuid not null,
  role text not null check (role in ('product', 'reference', 'brand')),
  label text not null default '',
  position integer not null default 0 check (position >= 0),
  primary key (shot_id, role, position),
  foreign key (workspace_id, shot_id) references public.generation_shots(workspace_id, id),
  foreign key (workspace_id, asset_id) references public.assets(workspace_id, id)
);
create table public.editor_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  user_id uuid not null references public.users(id),
  project_id uuid,
  kind text not null check (kind in ('studio_cut', 'detail_page')),
  work_id uuid not null,
  revision_id uuid,
  active_history_id uuid,
  selected_shot_id uuid,
  ui_state jsonb not null default '{}' check (jsonb_typeof(ui_state) = 'object'),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, project_id) references public.projects(workspace_id, id),
  foreign key (workspace_id, work_id) references public.project_works(workspace_id, id),
  foreign key (workspace_id, work_id, revision_id) references public.work_revisions(workspace_id, work_id, id),
  foreign key (workspace_id, active_history_id) references public.generation_histories(workspace_id, id),
  foreign key (workspace_id, active_history_id, selected_shot_id) references public.generation_shots(workspace_id, history_id, id),
  check (selected_shot_id is null or active_history_id is not null)
);
create unique index one_project_session on public.editor_sessions(workspace_id, user_id, project_id, kind) where project_id is not null;
create unique index one_unscoped_session on public.editor_sessions(workspace_id, user_id, kind) where project_id is null;
create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  created_by uuid not null references public.users(id),
  work_id uuid,
  shot_id uuid,
  kind text not null check (kind in ('cut_generation', 'planning', 'template_structure', 'page_generation', 'evaluation')),
  status text not null default 'pending' check (status in ('pending', 'running', 'succeeded', 'failed', 'cancelled')),
  idempotency_key text not null check (length(trim(idempotency_key)) > 0),
  model text,
  is_mock boolean not null default false,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  unique (workspace_id, idempotency_key), unique (workspace_id, id),
  foreign key (workspace_id, work_id) references public.project_works(workspace_id, id),
  foreign key (workspace_id, shot_id) references public.generation_shots(workspace_id, id),
  check (finished_at is null or started_at is null or finished_at >= started_at),
  check (status not in ('succeeded', 'failed', 'cancelled') or finished_at is not null),
  check (kind <> 'cut_generation' or (shot_id is not null and work_id is not null))
);
create unique index one_active_cut_run on public.ai_runs(shot_id) where kind = 'cut_generation' and status in ('pending', 'running');
create table public.image_evaluations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  asset_id uuid not null,
  original_asset_id uuid,
  ai_run_id uuid,
  status text not null check (status in ('scored', 'unavailable', 'not_applicable')),
  score numeric,
  model_version text,
  reason text,
  evaluated_at timestamptz not null default now(),
  foreign key (workspace_id, asset_id) references public.assets(workspace_id, id),
  foreign key (workspace_id, original_asset_id) references public.assets(workspace_id, id),
  foreign key (workspace_id, ai_run_id) references public.ai_runs(workspace_id, id),
  check ((status = 'scored' and score >= 0 and score <= 100 and score is not null
          and nullif(trim(model_version), '') is not null and original_asset_id is not null and reason is null)
      or (status <> 'scored' and score is null and nullif(trim(reason), '') is not null))
);
create table public.bookmarks (
  workspace_id uuid not null,
  user_id uuid not null references public.users(id),
  asset_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id, asset_id),
  foreign key (workspace_id, asset_id) references public.assets(workspace_id, id)
);
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  created_by uuid not null references public.users(id),
  name text not null check (length(trim(name)) > 0),
  guidelines jsonb not null default '{}' check (jsonb_typeof(guidelines) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (workspace_id, id)
);
create table public.brand_assets (
  workspace_id uuid not null,
  brand_id uuid not null,
  asset_id uuid not null,
  name text not null default '',
  case_type text check (case_type in ('positive', 'negative')),
  position integer not null default 0 check (position >= 0),
  primary key (brand_id, asset_id),
  foreign key (workspace_id, brand_id) references public.brands(workspace_id, id),
  foreign key (workspace_id, asset_id) references public.assets(workspace_id, id)
);
create table public.moodboards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  created_by uuid not null references public.users(id),
  slug text not null,
  name text not null,
  description text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (workspace_id, slug), unique (workspace_id, id)
);
create table public.moodboard_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  moodboard_id uuid not null,
  asset_id uuid not null,
  position integer not null default 0 check (position >= 0),
  source_url text,
  layout jsonb not null default '{}' check (jsonb_typeof(layout) = 'object'),
  unique (moodboard_id, asset_id),
  foreign key (workspace_id, moodboard_id) references public.moodboards(workspace_id, id),
  foreign key (workspace_id, asset_id) references public.assets(workspace_id, id)
);
create table public.furniture_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  parent_id uuid,
  slug text not null,
  name text not null,
  description text not null default '',
  unique (workspace_id, slug), unique (workspace_id, id),
  check (parent_id is distinct from id),
  foreign key (workspace_id, parent_id) references public.furniture_categories(workspace_id, id)
);
create table public.furniture_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  created_by uuid not null references public.users(id),
  category_id uuid,
  brand_id uuid,
  name text not null,
  description text not null default '',
  specifications jsonb not null default '{}' check (jsonb_typeof(specifications) = 'object'),
  images jsonb not null default '[]' check (jsonb_typeof(images) = 'array'),
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (workspace_id, id),
  foreign key (workspace_id, category_id) references public.furniture_categories(workspace_id, id),
  foreign key (workspace_id, brand_id) references public.brands(workspace_id, id)
);
create table public.usage_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  ai_run_id uuid not null,
  model text not null,
  total bigint not null check (total >= 0),
  input_text bigint not null default 0 check (input_text >= 0),
  input_image bigint not null default 0 check (input_image >= 0),
  output_text bigint not null default 0 check (output_text >= 0),
  output_image bigint not null default 0 check (output_image >= 0),
  context jsonb not null default '{}' check (jsonb_typeof(context) = 'object'),
  occurred_at timestamptz not null default now(),
  foreign key (workspace_id, ai_run_id) references public.ai_runs(workspace_id, id)
);

-- Nullable project IDs require NULL-safe validation in addition to composite FKs.
create function studio_private.validate_context() returns trigger
language plpgsql set search_path = '' as $$
declare w public.project_works; h public.generation_histories;
begin
  select * into strict w from public.project_works where id = new.work_id;
  if new.project_id is distinct from w.project_id then
    raise exception 'Project scope must match the work' using errcode = '23514';
  end if;
  if tg_table_name = 'editor_sessions' then
    if new.kind <> w.kind then raise exception 'Editor kind must match work' using errcode = '23514'; end if;
    if new.active_history_id is not null then
      select * into strict h from public.generation_histories where id = new.active_history_id;
      if h.work_id <> new.work_id then raise exception 'Active history must belong to work' using errcode = '23514'; end if;
    end if;
  elsif w.kind <> 'studio_cut' then
    raise exception 'Cut history requires a studio_cut work' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger validate_history_context before insert or update on public.generation_histories
for each row execute function studio_private.validate_context();
create trigger validate_editor_context before insert or update on public.editor_sessions
for each row execute function studio_private.validate_context();

create function studio_private.protect_work_scope() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.workspace_id <> old.workspace_id or new.project_id is distinct from old.project_id or new.kind <> old.kind then
    raise exception 'Work scope and kind are immutable; copy work to move it' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger protect_work_scope before update on public.project_works
for each row execute function studio_private.protect_work_scope();

create function studio_private.validate_run() returns trigger
language plpgsql set search_path = '' as $$
declare shot_work uuid;
begin
  if new.shot_id is not null then
    select h.work_id into strict shot_work from public.generation_shots s
      join public.generation_histories h on h.id = s.history_id where s.id = new.shot_id;
    if new.work_id is distinct from shot_work then raise exception 'Run work must match shot work' using errcode = '23514'; end if;
    if new.kind = 'cut_generation' and new.status = 'succeeded' and not exists
      (select 1 from public.generation_shots where id = new.shot_id and asset_id is not null) then
      raise exception 'Successful cut requires a result asset' using errcode = '23514';
    end if;
  end if;
  return new;
end $$;
create trigger validate_run before insert or update on public.ai_runs
for each row execute function studio_private.validate_run();

-- Keep parent identities stable so existing sessions cannot become cross-context.
create function studio_private.protect_parent_identity() returns trigger
language plpgsql set search_path = '' as $$
declare k text;
begin
  foreach k in array tg_argv loop
    if (to_jsonb(new) -> k) is distinct from (to_jsonb(old) -> k) then
      raise exception 'Immutable parent column: %', k using errcode = '23514';
    end if;
  end loop;
  return new;
end $$;
create trigger protect_history_parent before update on public.generation_histories
for each row execute function studio_private.protect_parent_identity('workspace_id', 'project_id', 'work_id');
create trigger protect_shot_parent before update on public.generation_shots
for each row execute function studio_private.protect_parent_identity('workspace_id', 'history_id');
create trigger protect_asset_parent before update on public.assets
for each row execute function studio_private.protect_parent_identity('workspace_id', 'bucket', 'object_key');

-- JSON furniture images retain relational validation without another table.
create function studio_private.validate_furniture_images() returns trigger
language plpgsql set search_path = '' as $$
declare item jsonb; seen uuid[] := '{}'; asset_uuid uuid; primary_count integer := 0;
begin
  for item in select value from jsonb_array_elements(new.images) loop
    if jsonb_typeof(item) <> 'object' or nullif(item ->> 'asset_id', '') is null then
      raise exception 'Each furniture image requires asset_id' using errcode = '23514';
    end if;
    asset_uuid := (item ->> 'asset_id')::uuid;
    if asset_uuid = any(seen) then raise exception 'Duplicate furniture image' using errcode = '23505'; end if;
    seen := array_append(seen, asset_uuid);
    perform 1 from public.assets where id = asset_uuid and workspace_id = new.workspace_id
      and status = 'ready' and deleted_at is null for share;
    if not found then raise exception 'Furniture image must be a ready asset in the same workspace' using errcode = '23503'; end if;
    if item ? 'position' and (jsonb_typeof(item -> 'position') <> 'number' or (item ->> 'position') !~ '^[0-9]+$') then
      raise exception 'Image position must be a nonnegative integer' using errcode = '23514';
    end if;
    if item ? 'is_primary' then
      if jsonb_typeof(item -> 'is_primary') <> 'boolean' then raise exception 'is_primary must be boolean' using errcode = '23514'; end if;
      if (item ->> 'is_primary')::boolean then primary_count := primary_count + 1; end if;
    end if;
  end loop;
  if primary_count > 1 then raise exception 'Only one primary furniture image is allowed' using errcode = '23514'; end if;
  return new;
end $$;
create trigger validate_furniture_images before insert or update on public.furniture_items
for each row execute function studio_private.validate_furniture_images();
create function studio_private.protect_furniture_asset() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from public.furniture_items where workspace_id = old.workspace_id
    and images @> jsonb_build_array(jsonb_build_object('asset_id', old.id::text))) then
    raise exception 'Asset is referenced by furniture' using errcode = '23503';
  end if;
  return old;
end $$;
create trigger protect_furniture_asset before delete on public.assets
for each row execute function studio_private.protect_furniture_asset();

create function studio_private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create function studio_private.bump_revision() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not old.is_draft then raise exception 'Saved revisions are immutable' using errcode = '23514'; end if;
  if new.work_id <> old.work_id or new.workspace_id <> old.workspace_id or new.revision_number <> old.revision_number then
    raise exception 'Revision identity is immutable' using errcode = '23514';
  end if;
  new.lock_version := old.lock_version + 1;
  return new;
end $$;
create trigger bump_revision before update on public.work_revisions
for each row execute function studio_private.bump_revision();

-- Profiles are created for existing and future Supabase Auth users.
insert into public.users(id, display_name)
select id, coalesce(raw_user_meta_data ->> 'display_name', '') from auth.users;
create function studio_private.create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users(id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end $$;
create trigger studio_create_profile after insert on auth.users
for each row execute function studio_private.create_profile();

create function studio_private.is_member(target_workspace uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.workspace_members m join public.workspaces w on w.id = m.workspace_id
    where m.workspace_id = target_workspace and m.user_id = (select auth.uid()) and w.deleted_at is null);
$$;
revoke all on all functions in schema studio_private from public, anon, authenticated;
grant usage on schema studio_private to authenticated;
grant execute on function studio_private.is_member(uuid) to authenticated;

-- Server/service_role owns shared writes and membership administration.
-- Current password-only app auth must NOT expose service_role to the browser.
do $$
declare t text;
begin
  foreach t in array array['users','workspaces','workspace_members','assets','request_cases','request_case_assets',
    'projects','project_works','work_revisions','work_revision_assets','work_events','editor_sessions',
    'generation_histories','generation_shots','generation_shot_inputs','ai_runs','image_evaluations',
    'bookmarks','brands','brand_assets','moodboards','moodboard_items','furniture_categories','furniture_items','usage_records']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    if t = 'users' then
      execute 'create policy read_self on public.users for select to authenticated using (id = (select auth.uid()))';
    elsif t = 'workspaces' then
      execute 'create policy read_member on public.workspaces for select to authenticated using (studio_private.is_member(id))';
    elsif t in ('bookmarks','editor_sessions') then
      execute format('create policy read_own on public.%I for select to authenticated using (user_id = (select auth.uid()) and studio_private.is_member(workspace_id))', t);
      execute format('grant insert, update, delete on public.%I to authenticated', t);
      execute format('create policy insert_own on public.%I for insert to authenticated with check (user_id = (select auth.uid()) and studio_private.is_member(workspace_id))', t);
      execute format('create policy update_own on public.%I for update to authenticated using (user_id = (select auth.uid()) and studio_private.is_member(workspace_id)) with check (user_id = (select auth.uid()) and studio_private.is_member(workspace_id))', t);
      execute format('create policy delete_own on public.%I for delete to authenticated using (user_id = (select auth.uid()) and studio_private.is_member(workspace_id))', t);
    else
      execute format('create policy read_member on public.%I for select to authenticated using (studio_private.is_member(workspace_id))', t);
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = 'updated_at') then
      execute format('create trigger touch_updated_at before update on public.%I for each row execute function studio_private.touch_updated_at()', t);
    end if;
    if t not in ('users','workspaces','workspace_members') then
      execute format('create index on public.%I(workspace_id)', t);
    end if;
  end loop;
end $$;

create index on public.workspace_members(user_id, workspace_id);
create index on public.project_works(project_id, updated_at desc);
create index on public.work_events(work_id, created_at desc);
create index on public.generation_histories(workspace_id, project_id, created_at desc) where deleted_at is null;
create index on public.generation_histories(work_id);
create index on public.image_evaluations(asset_id, evaluated_at desc);
create index on public.ai_runs(work_id, created_at desc);
create index on public.usage_records(ai_run_id);
create index on public.usage_records(workspace_id, occurred_at desc);
create index on public.furniture_items using gin(images);
comment on column public.furniture_items.images is 'Array of {asset_id, role, position, is_primary}; triggers validate references and protect against hard deletion. Server coordinates soft deletion and R2 cleanup.';
comment on column public.work_revisions.state is 'Versioned editor document. Store stable IDs; register every referenced file in work_revision_assets. Never persist File/blob URLs or running flags.';
comment on table public.generation_histories is 'Bottom-panel history, separate from work_events. NULL project_id means unscoped, never all projects.';
comment on table public.image_evaluations is 'Evaluation belongs to immutable result asset, not the replaceable shot result. Display latest evaluation of current shot.asset_id.';
commit;
