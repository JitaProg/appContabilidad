-- Tiquet: tickets en Supabase con aislamiento por cuenta de Google.
-- Cada fila pertenece a un usuario de auth.users y las fotos viven en un
-- bucket privado con la ruta `${auth.uid()}/${receipt_id}-{image|thumb}.jpg`.

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  purchase_date date not null,
  merchant text not null check (char_length(btrim(merchant)) between 1 and 200),
  total_cents integer not null check (total_cents > 0),
  image_path text,
  thumb_path text
);

comment on table public.receipts is
  'Tickets de compra. Cada fila es privada para el usuario de auth.users indicado en user_id.';

create index if not exists receipts_user_purchase_date_idx
  on public.receipts (user_id, purchase_date desc, created_at desc);

alter table public.receipts enable row level security;

grant select, insert, update, delete on table public.receipts to authenticated;
revoke all on table public.receipts from anon;

drop policy if exists "receipts_select_own" on public.receipts;
create policy "receipts_select_own"
  on public.receipts for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "receipts_insert_own" on public.receipts;
create policy "receipts_insert_own"
  on public.receipts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "receipts_update_own" on public.receipts;
create policy "receipts_update_own"
  on public.receipts for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "receipts_delete_own" on public.receipts;
create policy "receipts_delete_own"
  on public.receipts for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Bucket privado para las fotos de los tickets.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- RLS de Storage: solo el dueño de la primera carpeta puede leer o modificar.
drop policy if exists "receipts_storage_select_own" on storage.objects;
create policy "receipts_storage_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "receipts_storage_insert_own" on storage.objects;
create policy "receipts_storage_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "receipts_storage_update_own" on storage.objects;
create policy "receipts_storage_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "receipts_storage_delete_own" on storage.objects;
create policy "receipts_storage_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
