-- Esquema para la sincronización (Fase 2b). La app hoy funciona solo con IndexedDB;
-- estas tablas reflejan el mismo modelo para respaldar y sincronizar entre dispositivos.

create type frecuencia as enum ('semanal', 'quincenal', 'mensual');
create type moneda as enum ('GTQ', 'USD');
create type tipo_movimiento as enum ('gasto', 'ingreso', 'transferencia');
create type cuenta_id as enum ('bi-monetaria', 'bi-ahorro', 'banrural');

create table categorias (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nombre text not null,
  frecuencia frecuencia not null,
  monto numeric(12, 2) not null check (monto >= 0),
  moneda moneda not null default 'GTQ',
  cuenta_id cuenta_id not null default 'bi-monetaria',
  nota text,
  orden int not null default 0,
  actualizado_en timestamptz not null default now()
);

create table movimientos (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  -- id local (IndexedDB) para deduplicar al sincronizar
  local_id text not null,
  fecha date not null,
  monto numeric(12, 2) not null check (monto > 0),
  tipo tipo_movimiento not null,
  categoria_id bigint references categorias on delete set null,
  cuenta_origen cuenta_id not null,
  cuenta_destino cuenta_id,
  nota text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  borrado boolean not null default false,
  unique (user_id, local_id),
  check ((tipo = 'transferencia') = (cuenta_destino is not null))
);

create index movimientos_user_fecha on movimientos (user_id, fecha desc);

create table config (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  sueldo_neto numeric(12, 2) not null default 6000,
  semanas_por_mes int not null default 4,
  tipo_cambio numeric(8, 4) not null default 7.7,
  tope_fondo numeric(12, 2) not null default 10000,
  pct_bi_antes_del_tope numeric(4, 3) not null default 0.7,
  pct_bi_despues_del_tope numeric(4, 3) not null default 0.3,
  bono_pct_ahorro numeric(4, 3) not null default 0.7,
  bono_pct_personal numeric(4, 3) not null default 0.1,
  bono_pct_hermano numeric(4, 3) not null default 0.2,
  actualizado_en timestamptz not null default now()
);

-- Cada usuario solo ve y modifica sus propias filas.
alter table categorias enable row level security;
alter table movimientos enable row level security;
alter table config enable row level security;

create policy "propias" on categorias for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "propias" on movimientos for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "propias" on config for all using (user_id = auth.uid()) with check (user_id = auth.uid());
