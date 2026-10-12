create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  type text not null check (type in ('shirt', 'wallet')),
  category text not null default '',
  price numeric(10, 2) not null check (price > 0),
  old_price numeric(10, 2),
  discount text,
  image text not null,
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now()
);

alter table public.products
  add column if not exists back_image text;

create table if not exists public.store_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.site_settings (
  key text primary key,
  value text not null
);

create table if not exists public.meta_pixel_settings (
  id smallint primary key default 1 check (id = 1),
  enabled boolean not null default false,
  pixel_id text not null default '',
  capi_token text,
  test_event_code text,
  has_capi_token boolean generated always as (nullif(capi_token, '') is not null) stored,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  customer_name text not null check (length(trim(customer_name)) > 0),
  phone text not null check (length(trim(phone)) > 0),
  address text not null check (length(trim(address)) > 0),
  product_name text not null check (length(trim(product_name)) > 0),
  product_image text,
  quantity integer not null check (quantity > 0),
  size text,
  unit_price numeric(10, 2) not null check (unit_price > 0),
  delivery_charge numeric(10, 2) not null check (delivery_charge >= 0),
  total numeric(10, 2) not null check (total > 0),
  status text not null default 'Pending'
    check (status in ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.store_admins enable row level security;
alter table public.site_settings enable row level security;
alter table public.meta_pixel_settings enable row level security;
alter table public.orders enable row level security;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select on public.store_admins to authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;
revoke all on public.meta_pixel_settings from anon, authenticated;
grant select (id, enabled, pixel_id, test_event_code, has_capi_token) on public.meta_pixel_settings to authenticated;
grant insert (id, enabled, pixel_id, capi_token, test_event_code) on public.meta_pixel_settings to authenticated;
grant update (enabled, pixel_id, capi_token, test_event_code, updated_at) on public.meta_pixel_settings to authenticated;
revoke all on public.orders from anon, authenticated;
grant insert (
  id, customer_name, phone, address, product_name, product_image,
  quantity, size, unit_price, delivery_charge, total
) on public.orders to anon, authenticated;
grant select on public.orders to authenticated;
grant update (status) on public.orders to authenticated;

drop policy if exists "Products are publicly readable" on public.products;
create policy "Products are publicly readable"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "Store admins can insert products" on public.products;
create policy "Store admins can insert products"
  on public.products for insert
  to authenticated
  with check (
    exists (select 1 from public.store_admins where user_id = auth.uid())
  );

drop policy if exists "Store admins can update products" on public.products;
create policy "Store admins can update products"
  on public.products for update
  to authenticated
  using (exists (select 1 from public.store_admins where user_id = auth.uid()))
  with check (exists (select 1 from public.store_admins where user_id = auth.uid()));

drop policy if exists "Store admins can delete products" on public.products;
create policy "Store admins can delete products"
  on public.products for delete
  to authenticated
  using (exists (select 1 from public.store_admins where user_id = auth.uid()));

drop policy if exists "Users can read their own store admin record" on public.store_admins;
create policy "Users can read their own store admin record"
  on public.store_admins for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Site settings are publicly readable" on public.site_settings;
create policy "Site settings are publicly readable"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Store admins can insert site settings" on public.site_settings;
create policy "Store admins can insert site settings"
  on public.site_settings for insert
  to authenticated
  with check (
    exists (select 1 from public.store_admins where user_id = auth.uid())
  );

drop policy if exists "Store admins can update site settings" on public.site_settings;
create policy "Store admins can update site settings"
  on public.site_settings for update
  to authenticated
  using (exists (select 1 from public.store_admins where user_id = auth.uid()))
  with check (exists (select 1 from public.store_admins where user_id = auth.uid()));

drop policy if exists "Store admins can read Meta Pixel settings" on public.meta_pixel_settings;
create policy "Store admins can read Meta Pixel settings"
  on public.meta_pixel_settings for select
  to authenticated
  using (exists (select 1 from public.store_admins where user_id = auth.uid()));

drop policy if exists "Store admins can insert Meta Pixel settings" on public.meta_pixel_settings;
create policy "Store admins can insert Meta Pixel settings"
  on public.meta_pixel_settings for insert
  to authenticated
  with check (exists (select 1 from public.store_admins where user_id = auth.uid()));

drop policy if exists "Store admins can update Meta Pixel settings" on public.meta_pixel_settings;
create policy "Store admins can update Meta Pixel settings"
  on public.meta_pixel_settings for update
  to authenticated
  using (exists (select 1 from public.store_admins where user_id = auth.uid()))
  with check (exists (select 1 from public.store_admins where user_id = auth.uid()));

drop policy if exists "Customers can place orders" on public.orders;
create policy "Customers can place orders"
  on public.orders for insert
  to anon, authenticated
  with check (status = 'Pending');

drop policy if exists "Store admins can read orders" on public.orders;
create policy "Store admins can read orders"
  on public.orders for select
  to authenticated
  using (exists (select 1 from public.store_admins where user_id = auth.uid()));

drop policy if exists "Store admins can update order status" on public.orders;
create policy "Store admins can update order status"
  on public.orders for update
  to authenticated
  using (exists (select 1 from public.store_admins where user_id = auth.uid()))
  with check (exists (select 1 from public.store_admins where user_id = auth.uid()));

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Product images are publicly readable" on storage.objects;
create policy "Product images are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Store admins can upload product images" on storage.objects;
create policy "Store admins can upload product images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.store_admins where user_id = auth.uid())
  );

drop policy if exists "Store admins can update product images" on storage.objects;
create policy "Store admins can update product images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.store_admins where user_id = auth.uid())
  )
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.store_admins where user_id = auth.uid())
  );

drop policy if exists "Store admins can delete product images" on storage.objects;
create policy "Store admins can delete product images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.store_admins where user_id = auth.uid())
  );

insert into public.products (name, description, type, category, price, old_price, discount, image, stock)
select seed.name, seed.description, seed.type, seed.category, seed.price, seed.old_price, seed.discount, seed.image, seed.stock
from (values
  ('Naruto Shadow T-Shirt', 'Premium oversized T-shirt with Naruto-inspired artwork.', 'shirt', 'Anime', 850, 1050, '20% OFF', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80', 20),
  ('Demon Slayer T-Shirt', 'Unique anime artwork printed on premium cotton fabric.', 'shirt', 'Anime', 900, 1150, '22% OFF', 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=700&q=80', 20),
  ('Minimal Black T-Shirt', 'Clean and stylish oversized black T-shirt for daily wear.', 'shirt', 'Minimal', 750, 950, '20% OFF', 'https://images.unsplash.com/photo-1583743814966-8936f37f3846?auto=format&fit=crop&w=700&q=80', 20),
  ('Street Art T-Shirt', 'Bold streetwear design with premium quality fabric.', 'shirt', 'Streetwear', 850, 1100, '23% OFF', 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=700&q=80', 20),
  ('Akatsuki Edition', 'Dark anime-inspired artwork for your streetwear style.', 'shirt', 'Anime', 950, 1200, '21% OFF', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=700&q=80', 20),
  ('Oversized White Tee', 'Soft premium cotton oversized T-shirt with modern fit.', 'shirt', 'Oversized', 800, 1000, '20% OFF', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=80', 20),
  ('Samurai Edition', 'Japanese-inspired artwork with premium DTF print.', 'shirt', 'Anime', 900, 1150, '22% OFF', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=80', 20),
  ('Urban Black Tee', 'Premium black streetwear T-shirt for everyday style.', 'shirt', 'Streetwear', 850, 1050, '20% OFF', 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=700&q=80', 20),
  ('Premium Leather Wallet', 'Stylish and durable wallet with a premium design.', 'wallet', 'Wallet', 650, 850, null, 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80', 20),
  ('Classic Black Wallet', 'A timeless black wallet made for everyday use.', 'wallet', 'Wallet', 750, 950, null, 'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=800&q=80', 20),
  ('Minimalist Wallet', 'A compact minimalist wallet with a clean profile.', 'wallet', 'Wallet', 550, 700, null, 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&w=800&q=80', 20),
  ('Executive Leather Wallet', 'A refined leather wallet with a premium finish.', 'wallet', 'Wallet', 850, 1050, null, 'https://images.unsplash.com/photo-1611010344444-5f9e4d86a6e1?auto=format&fit=crop&w=800&q=80', 20)
) as seed(name, description, type, category, price, old_price, discount, image, stock)
where not exists (select 1 from public.products);