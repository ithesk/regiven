-- Ejecuta esto en el SQL Editor de tu proyecto Supabase

-- Tabla de donaciones
create table donations (
  id uuid default gen_random_uuid() primary key,
  amount numeric not null check (amount > 0),
  created_at timestamptz default now() not null
);

-- Tabla de configuración
create table settings (
  id int primary key default 1 check (id = 1),
  portal_enabled boolean default true not null
);

-- Insertar configuración por defecto
insert into settings (id, portal_enabled) values (1, true);

-- Habilitar acceso público (RLS desactivado para MVP)
alter table donations enable row level security;
alter table settings enable row level security;

-- Políticas para acceso anónimo (MVP)
create policy "Cualquiera puede insertar donaciones"
  on donations for insert
  to anon
  with check (true);

create policy "Cualquiera puede leer donaciones"
  on donations for select
  to anon
  using (true);

create policy "Cualquiera puede leer settings"
  on settings for select
  to anon
  using (true);

create policy "Cualquiera puede actualizar settings"
  on settings for update
  to anon
  using (true);

create policy "Cualquiera puede insertar settings"
  on settings for insert
  to anon
  with check (true);
