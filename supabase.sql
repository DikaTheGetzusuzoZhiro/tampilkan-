-- TAMA Account Store - Supabase setup
-- 1) Create one Auth user in Supabase Dashboard:
--    Authentication > Users > Add user
--    Email: fyesty8@gmail.com
--    Password: heicfsya
--    Confirm the email/user as needed.
-- 2) Run this entire SQL script in SQL Editor.
-- 3) Create a PUBLIC Storage bucket named "products" OR let this script do it.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  price numeric null,
  status text not null default 'ready' check (status in ('ready','sold')),
  image_url text,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

-- Public catalog: everyone can read.
drop policy if exists "Public can view products" on public.products;
create policy "Public can view products"
on public.products for select
to anon, authenticated
using (true);

-- Only the requested admin email can write.
drop policy if exists "Admin can insert products" on public.products;
create policy "Admin can insert products"
on public.products for insert
to authenticated
with check (lower(coalesce(auth.jwt()->>'email','')) = 'fyesty8@gmail.com');

drop policy if exists "Admin can update products" on public.products;
create policy "Admin can update products"
on public.products for update
to authenticated
using (lower(coalesce(auth.jwt()->>'email','')) = 'fyesty8@gmail.com')
with check (lower(coalesce(auth.jwt()->>'email','')) = 'fyesty8@gmail.com');

drop policy if exists "Admin can delete products" on public.products;
create policy "Admin can delete products"
on public.products for delete
to authenticated
using (lower(coalesce(auth.jwt()->>'email','')) = 'fyesty8@gmail.com');

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute procedure public.set_updated_at();

-- Storage bucket: public read, admin-only mutations.
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'products');

drop policy if exists "Admin can upload product images" on storage.objects;
create policy "Admin can upload product images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'products' and lower(coalesce(auth.jwt()->>'email','')) = 'fyesty8@gmail.com');

drop policy if exists "Admin can update product images" on storage.objects;
create policy "Admin can update product images"
on storage.objects for update
to authenticated
using (bucket_id = 'products' and lower(coalesce(auth.jwt()->>'email','')) = 'fyesty8@gmail.com')
with check (bucket_id = 'products' and lower(coalesce(auth.jwt()->>'email','')) = 'fyesty8@gmail.com');

drop policy if exists "Admin can delete product images" on storage.objects;
create policy "Admin can delete product images"
on storage.objects for delete
to authenticated
using (bucket_id = 'products' and lower(coalesce(auth.jwt()->>'email','')) = 'fyesty8@gmail.com');
