-- ===========================================================================
-- MI TRENDS — seed data
-- Mirrors the demo catalogue in src/lib/demo/catalogue.ts.
-- Safe to re-run: every insert is guarded by a conflict/existence check.
-- ===========================================================================

insert into site_settings (site_name, tagline, contact_email, contact_phone, business_address,
  social_instagram, social_facebook, social_twitter, social_youtube,
  announcement_bar_active, announcement_bar_text, sale_active, sale_headline, sale_ends_at)
select 'MI TRENDS',
       'Considered essentials for men and women.',
       'hello@mitrends.com',
       '+91 98765 43210',
       '4th Floor, Prestige Atrium, MG Road, Bengaluru 560001, India',
       'https://instagram.com/mitrends',
       'https://facebook.com/mitrends',
       'https://x.com/mitrends',
       'https://youtube.com/@mitrends',
       true,
       'Complimentary shipping on orders over ₹2,000',
       true,
       'Mid-season sale — up to 30% off',
       now() + interval '6 days'
where not exists (select 1 from site_settings);

insert into seo_settings (meta_title_template, default_meta_description)
select '{page} | MI TRENDS',
       'MI TRENDS — considered essentials for men and women. Free shipping over ₹2,000.'
where not exists (select 1 from seo_settings);

-- --------------------------------------------------------------------------
-- Categories
-- --------------------------------------------------------------------------
insert into categories (name, slug, description, image_url, sort_order) values
  ('Shirts', 'shirts', 'Japanese cotton and silk blends, cut for everyday wear.',
   'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1200&q=80', 1),
  ('Knitwear', 'knitwear', 'Merino and cashmere, finished by hand.',
   'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=1200&q=80', 2),
  ('Outerwear', 'outerwear', 'Weatherproof layers built for the long haul.',
   'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&q=80', 3),
  ('Trousers', 'trousers', 'Considered tailoring with room to move.',
   'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=1200&q=80', 4),
  ('Dresses', 'dresses', 'Silk, poplin and crepe, cut to last.',
   'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=1200&q=80', 5),
  ('Footwear', 'footwear', 'Resoleable construction, Italian leather.',
   'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=80', 6),
  ('Accessories', 'accessories', 'The quiet details that finish a wardrobe.',
   'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80', 7)
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Products — 10 men, 10 women, 2 unisex
-- --------------------------------------------------------------------------
insert into products (title, slug, description, short_description, category_id, gender,
  price, sale_price, sku, stock_quantity, status, tags, units_sold, created_at)
select v.title, v.slug, v.description, v.short_description,
       (select id from categories where slug = v.category_slug),
       v.gender::product_gender, v.price, v.sale_price, v.sku, v.stock,
       'active'::product_status, v.tags, v.units_sold, now() - (v.days_old || ' days')::interval
from (values
  -- ------------------------------------------------------------------ MEN --
  ('Oxford Shirt — Ecru', 'oxford-shirt-ecru',
   '<p>Woven in Japan from long-staple cotton, then washed once so it arrives soft rather than stiff. Unfused collar, single-needle side seams, and a box pleat at the back yoke.</p>',
   'Japanese long-staple cotton oxford, washed soft.', 'shirts', 'men',
   6500::numeric, null::numeric, 'MT-M-SHT-001', 140, array['cotton','shirt','japanese'], 420, 8),

  ('Camp Collar Shirt', 'camp-collar-shirt',
   '<p>A boxy camp-collar shirt in a breathable cotton-linen slub. Cut short enough to wear untucked, with a single chest pocket.</p>',
   'Cotton-linen camp collar, cut boxy.', 'shirts', 'men',
   5900, 4200, 'MT-M-SHT-002', 74, array['linen','summer','shirt'], 196, 22),

  ('Garment-Dyed Tee', 'garment-dyed-tee',
   '<p>A heavyweight 240gsm cotton tee, dyed after construction so the colour settles unevenly in the best way. Ribbed collar that will not twist.</p>',
   '240gsm cotton, dyed after construction.', 'shirts', 'men',
   3200, 2400, 'MT-M-SHT-003', 260, array['cotton','tee','everyday'], 731, 3),

  ('Hokkaido Merino Crew', 'hokkaido-merino-crew',
   '<p>Spun from 19.5-micron extrafine merino and knitted on vintage gauge machines. Fully fashioned shoulders mean the seams follow the body.</p>',
   'Extrafine merino crew, fully fashioned.', 'knitwear', 'men',
   8900, 6900, 'MT-M-KNT-001', 96, array['merino','knitwear','everyday'], 312, 15),

  ('Cashmere Half-Zip', 'cashmere-half-zip',
   '<p>Two-ply Inner Mongolian cashmere in a relaxed half-zip. Ribbed cuffs and hem hold their shape; the collar stands without a facing.</p>',
   'Two-ply cashmere half-zip in a relaxed cut.', 'knitwear', 'men',
   21500, null, 'MT-M-KNT-002', 27, array['cashmere','knitwear','luxury'], 88, 40),

  ('The Alpine Shell', 'the-alpine-shell',
   '<p>A three-layer waterproof shell built with a recycled face fabric and fully taped seams. Articulated sleeves and a two-way centre zip.</p>',
   'Three-layer recycled shell with taped seams.', 'outerwear', 'men',
   18900, 14900, 'MT-M-OUT-001', 42, array['waterproof','recycled','outerwear'], 128, 5),

  ('Kyoto Overcoat', 'kyoto-overcoat',
   '<p>An unstructured overcoat in a Japanese wool-cashmere melton. Raglan sleeves and a single patch pocket at each hip keep the silhouette quiet.</p>',
   'Unstructured wool-cashmere overcoat, half-lined.', 'outerwear', 'men',
   32000, null, 'MT-M-OUT-002', 18, array['wool','cashmere','overcoat'], 64, 60),

  ('Wide-Leg Chino', 'wide-leg-chino',
   '<p>A high-rise, wide-leg chino in garment-dyed Italian twill. Pleated front, extended tab closure, and a clean finish through the seat.</p>',
   'Garment-dyed Italian twill, pleated and wide.', 'trousers', 'men',
   9500, null, 'MT-M-TRS-001', 88, array['chino','trousers','italian'], 173, 30),

  ('Leather Derby — Chestnut', 'leather-derby-chestnut',
   '<p>Goodyear-welted derbies on a rounded last, made in a family workshop outside Florence. Resoleable, so they can be kept going indefinitely.</p>',
   'Goodyear-welted derby, made in Italy.', 'footwear', 'men',
   28900, 23100, 'MT-M-FTW-001', 31, array['leather','shoes','italian'], 112, 45),

  ('Full-Grain Leather Belt', 'full-grain-leather-belt',
   '<p>Cut from a single length of vegetable-tanned full-grain hide and finished with a solid brass buckle.</p>',
   'Vegetable-tanned hide, solid brass buckle.', 'accessories', 'men',
   4500, null, 'MT-M-ACC-001', 210, array['leather','belt','accessories'], 508, 70),

  -- ---------------------------------------------------------------- WOMEN --
  ('Silk Slip Dress', 'silk-slip-dress',
   '<p>Cut on the bias from sand-washed 19-momme silk, so it falls rather than clings. French seams throughout and an adjustable strap.</p>',
   'Sand-washed silk, cut on the bias.', 'dresses', 'women',
   16500, null, 'MT-W-DRS-001', 46, array['silk','dress','occasion'], 204, 4),

  ('Poplin Midi Dress', 'poplin-midi-dress',
   '<p>A crisp organic cotton poplin midi with a self-tie waist and a gently gathered skirt. Deep side pockets.</p>',
   'Crisp cotton poplin with a tie waist.', 'dresses', 'women',
   11900, 8900, 'MT-W-DRS-002', 62, array['cotton','dress','everyday'], 288, 11),

  ('Pleated Tea Dress', 'pleated-tea-dress',
   '<p>Knife-pleated from the waist in a soft recycled crepe. The pleats are heat-set so they hold through a wash.</p>',
   'Knife-pleated crepe with a covered placket.', 'dresses', 'women',
   13500, null, 'MT-W-DRS-003', 38, array['crepe','dress','pleated'], 141, 26),

  ('Silk-Blend Blouse', 'silk-blend-blouse',
   '<p>A fluid silk-cotton blend with a concealed placket and a collar that sits softly open. Cut long enough to tuck.</p>',
   'Fluid silk-cotton with a concealed placket.', 'shirts', 'women',
   8900, null, 'MT-W-SHT-001', 84, array['silk','blouse','workwear'], 267, 9),

  ('Boxy Cotton Shirt', 'boxy-cotton-shirt',
   '<p>Washed organic cotton cut square through the body, with a dropped shoulder and a curved hem.</p>',
   'Washed cotton, cut square and easy.', 'shirts', 'women',
   6900, 5200, 'MT-W-SHT-002', 110, array['cotton','shirt','everyday'], 322, 18),

  ('Cashmere Boat Neck', 'cashmere-boat-neck',
   '<p>Grade-A Inner Mongolian cashmere knitted to a fine gauge, with a wide boat neck that holds its line.</p>',
   'Grade-A cashmere in a wide boat neck.', 'knitwear', 'women',
   18900, null, 'MT-W-KNT-001', 34, array['cashmere','knitwear','luxury'], 158, 13),

  ('Merino Rib Cardigan', 'merino-rib-cardigan',
   '<p>A fine-gauge merino rib that skims rather than clings, finished with corozo buttons turned from tagua nut.</p>',
   'Fine-gauge merino rib with corozo buttons.', 'knitwear', 'women',
   12500, 9900, 'MT-W-KNT-002', 57, array['merino','cardigan','layering'], 219, 21),

  ('Belted Wool Coat', 'belted-wool-coat',
   '<p>Double-faced Italian wool with no lining needed — the reverse is finished as neatly as the face. A wide self-belt cinches it.</p>',
   'Double-faced Italian wool, fully belted.', 'outerwear', 'women',
   29500, null, 'MT-W-OUT-001', 21, array['wool','coat','italian'], 97, 35),

  ('Quilted Liner Jacket', 'quilted-liner-jacket-w',
   '<p>A diamond-quilted liner that works alone through the shoulder seasons or under a coat when it turns. Recycled fill, corduroy collar.</p>',
   'Diamond-quilted liner with recycled fill.', 'outerwear', 'women',
   12500, 9900, 'MT-W-OUT-002', 58, array['quilted','layering','recycled'], 203, 28),

  ('High-Rise Wide Trouser', 'high-rise-wide-trouser',
   '<p>A fluid Tencel twill cut high at the waist and wide to the floor. Side-seam pockets sit flat.</p>',
   'Fluid tencel twill with a clean high waist.', 'trousers', 'women',
   10900, null, 'MT-W-TRS-001', 72, array['tencel','trousers','tailoring'], 186, 16),

  -- --------------------------------------------------------------- UNISEX --
  ('Lambswool Scarf', 'lambswool-scarf',
   '<p>Woven in the Scottish Borders from soft lambswool, with hand-tied fringing at both ends.</p>',
   'Scottish lambswool with hand-tied fringe.', 'accessories', 'unisex',
   5500, null, 'MT-U-ACC-001', 130, array['wool','scarf','scotland'], 267, 50),

  ('Canvas Weekender', 'canvas-weekender',
   '<p>A 20oz waxed canvas holdall with bridle leather handles and a brass zip. Sized to clear most carry-on limits.</p>',
   'Waxed canvas holdall with bridle leather trim.', 'accessories', 'unisex',
   16500, null, 'MT-U-ACC-002', 24, array['bag','canvas','travel'], 77, 55)
) as v(title, slug, description, short_description, category_slug, gender,
       price, sale_price, sku, stock, tags, units_sold, days_old)
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Product images — two per product, matching the demo catalogue
-- --------------------------------------------------------------------------
insert into product_images (product_id, image_url, sort_order, alt_text)
select (select id from products where slug = v.slug),
       'https://images.unsplash.com/' || v.photo || '?w=1400&q=80',
       v.sort_order,
       (select title from products where slug = v.slug)
from (values
  ('oxford-shirt-ecru','photo-1602810318383-e386cc2a3ccf',0),
  ('oxford-shirt-ecru','photo-1596755094514-f87e34085b2c',1),
  ('camp-collar-shirt','photo-1566174053879-31528523f8ae',0),
  ('camp-collar-shirt','photo-1495121605193-b116b5b9c5fe',1),
  ('garment-dyed-tee','photo-1521572163474-6864f9cf17ab',0),
  ('garment-dyed-tee','photo-1572804013309-59a88b7e92f1',1),
  ('hokkaido-merino-crew','photo-1576871337622-98d48d1cf531',0),
  ('hokkaido-merino-crew','photo-1591047139829-d91aecb6caea',1),
  ('cashmere-half-zip','photo-1620799140408-edc6dcb6d633',0),
  ('cashmere-half-zip','photo-1515886657613-9f3515b0c78f',1),
  ('the-alpine-shell','photo-1551028719-00167b16eac5',0),
  ('the-alpine-shell','photo-1544923246-77307dd654cb',1),
  ('kyoto-overcoat','photo-1539533018447-63fcce2678e3',0),
  ('kyoto-overcoat','photo-1608234807905-4466023792f5',1),
  ('wide-leg-chino','photo-1594633312681-425c7b97ccd1',0),
  ('wide-leg-chino','photo-1473966968600-fa801b869a1a',1),
  ('leather-derby-chestnut','photo-1549298916-b41d501d3772',0),
  ('leather-derby-chestnut','photo-1614252235316-8c857d38b5f4',1),
  ('full-grain-leather-belt','photo-1553062407-98eeb64c6a62',0),
  ('full-grain-leather-belt','photo-1583496661160-fb5886a0aaaa',1),
  ('silk-slip-dress','photo-1539008835657-9e8e9680c956',0),
  ('silk-slip-dress','photo-1595777457583-95e059d581b8',1),
  ('poplin-midi-dress','photo-1554568218-0f1715e72254',0),
  ('poplin-midi-dress','photo-1611312449408-fcece27cdbb7',1),
  ('pleated-tea-dress','photo-1583496661160-fb5886a0aaaa',0),
  ('pleated-tea-dress','photo-1618354691373-d851c5c3a990',1),
  ('silk-blend-blouse','photo-1485968579580-b6d095142e6e',0),
  ('silk-blend-blouse','photo-1487412720507-e7ab37603c6f',1),
  ('boxy-cotton-shirt','photo-1496747611176-843222e1e57c',0),
  ('boxy-cotton-shirt','photo-1479064555552-3ef4979f8908',1),
  ('cashmere-boat-neck','photo-1581044777550-4cfa60707c03',0),
  ('cashmere-boat-neck','photo-1564557287817-3785e38ec1f5',1),
  ('merino-rib-cardigan','photo-1502716119720-b23a93e5fe1b',0),
  ('merino-rib-cardigan','photo-1617137968427-85924c800a22',1),
  ('belted-wool-coat','photo-1434389677669-e08b4cac3105',0),
  ('belted-wool-coat','photo-1490114538077-0a7f8cb49891',1),
  ('quilted-liner-jacket-w','photo-1509319117193-57bab727e09d',0),
  ('quilted-liner-jacket-w','photo-1485462537746-965f33f7f6a7',1),
  ('high-rise-wide-trouser','photo-1594633312681-425c7b97ccd1',0),
  ('high-rise-wide-trouser','photo-1445205170230-053b83016050',1),
  ('lambswool-scarf','photo-1520903074185-8eca362b3dce',0),
  ('lambswool-scarf','photo-1469334031218-e382a71b716b',1),
  ('canvas-weekender','photo-1553062407-98eeb64c6a62',0),
  ('canvas-weekender','photo-1441984904996-e0b6ba687e04',1)
) as v(slug, photo, sort_order)
where exists (select 1 from products where slug = v.slug)
  and not exists (
    select 1 from product_images pi
    join products p on p.id = pi.product_id
    where p.slug = v.slug
  );

-- --------------------------------------------------------------------------
-- Size + colour options and variants for apparel
-- --------------------------------------------------------------------------
do $$
declare
  r record;
  opt_size uuid;
  opt_colour uuid;
  s text;
  c text;
  sizes text[] := array['XS','S','M','L','XL'];
  colours text[] := array['Ecru','Charcoal','Navy'];
  i int;
begin
  for r in
    select p.id, p.sku from products p
    join categories cat on cat.id = p.category_id
    where cat.slug in ('knitwear','shirts','outerwear','trousers','dresses')
  loop
    if exists (select 1 from product_options where product_id = r.id) then
      continue;
    end if;

    insert into product_options (product_id, name, sort_order)
      values (r.id, 'Size', 0) returning id into opt_size;
    insert into product_options (product_id, name, sort_order)
      values (r.id, 'Colour', 1) returning id into opt_colour;

    i := 0;
    foreach s in array sizes loop
      insert into product_option_values (option_id, value, sort_order) values (opt_size, s, i);
      i := i + 1;
    end loop;

    i := 0;
    foreach c in array colours loop
      insert into product_option_values (option_id, value, sort_order) values (opt_colour, c, i);
      i := i + 1;
    end loop;

    i := 0;
    foreach s in array sizes loop
      foreach c in array colours loop
        insert into product_variants (product_id, sku, stock_quantity, option_values)
        values (
          r.id,
          coalesce(r.sku, 'MT') || '-' || s || '-' || upper(left(c, 3)),
          -- one combination deliberately sold out, so the PDP shows that state
          case when s = 'XL' and c = 'Navy' then 0 else 6 + (i * 3) end,
          jsonb_build_array(
            jsonb_build_object('option_name', 'Size', 'value', s),
            jsonb_build_object('option_name', 'Colour', 'value', c)
          )
        );
      end loop;
      i := i + 1;
    end loop;
  end loop;
end $$;

-- Footwear gets numeric sizes only.
do $$
declare
  r record;
  opt_size uuid;
  s text;
  sizes text[] := array['6','7','8','9','10','11'];
  i int;
begin
  for r in
    select p.id, p.sku from products p
    join categories cat on cat.id = p.category_id
    where cat.slug = 'footwear'
  loop
    if exists (select 1 from product_options where product_id = r.id) then
      continue;
    end if;

    insert into product_options (product_id, name, sort_order)
      values (r.id, 'Size', 0) returning id into opt_size;

    i := 0;
    foreach s in array sizes loop
      insert into product_option_values (option_id, value, sort_order) values (opt_size, s, i);
      insert into product_variants (product_id, sku, stock_quantity, option_values)
      values (
        r.id,
        coalesce(r.sku, 'MT') || '-' || s,
        case when s = '11' then 0 else 4 + i end,
        jsonb_build_array(jsonb_build_object('option_name', 'Size', 'value', s))
      );
      i := i + 1;
    end loop;
  end loop;
end $$;

-- --------------------------------------------------------------------------
-- Hero slides, shipping, coupons, testimonials, social, page SEO
-- --------------------------------------------------------------------------
insert into hero_slides (image_url, heading, subheading, cta_text, cta_link, sort_order)
select * from (values
  ('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=2000&q=80',
   'Built for the long run',
   'Autumn/Winter essentials for men and women, cut from fabrics chosen to outlast the season.',
   'Shop the collection', '/products', 0),
  ('https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=2000&q=80',
   'The women''s edit', 'Silk, cashmere and cotton poplin — pieces that do the work of five.',
   'Shop women', '/women', 1),
  ('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=2000&q=80',
   'The men''s edit', 'Japanese shirting, Italian tailoring and outerwear that earns its keep.',
   'Shop men', '/men', 2)
) as v
where not exists (select 1 from hero_slides);

insert into shipping_methods (name, price, estimated_delivery, free_shipping_threshold, sort_order)
select * from (values
  ('Standard', 99.00, '4–6 business days', 2000.00, 0),
  ('Express', 249.00, '2–3 business days', null::numeric, 1),
  ('Next Day', 499.00, 'Next business day', null::numeric, 2)
) as v
where not exists (select 1 from shipping_methods);

insert into coupons (code, type, value, min_order_amount, usage_limit, per_customer_limit, is_active)
values
  ('WELCOME10', 'percentage', 10, 2000, 500, 1, true),
  ('FLAT500',   'fixed',     500, 5000, 200, 2, true)
on conflict (code) do nothing;

insert into testimonials (author_name, author_role, quote, rating, sort_order)
select * from (values
  ('Ananya R.', 'Bengaluru', 'The merino crew has been in weekly rotation for eight months and still looks new. Worth every rupee.', 5, 0),
  ('Devansh K.', 'Mumbai', 'Fit and finish you normally pay three times as much for. The oxford is the best shirt I own.', 5, 1),
  ('Priya M.', 'Delhi', 'Ordered the slip dress on a Tuesday, wearing it by Thursday. Packaging was lovely and entirely recyclable.', 5, 2),
  ('Rohan S.', 'Pune', 'The derbies needed a week to break in and now they feel custom. Resoleable, so they are staying.', 4, 3)
) as v
where not exists (select 1 from testimonials);

insert into social_posts (image_url, link, caption, sort_order)
select * from (values
  ('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80', '/products', 'In store, Bengaluru', 0),
  ('https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80', '/products', 'AW essentials', 1),
  ('https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80', '/products', 'The knitwear edit', 2),
  ('https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=800&q=80', '/products', 'On the road', 3),
  ('https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=800&q=80', '/products', 'Detail study', 4),
  ('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80', '/products', 'Behind the seams', 5)
) as v
where not exists (select 1 from social_posts);

insert into page_seo (page_slug, meta_title, meta_description) values
  ('home',     'MI TRENDS — Considered essentials', 'Modern wardrobe essentials for men and women. Free shipping over ₹2,000.'),
  ('about',    'About MI TRENDS', 'How we choose fabrics, the workshops we partner with, and why we make fewer things.'),
  ('contact',  'Contact MI TRENDS', 'Questions about an order, sizing or a return? We answer within one business day.'),
  ('faq',      'Frequently asked questions', 'Sizing, shipping, returns and care — answered.'),
  ('shipping-policy', 'Shipping Policy', 'Delivery timelines, costs and tracking.'),
  ('returns-policy',  'Returns Policy', 'Thirty-day returns on unworn items.'),
  ('privacy-policy',  'Privacy Policy', 'What we collect, why, and how to have it removed.'),
  ('terms',           'Terms of Service', 'The terms that govern use of this store.')
on conflict (page_slug) do nothing;
