-- Seed product-type packaging rules for the existing live material names.
-- The live data currently uses: İp, Kese, pelur kağıt, sticker.

with material_aliases as (
  select 'String'::text as canonical_name, id
  from public.packaging_materials
  where name in ('String', 'İp', 'Ip', 'ip', 'İP')
     or lower(name) = 'string'
  order by id
  limit 1
),
tissue_aliases as (
  select 'Tissue Paper'::text as canonical_name, id
  from public.packaging_materials
  where name in ('Tissue Paper', 'pelur kağıt', 'Pelur Kağıt', 'pelur kagit')
     or lower(name) = 'tissue paper'
  order by id
  limit 1
),
pouch_aliases as (
  select 'Pouch'::text as canonical_name, id
  from public.packaging_materials
  where name in ('Pouch', 'Kese', 'kese')
     or lower(name) = 'pouch'
  order by id
  limit 1
),
sticker_aliases as (
  select 'Sticker'::text as canonical_name, id
  from public.packaging_materials
  where name in ('Sticker', 'sticker')
     or lower(name) = 'sticker'
  order by id
  limit 1
),
materials as (
  select * from material_aliases
  union all select * from tissue_aliases
  union all select * from pouch_aliases
  union all select * from sticker_aliases
),
defaults(product_type, canonical_name, quantity, quantity_mode, min_qty, max_qty) as (
  values
    ('T-shirt', 'String', 1, 'per_item', 1, null::integer),
    ('T-shirt', 'Tissue Paper', 1, 'per_item', 1, null::integer),
    ('T-shirt', 'Pouch', 1, 'fixed', 1, 4),
    ('T-shirt', 'Sticker', 2, 'fixed', 1, 4),
    ('T-shirt', 'Pouch', 2, 'fixed', 5, null::integer),
    ('T-shirt', 'Sticker', 4, 'fixed', 5, null::integer),
    ('Hoodie', 'Pouch', 1, 'per_item', 1, null::integer),
    ('Hoodie', 'String', 1, 'per_item', 1, null::integer),
    ('Hoodie', 'Tissue Paper', 1, 'per_item', 1, null::integer),
    ('Hoodie', 'Sticker', 2, 'per_item', 1, null::integer),
    ('Sweat', 'Pouch', 1, 'per_item', 1, null::integer),
    ('Sweat', 'String', 1, 'per_item', 1, null::integer),
    ('Sweat', 'Tissue Paper', 1, 'per_item', 1, null::integer),
    ('Sweat', 'Sticker', 2, 'per_item', 1, null::integer),
    ('Bag', 'String', 1, 'per_item', 1, null::integer),
    ('Bag', 'Tissue Paper', 1, 'per_item', 1, null::integer),
    ('Bag', 'Pouch', 1, 'fixed', 1, 2),
    ('Bag', 'Sticker', 2, 'fixed', 1, 2),
    ('Bag', 'Pouch', 2, 'fixed', 3, null::integer),
    ('Bag', 'Sticker', 4, 'fixed', 3, null::integer)
)
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
from defaults
join materials on materials.canonical_name = defaults.canonical_name
where not exists (
  select 1 from public.product_packaging_rules existing
  where existing.product_type is not null
);
