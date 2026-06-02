# Supabase Setup

This app is configured to use Supabase Free for:

- app data sync
- image uploads
- video uploads

## 1. Create a free Supabase project

- Go to https://supabase.com/dashboard
- Create a new project

## 2. Add your frontend keys

Create a local `.env` file based on `.env.example`:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

You can find these in:

- `Project Settings -> API`

## 3. Create the data table

Open the SQL editor in Supabase and run:

```sql
create table if not exists public.app_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);

alter table public.app_state enable row level security;

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
```

## 4. Create the storage bucket

- Go to `Storage`
- Create bucket named `media`
- Mark it as `Public`

Then run this SQL for storage policies:

```sql
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
```

## 5. Run locally

```bash
npm run dev
```

## Notes

- Supabase Free is enough for a school/demo project.
- The app still works locally from `localStorage` even before Supabase is configured.
