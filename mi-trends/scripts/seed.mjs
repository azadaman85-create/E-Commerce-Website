/**
 * Seeds the Supabase project over the REST API using the service-role key.
 *
 * This is an alternative to pasting supabase/SETUP.sql into the SQL editor.
 * It only performs INSERTs — it cannot create tables or columns, so the
 * schema migrations must already have been applied.
 *
 *   node scripts/seed.mjs            # insert missing rows, leave existing ones
 *   node scripts/seed.mjs --reset    # delete seeded rows first, then insert
 *
 * Safe to re-run: every table is checked before it is written to.
 */
import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------
function loadEnv() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) {
    fail(".env.local not found. Copy .env.example and fill in your Supabase keys.");
  }
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

function fail(message) {
  console.error(`\n  ✗ ${message}\n`);
  process.exit(1);
}

const env = loadEnv();
const URL_BASE = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!URL_BASE || URL_BASE.includes("your-project")) {
  fail("NEXT_PUBLIC_SUPABASE_URL is not set to a real project in .env.local.");
}
if (URL_BASE.includes("/rest/v1")) {
  fail(
    "NEXT_PUBLIC_SUPABASE_URL must be the project origin only\n" +
      "    (https://xxxx.supabase.co) — drop the /rest/v1/ suffix.",
  );
}
if (!SERVICE_KEY || SERVICE_KEY.includes("your-service")) {
  fail("SUPABASE_SERVICE_ROLE_KEY is not set in .env.local.");
}

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function rest(pathname, init = {}) {
  const res = await fetch(`${URL_BASE}/rest/v1/${pathname}`, {
    ...init,
    headers: { ...HEADERS, ...(init.headers || {}) },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body };
}

async function select(table, query = "select=*&limit=1") {
  return rest(`${table}?${query}`);
}

async function insert(table, rows) {
  if (rows.length === 0) return { ok: true, body: [] };

  // PostgREST rejects a bulk insert whose objects have differing keys
  // ("PGRST102: All object keys must match"), so fill the gaps with null
  // rather than leaving a key off some rows.
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const normalised = rows.map((row) =>
    Object.fromEntries(keys.map((k) => [k, row[k] ?? null])),
  );

  const res = await rest(table, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(normalised),
  });

  // Surface failures instead of skipping past them — a silent insert failure
  // is how shipping_methods ended up empty while the seeder reported success.
  if (!res.ok) {
    fail(`${table}: ${JSON.stringify(res.body)}`);
  }
  return res;
}

async function count(table) {
  const res = await fetch(`${URL_BASE}/rest/v1/${table}?select=id`, {
    headers: { ...HEADERS, Prefer: "count=exact", Range: "0-0" },
  });
  const range = res.headers.get("content-range") || "";
  return Number(range.split("/")[1] || 0);
}

// ---------------------------------------------------------------------------
// Catalogue — parsed from the same source the storefront's demo mode uses
// ---------------------------------------------------------------------------
const U = (id, w = 1400) => `https://images.unsplash.com/${id}?w=${w}&q=80`;

const CATEGORIES = [
  ["Shirts", "shirts", "Japanese cotton and silk blends, cut for everyday wear.", "photo-1602810318383-e386cc2a3ccf"],
  ["Knitwear", "knitwear", "Merino and cashmere, finished by hand.", "photo-1576871337622-98d48d1cf531"],
  ["Outerwear", "outerwear", "Weatherproof layers built for the long haul.", "photo-1551028719-00167b16eac5"],
  ["Trousers", "trousers", "Considered tailoring with room to move.", "photo-1473966968600-fa801b869a1a"],
  ["Dresses", "dresses", "Silk, poplin and crepe, cut to last.", "photo-1539008835657-9e8e9680c956"],
  ["Footwear", "footwear", "Resoleable construction, Italian leather.", "photo-1549298916-b41d501d3772"],
  ["Accessories", "accessories", "The quiet details that finish a wardrobe.", "photo-1553062407-98eeb64c6a62"],
];

// title, slug, gender, category, price, salePrice, sku, stock, unitsSold,
// short, description, [img1, img2], tags, daysOld
const PRODUCTS = [
  ["Oxford Shirt — Ecru","oxford-shirt-ecru","men","shirts",6500,null,"MT-M-SHT-001",140,420,
   "Japanese long-staple cotton oxford, washed soft.",
   "<p>Woven in Japan from long-staple cotton, then washed once so it arrives soft rather than stiff. Unfused collar, single-needle side seams, and a box pleat at the back yoke.</p>",
   ["photo-1602810318383-e386cc2a3ccf","photo-1596755094514-f87e34085b2c"],["cotton","shirt","japanese"],8],
  ["Camp Collar Shirt","camp-collar-shirt","men","shirts",5900,4200,"MT-M-SHT-002",74,196,
   "Cotton-linen camp collar, cut boxy.",
   "<p>A boxy camp-collar shirt in a breathable cotton-linen slub. Cut short enough to wear untucked, with a single chest pocket.</p>",
   ["photo-1566174053879-31528523f8ae","photo-1495121605193-b116b5b9c5fe"],["linen","summer","shirt"],22],
  ["Garment-Dyed Tee","garment-dyed-tee","men","shirts",3200,2400,"MT-M-SHT-003",260,731,
   "240gsm cotton, dyed after construction.",
   "<p>A heavyweight 240gsm cotton tee, dyed after construction so the colour settles unevenly in the best way. Ribbed collar that will not twist.</p>",
   ["photo-1521572163474-6864f9cf17ab","photo-1572804013309-59a88b7e92f1"],["cotton","tee","everyday"],3],
  ["Hokkaido Merino Crew","hokkaido-merino-crew","men","knitwear",8900,6900,"MT-M-KNT-001",96,312,
   "Extrafine merino crew, fully fashioned.",
   "<p>Spun from 19.5-micron extrafine merino and knitted on vintage gauge machines. Fully fashioned shoulders mean the seams follow the body.</p>",
   ["photo-1576871337622-98d48d1cf531","photo-1591047139829-d91aecb6caea"],["merino","knitwear","everyday"],15],
  ["Cashmere Half-Zip","cashmere-half-zip","men","knitwear",21500,null,"MT-M-KNT-002",27,88,
   "Two-ply cashmere half-zip in a relaxed cut.",
   "<p>Two-ply Inner Mongolian cashmere in a relaxed half-zip. Ribbed cuffs and hem hold their shape; the collar stands without a facing.</p>",
   ["photo-1620799140408-edc6dcb6d633","photo-1515886657613-9f3515b0c78f"],["cashmere","knitwear","luxury"],40],
  ["The Alpine Shell","the-alpine-shell","men","outerwear",18900,14900,"MT-M-OUT-001",42,128,
   "Three-layer recycled shell with taped seams.",
   "<p>A three-layer waterproof shell built with a recycled face fabric and fully taped seams. Articulated sleeves and a two-way centre zip.</p>",
   ["photo-1551028719-00167b16eac5","photo-1544923246-77307dd654cb"],["waterproof","recycled","outerwear"],5],
  ["Kyoto Overcoat","kyoto-overcoat","men","outerwear",32000,null,"MT-M-OUT-002",18,64,
   "Unstructured wool-cashmere overcoat, half-lined.",
   "<p>An unstructured overcoat in a Japanese wool-cashmere melton. Raglan sleeves and a single patch pocket at each hip keep the silhouette quiet.</p>",
   ["photo-1539533018447-63fcce2678e3","photo-1608234807905-4466023792f5"],["wool","cashmere","overcoat"],60],
  ["Wide-Leg Chino","wide-leg-chino","men","trousers",9500,null,"MT-M-TRS-001",88,173,
   "Garment-dyed Italian twill, pleated and wide.",
   "<p>A high-rise, wide-leg chino in garment-dyed Italian twill. Pleated front, extended tab closure, and a clean finish through the seat.</p>",
   ["photo-1594633312681-425c7b97ccd1","photo-1473966968600-fa801b869a1a"],["chino","trousers","italian"],30],
  ["Leather Derby — Chestnut","leather-derby-chestnut","men","footwear",28900,23100,"MT-M-FTW-001",31,112,
   "Goodyear-welted derby, made in Italy.",
   "<p>Goodyear-welted derbies on a rounded last, made in a family workshop outside Florence. Resoleable, so they can be kept going indefinitely.</p>",
   ["photo-1549298916-b41d501d3772","photo-1614252235316-8c857d38b5f4"],["leather","shoes","italian"],45],
  ["Full-Grain Leather Belt","full-grain-leather-belt","men","accessories",4500,null,"MT-M-ACC-001",210,508,
   "Vegetable-tanned hide, solid brass buckle.",
   "<p>Cut from a single length of vegetable-tanned full-grain hide and finished with a solid brass buckle.</p>",
   ["photo-1553062407-98eeb64c6a62","photo-1583496661160-fb5886a0aaaa"],["leather","belt","accessories"],70],

  ["Silk Slip Dress","silk-slip-dress","women","dresses",16500,null,"MT-W-DRS-001",46,204,
   "Sand-washed silk, cut on the bias.",
   "<p>Cut on the bias from sand-washed 19-momme silk, so it falls rather than clings. French seams throughout and an adjustable strap.</p>",
   ["photo-1539008835657-9e8e9680c956","photo-1595777457583-95e059d581b8"],["silk","dress","occasion"],4],
  ["Poplin Midi Dress","poplin-midi-dress","women","dresses",11900,8900,"MT-W-DRS-002",62,288,
   "Crisp cotton poplin with a tie waist.",
   "<p>A crisp organic cotton poplin midi with a self-tie waist and a gently gathered skirt. Deep side pockets.</p>",
   ["photo-1554568218-0f1715e72254","photo-1611312449408-fcece27cdbb7"],["cotton","dress","everyday"],11],
  ["Pleated Tea Dress","pleated-tea-dress","women","dresses",13500,null,"MT-W-DRS-003",38,141,
   "Knife-pleated crepe with a covered placket.",
   "<p>Knife-pleated from the waist in a soft recycled crepe. The pleats are heat-set so they hold through a wash.</p>",
   ["photo-1583496661160-fb5886a0aaaa","photo-1618354691373-d851c5c3a990"],["crepe","dress","pleated"],26],
  ["Silk-Blend Blouse","silk-blend-blouse","women","shirts",8900,null,"MT-W-SHT-001",84,267,
   "Fluid silk-cotton with a concealed placket.",
   "<p>A fluid silk-cotton blend with a concealed placket and a collar that sits softly open. Cut long enough to tuck.</p>",
   ["photo-1485968579580-b6d095142e6e","photo-1487412720507-e7ab37603c6f"],["silk","blouse","workwear"],9],
  ["Boxy Cotton Shirt","boxy-cotton-shirt","women","shirts",6900,5200,"MT-W-SHT-002",110,322,
   "Washed cotton, cut square and easy.",
   "<p>Washed organic cotton cut square through the body, with a dropped shoulder and a curved hem.</p>",
   ["photo-1496747611176-843222e1e57c","photo-1479064555552-3ef4979f8908"],["cotton","shirt","everyday"],18],
  ["Cashmere Boat Neck","cashmere-boat-neck","women","knitwear",18900,null,"MT-W-KNT-001",34,158,
   "Grade-A cashmere in a wide boat neck.",
   "<p>Grade-A Inner Mongolian cashmere knitted to a fine gauge, with a wide boat neck that holds its line.</p>",
   ["photo-1581044777550-4cfa60707c03","photo-1564557287817-3785e38ec1f5"],["cashmere","knitwear","luxury"],13],
  ["Merino Rib Cardigan","merino-rib-cardigan","women","knitwear",12500,9900,"MT-W-KNT-002",57,219,
   "Fine-gauge merino rib with corozo buttons.",
   "<p>A fine-gauge merino rib that skims rather than clings, finished with corozo buttons turned from tagua nut.</p>",
   ["photo-1502716119720-b23a93e5fe1b","photo-1617137968427-85924c800a22"],["merino","cardigan","layering"],21],
  ["Belted Wool Coat","belted-wool-coat","women","outerwear",29500,null,"MT-W-OUT-001",21,97,
   "Double-faced Italian wool, fully belted.",
   "<p>Double-faced Italian wool with no lining needed — the reverse is finished as neatly as the face. A wide self-belt cinches it.</p>",
   ["photo-1434389677669-e08b4cac3105","photo-1490114538077-0a7f8cb49891"],["wool","coat","italian"],35],
  ["Quilted Liner Jacket","quilted-liner-jacket-w","women","outerwear",12500,9900,"MT-W-OUT-002",58,203,
   "Diamond-quilted liner with recycled fill.",
   "<p>A diamond-quilted liner that works alone through the shoulder seasons or under a coat when it turns. Recycled fill, corduroy collar.</p>",
   ["photo-1509319117193-57bab727e09d","photo-1485462537746-965f33f7f6a7"],["quilted","layering","recycled"],28],
  ["High-Rise Wide Trouser","high-rise-wide-trouser","women","trousers",10900,null,"MT-W-TRS-001",72,186,
   "Fluid tencel twill with a clean high waist.",
   "<p>A fluid Tencel twill cut high at the waist and wide to the floor. Side-seam pockets sit flat.</p>",
   ["photo-1594633312681-425c7b97ccd1","photo-1445205170230-053b83016050"],["tencel","trousers","tailoring"],16],

  ["Lambswool Scarf","lambswool-scarf","unisex","accessories",5500,null,"MT-U-ACC-001",130,267,
   "Scottish lambswool with hand-tied fringe.",
   "<p>Woven in the Scottish Borders from soft lambswool, with hand-tied fringing at both ends.</p>",
   ["photo-1520903074185-8eca362b3dce","photo-1469334031218-e382a71b716b"],["wool","scarf","scotland"],50],
  ["Canvas Weekender","canvas-weekender","unisex","accessories",16500,null,"MT-U-ACC-002",24,77,
   "Waxed canvas holdall with bridle leather trim.",
   "<p>A 20oz waxed canvas holdall with bridle leather handles and a brass zip. Sized to clear most carry-on limits.</p>",
   ["photo-1553062407-98eeb64c6a62","photo-1441984904996-e0b6ba687e04"],["bag","canvas","travel"],55],
];

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL"];
const SHOE_SIZES = ["6", "7", "8", "9", "10", "11"];
const COLOURS = ["Ecru", "Charcoal", "Navy"];
const VARIANT_CATEGORIES = ["shirts", "knitwear", "outerwear", "trousers", "dresses"];

const HERO_SLIDES = [
  ["photo-1490481651871-ab68de25d43d", "Built for the long run",
   "Autumn/Winter essentials for men and women, cut from fabrics chosen to outlast the season.",
   "Shop the collection", "/products"],
  ["photo-1595777457583-95e059d581b8", "The women's edit",
   "Silk, cashmere and cotton poplin — pieces that do the work of five.", "Shop women", "/women"],
  ["photo-1441984904996-e0b6ba687e04", "The men's edit",
   "Japanese shirting, Italian tailoring and outerwear that earns its keep.", "Shop men", "/men"],
];

const TESTIMONIALS = [
  ["Ananya R.", "Bengaluru", "The merino crew has been in weekly rotation for eight months and still looks new. Worth every rupee.", 5],
  ["Devansh K.", "Mumbai", "Fit and finish you normally pay three times as much for. The oxford is the best shirt I own.", 5],
  ["Priya M.", "Delhi", "Ordered the slip dress on a Tuesday, wearing it by Thursday. Packaging was lovely and entirely recyclable.", 5],
  ["Rohan S.", "Pune", "The derbies needed a week to break in and now they feel custom. Resoleable, so they are staying.", 4],
];

const SOCIAL = [
  "photo-1441984904996-e0b6ba687e04", "photo-1445205170230-053b83016050",
  "photo-1469334031218-e382a71b716b", "photo-1485462537746-965f33f7f6a7",
  "photo-1509319117193-57bab727e09d", "photo-1490481651871-ab68de25d43d",
];

const PAGE_SEO = [
  ["home", "MI TRENDS — Considered essentials", "Modern wardrobe essentials for men and women. Free shipping over ₹2,000."],
  ["about", "About MI TRENDS", "How we choose fabrics, the workshops we partner with, and why we make fewer things."],
  ["contact", "Contact MI TRENDS", "Questions about an order, sizing or a return? We answer within one business day."],
  ["faq", "Frequently asked questions", "Sizing, shipping, returns and care — answered."],
  ["shipping-policy", "Shipping Policy", "Delivery timelines, costs and tracking."],
  ["returns-policy", "Returns Policy", "Thirty-day returns on unworn items."],
  ["privacy-policy", "Privacy Policy", "What we collect, why, and how to have it removed."],
  ["terms", "Terms of Service", "The terms that govern use of this store."],
];

const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const RESET = process.argv.includes("--reset");

async function main() {
  console.log(`\n  MI TRENDS seed → ${URL_BASE}\n`);

  // Preflight: the gender column is the one thing this script cannot create.
  const probe = await select("products", "select=gender&limit=1");
  if (!probe.ok && JSON.stringify(probe.body).includes("does not exist")) {
    fail(
      "products.gender is missing.\n\n" +
        "    Run supabase/migrations/0004_gender.sql in the Supabase SQL editor\n" +
        "    first (it is 20 lines), then run this script again.",
    );
  }
  if (!probe.ok) {
    fail(`Could not reach the products table: ${JSON.stringify(probe.body)}`);
  }
  console.log("  ✓ schema looks right (products.gender present)");

  if (RESET) {
    console.log("  · --reset: clearing seeded rows");
    for (const t of [
      "product_variants", "product_option_values", "product_options",
      "product_images", "products", "categories", "hero_slides",
      "testimonials", "social_posts", "shipping_methods", "coupons",
      "page_seo", "seo_settings", "site_settings",
    ]) {
      await rest(`${t}?id=not.is.null`, { method: "DELETE" });
    }
  }

  // -- site settings ------------------------------------------------------
  if ((await count("site_settings")) === 0) {
    await insert("site_settings", [{
      site_name: "MI TRENDS",
      tagline: "Considered essentials for men and women.",
      contact_email: "hello@mitrends.com",
      contact_phone: "+91 98765 43210",
      business_address: "4th Floor, Prestige Atrium, MG Road, Bengaluru 560001, India",
      currency_code: "INR", currency_symbol: "₹", tax_rate: 18, tax_inclusive: false,
      announcement_bar_active: true,
      announcement_bar_text: "Complimentary shipping on orders over ₹2,000",
      announcement_bar_color: "#1A1A1A",
      social_instagram: "https://instagram.com/mitrends",
      social_facebook: "https://facebook.com/mitrends",
      social_twitter: "https://x.com/mitrends",
      social_youtube: "https://youtube.com/@mitrends",
      sale_active: true,
      sale_headline: "Mid-season sale — up to 30% off",
      sale_ends_at: new Date(Date.now() + 6 * 86400000).toISOString(),
    }]);
    console.log("  ✓ site_settings");
  } else console.log("  · site_settings already present");

  if ((await count("seo_settings")) === 0) {
    await insert("seo_settings", [{
      meta_title_template: "{page} | MI TRENDS",
      default_meta_description:
        "MI TRENDS — considered essentials for men and women. Free shipping over ₹2,000.",
    }]);
    console.log("  ✓ seo_settings");
  }

  // -- categories ---------------------------------------------------------
  let categories = (await select("categories", "select=id,slug")).body || [];
  if (categories.length === 0) {
    const res = await insert(
      "categories",
      CATEGORIES.map(([name, slug, description, photo], i) => ({
        name, slug, description, image_url: U(photo, 1200), sort_order: i + 1,
      })),
    );
    if (!res.ok) fail(`categories: ${JSON.stringify(res.body)}`);
    categories = res.body;
    console.log(`  ✓ categories (${categories.length})`);
  } else console.log(`  · categories already present (${categories.length})`);

  const categoryId = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  // -- products -----------------------------------------------------------
  let products = (await select("products", "select=id,slug,sku")).body || [];
  if (products.length === 0) {
    const res = await insert(
      "products",
      PRODUCTS.map(([title, slug, gender, cat, price, salePrice, sku, stock,
                     unitsSold, short, description, , tags, daysOld]) => ({
        title, slug, gender,
        category_id: categoryId[cat] ?? null,
        price, sale_price: salePrice, sku,
        stock_quantity: stock, units_sold: unitsSold,
        short_description: short, description,
        meta_description: short,
        status: "active", tags,
        created_at: daysAgo(daysOld),
      })),
    );
    if (!res.ok) fail(`products: ${JSON.stringify(res.body)}`);
    products = res.body;
    console.log(`  ✓ products (${products.length})`);
  } else console.log(`  · products already present (${products.length})`);

  const productId = Object.fromEntries(products.map((p) => [p.slug, p.id]));
  const productSku = Object.fromEntries(products.map((p) => [p.slug, p.sku]));

  // -- product images -----------------------------------------------------
  if ((await count("product_images")) === 0) {
    const rows = [];
    for (const p of PRODUCTS) {
      const [title, slug, , , , , , , , , , images] = p;
      const id = productId[slug];
      if (!id) continue;
      images.forEach((photo, i) => {
        rows.push({
          product_id: id, image_url: U(photo), sort_order: i,
          alt_text: i === 0 ? title : `${title} — detail`,
        });
      });
    }
    const res = await insert("product_images", rows);
    if (!res.ok) fail(`product_images: ${JSON.stringify(res.body)}`);
    console.log(`  ✓ product_images (${rows.length})`);
  } else console.log("  · product_images already present");

  // -- options and variants ----------------------------------------------
  if ((await count("product_options")) === 0) {
    let optionCount = 0;
    let variantCount = 0;

    for (const p of PRODUCTS) {
      const [, slug, , cat] = p;
      const id = productId[slug];
      if (!id) continue;

      const isShoe = cat === "footwear";
      const isApparel = VARIANT_CATEGORIES.includes(cat);
      if (!isShoe && !isApparel) continue;

      const sizes = isShoe ? SHOE_SIZES : APPAREL_SIZES;
      const sku = productSku[slug] || "MT";

      const optRes = await insert("product_options", [
        { product_id: id, name: "Size", sort_order: 0 },
        ...(isApparel ? [{ product_id: id, name: "Colour", sort_order: 1 }] : []),
      ]);
      if (!optRes.ok) fail(`product_options: ${JSON.stringify(optRes.body)}`);
      optionCount += optRes.body.length;

      const sizeOpt = optRes.body.find((o) => o.name === "Size");
      const colourOpt = optRes.body.find((o) => o.name === "Colour");

      await insert("product_option_values", [
        ...sizes.map((v, i) => ({ option_id: sizeOpt.id, value: v, sort_order: i })),
        ...(colourOpt
          ? COLOURS.map((v, i) => ({ option_id: colourOpt.id, value: v, sort_order: i }))
          : []),
      ]);

      const variants = [];
      sizes.forEach((size, i) => {
        const combos = colourOpt ? COLOURS : [null];
        combos.forEach((colour) => {
          // Leave one combination out of stock so the PDP shows that state.
          const soldOut = colour ? size === "XL" && colour === "Navy" : size === "11";
          variants.push({
            product_id: id,
            sku: colour ? `${sku}-${size}-${colour.slice(0, 3).toUpperCase()}` : `${sku}-${size}`,
            stock_quantity: soldOut ? 0 : 6 + i * 3,
            option_values: [
              { option_name: "Size", value: size },
              ...(colour ? [{ option_name: "Colour", value: colour }] : []),
            ],
          });
        });
      });

      const varRes = await insert("product_variants", variants);
      if (!varRes.ok) fail(`product_variants: ${JSON.stringify(varRes.body)}`);
      variantCount += variants.length;
    }
    console.log(`  ✓ options (${optionCount}) and variants (${variantCount})`);
  } else console.log("  · options/variants already present");

  // -- homepage content ---------------------------------------------------
  if ((await count("hero_slides")) === 0) {
    await insert("hero_slides", HERO_SLIDES.map(([photo, heading, sub, cta, link], i) => ({
      image_url: U(photo, 2000), heading, subheading: sub,
      cta_text: cta, cta_link: link, sort_order: i, is_active: true,
    })));
    console.log("  ✓ hero_slides");
  }

  if ((await count("shipping_methods")) === 0) {
    await insert("shipping_methods", [
      { name: "Standard", price: 99, estimated_delivery: "4–6 business days", free_shipping_threshold: 2000, sort_order: 0 },
      { name: "Express", price: 249, estimated_delivery: "2–3 business days", free_shipping_threshold: null, sort_order: 1 },
      { name: "Next Day", price: 499, estimated_delivery: "Next business day", free_shipping_threshold: null, sort_order: 2 },
    ]);
    console.log("  ✓ shipping_methods");
  }

  if ((await count("coupons")) === 0) {
    await insert("coupons", [
      { code: "WELCOME10", type: "percentage", value: 10, min_order_amount: 2000, usage_limit: 500, per_customer_limit: 1, is_active: true },
      { code: "FLAT500", type: "fixed", value: 500, min_order_amount: 5000, usage_limit: 200, per_customer_limit: 2, is_active: true },
    ]);
    console.log("  ✓ coupons");
  }

  if ((await count("testimonials")) === 0) {
    await insert("testimonials", TESTIMONIALS.map(([author_name, author_role, quote, rating], i) => ({
      author_name, author_role, quote, rating, sort_order: i, is_active: true,
    })));
    console.log("  ✓ testimonials");
  }

  if ((await count("social_posts")) === 0) {
    await insert("social_posts", SOCIAL.map((photo, i) => ({
      image_url: U(photo, 800), link: "/products", caption: "From the feed",
      sort_order: i, is_active: true,
    })));
    console.log("  ✓ social_posts");
  }

  if ((await count("page_seo")) === 0) {
    await insert("page_seo", PAGE_SEO.map(([page_slug, meta_title, meta_description]) => ({
      page_slug, meta_title, meta_description,
    })));
    console.log("  ✓ page_seo");
  }

  // -- summary ------------------------------------------------------------
  console.log("\n  Row counts:");
  const empties = [];
  for (const t of ["categories", "products", "product_images", "product_variants",
                   "hero_slides", "shipping_methods", "coupons", "testimonials",
                   "social_posts", "page_seo"]) {
    const n = await count(t);
    console.log(`    ${t.padEnd(20)} ${n}${n === 0 ? "   <-- EMPTY" : ""}`);
    if (n === 0) empties.push(t);
  }

  if (empties.length > 0) {
    console.log(
      `\n  Warning: ${empties.join(", ")} came back empty.` +
        "\n  Checkout needs at least one shipping method to work.\n",
    );
  } else {
    console.log("\n  Done. Reload http://localhost:3000\n");
  }
}

main().catch((err) => fail(err.message));
