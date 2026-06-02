create table if not exists public.app_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);

alter table public.app_state enable row level security;

drop policy if exists "public read app_state" on public.app_state;
drop policy if exists "public write app_state" on public.app_state;
drop policy if exists "public update app_state" on public.app_state;

create policy "public read app_state"
on public.app_state
for select
to anon
using (true);

create policy "public write app_state"
on public.app_state
for insert
to anon
with check (true);

create policy "public update app_state"
on public.app_state
for update
to anon
using (true)
with check (true);

drop policy if exists "public read media" on storage.objects;
drop policy if exists "public upload media" on storage.objects;

create policy "public read media"
on storage.objects
for select
to anon
using (bucket_id = 'media');

create policy "public upload media"
on storage.objects
for insert
to anon
with check (bucket_id = 'media');
