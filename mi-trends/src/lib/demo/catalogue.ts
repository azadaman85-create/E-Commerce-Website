/**
 * Demo catalogue.
 *
 * The storefront falls back to this whenever Supabase is not configured
 * (see `isDemoMode()` in `src/lib/demo/index.ts`), so a fresh clone renders a
 * complete shop on localhost with no database. Every image URL resolves.
 */

export type Gender = "men" | "women" | "unisex";

const U = (id: string, w = 1400) => `https://images.unsplash.com/${id}?w=${w}&q=80`;

export interface DemoProductSpec {
  slug: string;
  title: string;
  gender: Gender;
  category: string;
  price: number;
  salePrice?: number;
  stock: number;
  unitsSold: number;
  sku: string;
  short: string;
  description: string;
  images: [string, string];
  tags: string[];
  /** Apparel gets size + colour variants; footwear gets sizes only. */
  sizes?: string[];
  colours?: string[];
  rating: number;
  reviewCount: number;
  daysOld: number;
}

export const DEMO_CATEGORIES = [
  { slug: "shirts", name: "Shirts", image: U("photo-1602810318383-e386cc2a3ccf", 1200) },
  { slug: "knitwear", name: "Knitwear", image: U("photo-1576871337622-98d48d1cf531", 1200) },
  { slug: "outerwear", name: "Outerwear", image: U("photo-1551028719-00167b16eac5", 1200) },
  { slug: "trousers", name: "Trousers", image: U("photo-1473966968600-fa801b869a1a", 1200) },
  { slug: "dresses", name: "Dresses", image: U("photo-1539008835657-9e8e9680c956", 1200) },
  { slug: "footwear", name: "Footwear", image: U("photo-1549298916-b41d501d3772", 1200) },
  { slug: "accessories", name: "Accessories", image: U("photo-1553062407-98eeb64c6a62", 1200) },
];

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL"];
const SHOE_SIZES = ["6", "7", "8", "9", "10", "11"];
const NEUTRALS = ["Ecru", "Charcoal", "Navy"];

export const DEMO_PRODUCTS: DemoProductSpec[] = [
  // ---------------------------------------------------------------- MEN ---
  {
    slug: "oxford-shirt-ecru",
    title: "Oxford Shirt — Ecru",
    gender: "men",
    category: "shirts",
    price: 6500,
    stock: 140,
    unitsSold: 420,
    sku: "MT-M-SHT-001",
    short: "Japanese long-staple cotton oxford, washed soft.",
    description:
      "<p>Woven in Japan from long-staple cotton, then washed once so it arrives soft rather than stiff. Unfused collar, single-needle side seams, and a box pleat at the back yoke.</p><p>Cut with a little room through the body — it works tucked or loose.</p>",
    images: [U("photo-1602810318383-e386cc2a3ccf"), U("photo-1596755094514-f87e34085b2c")],
    tags: ["cotton", "shirt", "japanese"],
    sizes: APPAREL_SIZES,
    colours: NEUTRALS,
    rating: 4.8,
    reviewCount: 64,
    daysOld: 8,
  },
  {
    slug: "camp-collar-shirt",
    title: "Camp Collar Shirt",
    gender: "men",
    category: "shirts",
    price: 5900,
    salePrice: 4200,
    stock: 74,
    unitsSold: 196,
    sku: "MT-M-SHT-002",
    short: "Cotton-linen camp collar, cut boxy.",
    description:
      "<p>A boxy camp-collar shirt in a breathable cotton-linen slub. Cut short enough to wear untucked, with a single chest pocket and a soft, unlined collar that sits flat.</p>",
    images: [U("photo-1566174053879-31528523f8ae"), U("photo-1495121605193-b116b5b9c5fe")],
    tags: ["linen", "summer", "shirt"],
    sizes: APPAREL_SIZES,
    colours: NEUTRALS,
    rating: 4.6,
    reviewCount: 38,
    daysOld: 22,
  },
  {
    slug: "garment-dyed-tee",
    title: "Garment-Dyed Tee",
    gender: "men",
    category: "shirts",
    price: 3200,
    salePrice: 2400,
    stock: 260,
    unitsSold: 731,
    sku: "MT-M-SHT-003",
    short: "240gsm cotton, dyed after construction.",
    description:
      "<p>A heavyweight 240gsm cotton tee, dyed after construction so the colour settles unevenly in the best way. Ribbed collar that will not twist out of shape in the wash.</p>",
    images: [U("photo-1521572163474-6864f9cf17ab"), U("photo-1572804013309-59a88b7e92f1")],
    tags: ["cotton", "tee", "everyday"],
    sizes: APPAREL_SIZES,
    colours: NEUTRALS,
    rating: 4.7,
    reviewCount: 152,
    daysOld: 3,
  },
  {
    slug: "hokkaido-merino-crew",
    title: "Hokkaido Merino Crew",
    gender: "men",
    category: "knitwear",
    price: 8900,
    salePrice: 6900,
    stock: 96,
    unitsSold: 312,
    sku: "MT-M-KNT-001",
    short: "Extrafine merino crew, fully fashioned.",
    description:
      "<p>Spun from 19.5-micron extrafine merino and knitted on vintage gauge machines. Fully fashioned shoulders mean the seams follow the body rather than fighting it.</p><p>Machine washable on a wool cycle.</p>",
    images: [U("photo-1576871337622-98d48d1cf531"), U("photo-1591047139829-d91aecb6caea")],
    tags: ["merino", "knitwear", "everyday"],
    sizes: APPAREL_SIZES,
    colours: NEUTRALS,
    rating: 4.9,
    reviewCount: 88,
    daysOld: 15,
  },
  {
    slug: "cashmere-half-zip",
    title: "Cashmere Half-Zip",
    gender: "men",
    category: "knitwear",
    price: 21500,
    stock: 27,
    unitsSold: 88,
    sku: "MT-M-KNT-002",
    short: "Two-ply cashmere half-zip in a relaxed cut.",
    description:
      "<p>Two-ply Inner Mongolian cashmere in a relaxed half-zip. Ribbed cuffs and hem hold their shape, and the collar stands without needing a facing.</p>",
    images: [U("photo-1620799140408-edc6dcb6d633"), U("photo-1515886657613-9f3515b0c78f")],
    tags: ["cashmere", "knitwear", "luxury"],
    sizes: APPAREL_SIZES,
    colours: NEUTRALS,
    rating: 4.8,
    reviewCount: 29,
    daysOld: 40,
  },
  {
    slug: "the-alpine-shell",
    title: "The Alpine Shell",
    gender: "men",
    category: "outerwear",
    price: 18900,
    salePrice: 14900,
    stock: 42,
    unitsSold: 128,
    sku: "MT-M-OUT-001",
    short: "Three-layer recycled shell with taped seams.",
    description:
      "<p>A three-layer waterproof shell built with a recycled face fabric and fully taped seams. Articulated sleeves, a helmet-compatible hood and a two-way centre zip make it as capable on the ridge as on the commute.</p>",
    images: [U("photo-1551028719-00167b16eac5"), U("photo-1544923246-77307dd654cb")],
    tags: ["waterproof", "recycled", "outerwear"],
    sizes: APPAREL_SIZES,
    colours: NEUTRALS,
    rating: 4.7,
    reviewCount: 51,
    daysOld: 5,
  },
  {
    slug: "kyoto-overcoat",
    title: "Kyoto Overcoat",
    gender: "men",
    category: "outerwear",
    price: 32000,
    stock: 18,
    unitsSold: 64,
    sku: "MT-M-OUT-002",
    short: "Unstructured wool-cashmere overcoat, half-lined.",
    description:
      "<p>An unstructured overcoat in a Japanese wool-cashmere melton. Raglan sleeves and a single patch pocket at each hip keep the silhouette quiet; the half-lining keeps it wearable well into spring.</p>",
    images: [U("photo-1539533018447-63fcce2678e3"), U("photo-1608234807905-4466023792f5")],
    tags: ["wool", "cashmere", "overcoat"],
    sizes: APPAREL_SIZES,
    colours: NEUTRALS,
    rating: 4.9,
    reviewCount: 22,
    daysOld: 60,
  },
  {
    slug: "wide-leg-chino",
    title: "Wide-Leg Chino",
    gender: "men",
    category: "trousers",
    price: 9500,
    stock: 88,
    unitsSold: 173,
    sku: "MT-M-TRS-001",
    short: "Garment-dyed Italian twill, pleated and wide.",
    description:
      "<p>A high-rise, wide-leg chino in garment-dyed Italian twill. Pleated front, extended tab closure, and a clean finish through the seat.</p>",
    images: [U("photo-1594633312681-425c7b97ccd1"), U("photo-1473966968600-fa801b869a1a")],
    tags: ["chino", "trousers", "italian"],
    sizes: APPAREL_SIZES,
    colours: NEUTRALS,
    rating: 4.5,
    reviewCount: 44,
    daysOld: 30,
  },
  {
    slug: "leather-derby-chestnut",
    title: "Leather Derby — Chestnut",
    gender: "men",
    category: "footwear",
    price: 28900,
    salePrice: 23100,
    stock: 31,
    unitsSold: 112,
    sku: "MT-M-FTW-001",
    short: "Goodyear-welted derby, made in Italy.",
    description:
      "<p>Goodyear-welted derbies on a rounded last, made in a family workshop outside Florence. Resoleable, so they can be kept going more or less indefinitely.</p>",
    images: [U("photo-1549298916-b41d501d3772"), U("photo-1614252235316-8c857d38b5f4")],
    tags: ["leather", "shoes", "italian"],
    sizes: SHOE_SIZES,
    rating: 4.8,
    reviewCount: 37,
    daysOld: 45,
  },
  {
    slug: "full-grain-leather-belt",
    title: "Full-Grain Leather Belt",
    gender: "men",
    category: "accessories",
    price: 4500,
    stock: 210,
    unitsSold: 508,
    sku: "MT-M-ACC-001",
    short: "Vegetable-tanned hide, solid brass buckle.",
    description:
      "<p>Cut from a single length of vegetable-tanned full-grain hide and finished with a solid brass buckle. It takes a few weeks to mould to you, and then lasts a decade.</p>",
    images: [U("photo-1553062407-98eeb64c6a62"), U("photo-1583496661160-fb5886a0aaaa")],
    tags: ["leather", "belt", "accessories"],
    sizes: ["S", "M", "L"],
    rating: 4.6,
    reviewCount: 91,
    daysOld: 70,
  },

  // -------------------------------------------------------------- WOMEN ---
  {
    slug: "silk-slip-dress",
    title: "Silk Slip Dress",
    gender: "women",
    category: "dresses",
    price: 16500,
    stock: 46,
    unitsSold: 204,
    sku: "MT-W-DRS-001",
    short: "Sand-washed silk, cut on the bias.",
    description:
      "<p>Cut on the bias from sand-washed 19-momme silk, so it falls rather than clings. French seams throughout and an adjustable strap that actually stays where you set it.</p>",
    images: [U("photo-1539008835657-9e8e9680c956"), U("photo-1595777457583-95e059d581b8")],
    tags: ["silk", "dress", "occasion"],
    sizes: APPAREL_SIZES,
    colours: ["Ecru", "Charcoal", "Olive"],
    rating: 4.9,
    reviewCount: 76,
    daysOld: 4,
  },
  {
    slug: "poplin-midi-dress",
    title: "Poplin Midi Dress",
    gender: "women",
    category: "dresses",
    price: 11900,
    salePrice: 8900,
    stock: 62,
    unitsSold: 288,
    sku: "MT-W-DRS-002",
    short: "Crisp cotton poplin with a tie waist.",
    description:
      "<p>A crisp organic cotton poplin midi with a self-tie waist and a gently gathered skirt. Deep side pockets, and a placket that buttons high or open.</p>",
    images: [U("photo-1554568218-0f1715e72254"), U("photo-1611312449408-fcece27cdbb7")],
    tags: ["cotton", "dress", "everyday"],
    sizes: APPAREL_SIZES,
    colours: ["Ecru", "Navy", "Olive"],
    rating: 4.7,
    reviewCount: 112,
    daysOld: 11,
  },
  {
    slug: "pleated-tea-dress",
    title: "Pleated Tea Dress",
    gender: "women",
    category: "dresses",
    price: 13500,
    stock: 38,
    unitsSold: 141,
    sku: "MT-W-DRS-003",
    short: "Knife-pleated crepe with a covered button placket.",
    description:
      "<p>Knife-pleated from the waist in a soft recycled crepe. The pleats are heat-set so they hold through a wash, and the placket buttons are covered in the same cloth.</p>",
    images: [U("photo-1583496661160-fb5886a0aaaa"), U("photo-1618354691373-d851c5c3a990")],
    tags: ["crepe", "dress", "pleated"],
    sizes: APPAREL_SIZES,
    colours: ["Charcoal", "Navy", "Olive"],
    rating: 4.6,
    reviewCount: 48,
    daysOld: 26,
  },
  {
    slug: "silk-blend-blouse",
    title: "Silk-Blend Blouse",
    gender: "women",
    category: "shirts",
    price: 8900,
    stock: 84,
    unitsSold: 267,
    sku: "MT-W-SHT-001",
    short: "Fluid silk-cotton with a concealed placket.",
    description:
      "<p>A fluid silk-cotton blend with a concealed placket and a collar that sits softly open. Cut long enough to tuck without riding up through the day.</p>",
    images: [U("photo-1485968579580-b6d095142e6e"), U("photo-1487412720507-e7ab37603c6f")],
    tags: ["silk", "blouse", "workwear"],
    sizes: APPAREL_SIZES,
    colours: NEUTRALS,
    rating: 4.7,
    reviewCount: 83,
    daysOld: 9,
  },
  {
    slug: "boxy-cotton-shirt",
    title: "Boxy Cotton Shirt",
    gender: "women",
    category: "shirts",
    price: 6900,
    salePrice: 5200,
    stock: 110,
    unitsSold: 322,
    sku: "MT-W-SHT-002",
    short: "Washed cotton, cut square and easy.",
    description:
      "<p>Washed organic cotton cut square through the body, with a dropped shoulder and a curved hem. The kind of shirt that works over everything.</p>",
    images: [U("photo-1496747611176-843222e1e57c"), U("photo-1479064555552-3ef4979f8908")],
    tags: ["cotton", "shirt", "everyday"],
    sizes: APPAREL_SIZES,
    colours: NEUTRALS,
    rating: 4.5,
    reviewCount: 96,
    daysOld: 18,
  },
  {
    slug: "cashmere-boat-neck",
    title: "Cashmere Boat Neck",
    gender: "women",
    category: "knitwear",
    price: 18900,
    stock: 34,
    unitsSold: 158,
    sku: "MT-W-KNT-001",
    short: "Grade-A cashmere in a wide boat neck.",
    description:
      "<p>Grade-A Inner Mongolian cashmere knitted to a fine gauge, with a wide boat neck that holds its line. Light enough to layer, warm enough not to need to.</p>",
    images: [U("photo-1581044777550-4cfa60707c03"), U("photo-1564557287817-3785e38ec1f5")],
    tags: ["cashmere", "knitwear", "luxury"],
    sizes: APPAREL_SIZES,
    colours: NEUTRALS,
    rating: 4.9,
    reviewCount: 61,
    daysOld: 13,
  },
  {
    slug: "merino-rib-cardigan",
    title: "Merino Rib Cardigan",
    gender: "women",
    category: "knitwear",
    price: 12500,
    salePrice: 9900,
    stock: 57,
    unitsSold: 219,
    sku: "MT-W-KNT-002",
    short: "Fine-gauge merino rib with corozo buttons.",
    description:
      "<p>A fine-gauge merino rib that skims rather than clings, finished with corozo buttons turned from tagua nut. Wears open as easily as it buttons up.</p>",
    images: [U("photo-1502716119720-b23a93e5fe1b"), U("photo-1617137968427-85924c800a22")],
    tags: ["merino", "cardigan", "layering"],
    sizes: APPAREL_SIZES,
    colours: NEUTRALS,
    rating: 4.6,
    reviewCount: 74,
    daysOld: 21,
  },
  {
    slug: "belted-wool-coat",
    title: "Belted Wool Coat",
    gender: "women",
    category: "outerwear",
    price: 29500,
    stock: 21,
    unitsSold: 97,
    sku: "MT-W-OUT-001",
    short: "Double-faced Italian wool, fully belted.",
    description:
      "<p>Double-faced Italian wool with no lining needed — the reverse is finished as neatly as the face. A wide self-belt cinches it; released, it falls straight and long.</p>",
    images: [U("photo-1434389677669-e08b4cac3105"), U("photo-1490114538077-0a7f8cb49891")],
    tags: ["wool", "coat", "italian"],
    sizes: APPAREL_SIZES,
    colours: ["Ecru", "Charcoal", "Navy"],
    rating: 4.8,
    reviewCount: 33,
    daysOld: 35,
  },
  {
    slug: "quilted-liner-jacket-w",
    title: "Quilted Liner Jacket",
    gender: "women",
    category: "outerwear",
    price: 12500,
    salePrice: 9900,
    stock: 58,
    unitsSold: 203,
    sku: "MT-W-OUT-002",
    short: "Diamond-quilted liner with recycled fill.",
    description:
      "<p>A diamond-quilted liner that works alone through the shoulder seasons or under a coat when it turns. Recycled fill and a corduroy collar.</p>",
    images: [U("photo-1509319117193-57bab727e09d"), U("photo-1485462537746-965f33f7f6a7")],
    tags: ["quilted", "layering", "recycled"],
    sizes: APPAREL_SIZES,
    colours: NEUTRALS,
    rating: 4.5,
    reviewCount: 58,
    daysOld: 28,
  },
  {
    slug: "high-rise-wide-trouser",
    title: "High-Rise Wide Trouser",
    gender: "women",
    category: "trousers",
    price: 10900,
    stock: 72,
    unitsSold: 186,
    sku: "MT-W-TRS-001",
    short: "Fluid tencel twill with a clean high waist.",
    description:
      "<p>A fluid Tencel twill cut high at the waist and wide to the floor. Side-seam pockets sit flat, and the waistband is faced rather than elasticated.</p>",
    images: [U("photo-1594633312681-425c7b97ccd1"), U("photo-1445205170230-053b83016050")],
    tags: ["tencel", "trousers", "tailoring"],
    sizes: APPAREL_SIZES,
    colours: NEUTRALS,
    rating: 4.6,
    reviewCount: 67,
    daysOld: 16,
  },

  // ------------------------------------------------------------- UNISEX ---
  {
    slug: "lambswool-scarf",
    title: "Lambswool Scarf",
    gender: "unisex",
    category: "accessories",
    price: 5500,
    stock: 130,
    unitsSold: 267,
    sku: "MT-U-ACC-001",
    short: "Scottish lambswool with hand-tied fringe.",
    description:
      "<p>Woven in the Scottish Borders from soft lambswool, with hand-tied fringing at both ends. Wide enough to double over without bulk.</p>",
    images: [U("photo-1520903074185-8eca362b3dce"), U("photo-1469334031218-e382a71b716b")],
    tags: ["wool", "scarf", "scotland"],
    colours: NEUTRALS,
    rating: 4.7,
    reviewCount: 84,
    daysOld: 50,
  },
  {
    slug: "canvas-weekender",
    title: "Canvas Weekender",
    gender: "unisex",
    category: "accessories",
    price: 16500,
    stock: 24,
    unitsSold: 77,
    sku: "MT-U-ACC-002",
    short: "Waxed canvas holdall with bridle leather trim.",
    description:
      "<p>A 20oz waxed canvas holdall with bridle leather handles and a solid brass zip. Sized to clear most carry-on limits, and it only looks better beaten up.</p>",
    images: [U("photo-1553062407-98eeb64c6a62"), U("photo-1441984904996-e0b6ba687e04")],
    tags: ["bag", "canvas", "travel"],
    rating: 4.8,
    reviewCount: 41,
    daysOld: 55,
  },
];

export const DEMO_HERO_SLIDES = [
  {
    image_url: U("photo-1490481651871-ab68de25d43d", 2000),
    heading: "Built for the long run",
    subheading:
      "Autumn/Winter essentials for men and women, cut from fabrics chosen to outlast the season.",
    cta_text: "Shop the collection",
    cta_link: "/products",
  },
  {
    image_url: U("photo-1595777457583-95e059d581b8", 2000),
    heading: "The women's edit",
    subheading: "Silk, cashmere and cotton poplin — pieces that do the work of five.",
    cta_text: "Shop women",
    cta_link: "/women",
  },
  {
    image_url: U("photo-1441984904996-e0b6ba687e04", 2000),
    heading: "The men's edit",
    subheading: "Japanese shirting, Italian tailoring and outerwear that earns its keep.",
    cta_text: "Shop men",
    cta_link: "/men",
  },
];

export const DEMO_TESTIMONIALS = [
  {
    author_name: "Ananya R.",
    author_role: "Bengaluru",
    quote:
      "The merino crew has been in weekly rotation for eight months and still looks new. Worth every rupee.",
    rating: 5,
  },
  {
    author_name: "Devansh K.",
    author_role: "Mumbai",
    quote:
      "Fit and finish you normally pay three times as much for. The oxford is the best shirt I own.",
    rating: 5,
  },
  {
    author_name: "Priya M.",
    author_role: "Delhi",
    quote:
      "Ordered the slip dress on a Tuesday, wearing it by Thursday. Packaging was lovely and entirely recyclable.",
    rating: 5,
  },
  {
    author_name: "Rohan S.",
    author_role: "Pune",
    quote:
      "The derbies needed a week to break in and now they feel custom. Resoleable, so they are staying.",
    rating: 4,
  },
];

export const DEMO_SOCIAL_POSTS = [
  U("photo-1441984904996-e0b6ba687e04", 800),
  U("photo-1445205170230-053b83016050", 800),
  U("photo-1469334031218-e382a71b716b", 800),
  U("photo-1485462537746-965f33f7f6a7", 800),
  U("photo-1509319117193-57bab727e09d", 800),
  U("photo-1490481651871-ab68de25d43d", 800),
];

export const DEMO_REVIEW_SNIPPETS = [
  { title: "Exactly as described", body: "Fit is true to size and the fabric is genuinely lovely. Would buy again." },
  { title: "Worth it", body: "Pricey but you can feel where the money went. Washed twice already with no change." },
  { title: "Great everyday piece", body: "Has become the thing I reach for first. Colour is spot on to the photos." },
  { title: "Good, with one note", body: "Really well made. Sleeves run slightly long on me but the tailor sorted it in a day." },
  { title: "Beautiful finish", body: "The seams and buttons are a cut above what I expected at this price." },
];
