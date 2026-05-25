-- Final productization schema stabilization:
-- 1. Persist order source.
-- 2. Make packaging rules product-type based and editable.

alter table public.orders
  add column if not exists source text;

alter table public.product_packaging_rules
  add column if not exists product_type text,
  add column if not exists quantity_mode text not null default 'per_item',
  add column if not exists min_qty integer not null default 1,
  add column if not exists max_qty integer,
  add column if not exists active boolean not null default true,
  add column if not exists updated_at timestamptz;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_packaging_rules'
      and column_name = 'product_id'
      and is_nullable = 'NO'
  ) then
    alter table public.product_packaging_rules
      alter column product_id drop not null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'product_packaging_rules_product_type_check'
  ) then
    alter table public.product_packaging_rules
      add constraint product_packaging_rules_product_type_check
      check (
        product_type is null
        or product_type in ('T-shirt', 'Hoodie', 'Sweat', 'Bag')
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'product_packaging_rules_quantity_mode_check'
  ) then
    alter table public.product_packaging_rules
      add constraint product_packaging_rules_quantity_mode_check
      check (quantity_mode in ('per_item', 'fixed'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'product_packaging_rules_quantity_range_check'
  ) then
    alter table public.product_packaging_rules
      add constraint product_packaging_rules_quantity_range_check
      check (
        quantity > 0
        and min_qty > 0
        and (max_qty is null or max_qty >= min_qty)
      );
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_product_packaging_rules_updated_at on public.product_packaging_rules;
create trigger set_product_packaging_rules_updated_at
before update on public.product_packaging_rules
for each row
execute function public.set_updated_at();

-- Seed the agreed default product-type rules only when no product-type rules exist.
insert into public.product_packaging_rules
  (product_type, material_id, quantity, quantity_mode, min_qty, max_qty, active, product_id)
select
  defaults.product_type,
  materials.id,
  defaults.quantity,
  defaults.quantity_mode,
  defaults.min_qty,
  defaults.max_qty,
  true,
  null
from (values
  ('T-shirt', 'String', 1, 'per_item', 1, null),
  ('T-shirt', 'Tissue Paper', 1, 'per_item', 1, null),
  ('T-shirt', 'Pouch', 1, 'fixed', 1, 4),
  ('T-shirt', 'Sticker', 2, 'fixed', 1, 4),
  ('T-shirt', 'Pouch', 2, 'fixed', 5, null),
  ('T-shirt', 'Sticker', 4, 'fixed', 5, null),
  ('Hoodie', 'Pouch', 1, 'per_item', 1, null),
  ('Hoodie', 'String', 1, 'per_item', 1, null),
  ('Hoodie', 'Tissue Paper', 1, 'per_item', 1, null),
  ('Hoodie', 'Sticker', 2, 'per_item', 1, null),
  ('Sweat', 'Pouch', 1, 'per_item', 1, null),
  ('Sweat', 'String', 1, 'per_item', 1, null),
  ('Sweat', 'Tissue Paper', 1, 'per_item', 1, null),
  ('Sweat', 'Sticker', 2, 'per_item', 1, null),
  ('Bag', 'String', 1, 'per_item', 1, null),
  ('Bag', 'Tissue Paper', 1, 'per_item', 1, null),
  ('Bag', 'Pouch', 1, 'fixed', 1, 2),
  ('Bag', 'Sticker', 2, 'fixed', 1, 2),
  ('Bag', 'Pouch', 2, 'fixed', 3, null),
  ('Bag', 'Sticker', 4, 'fixed', 3, null)
) as defaults(product_type, material_name, quantity, quantity_mode, min_qty, max_qty)
join public.packaging_materials materials on materials.name = defaults.material_name
where not exists (
  select 1 from public.product_packaging_rules existing
  where existing.product_type is not null
);
