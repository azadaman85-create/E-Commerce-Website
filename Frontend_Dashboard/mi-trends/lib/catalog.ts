import type { Product, ProductColor } from "@/lib/types";

export type Collection = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  motif: string;
  palette: [string, string, string];
  colors: [ProductColor, ProductColor, ProductColor];
};

export type Category = {
  name: string;
  slug: "men" | "women" | "unisex";
  description: string;
};

export const collections: Collection[] = [
  {
    name: "Midnight Metro",
    slug: "midnight-metro",
    tagline: "Made for the last train home.",
    description: "After-dark layers, electric signs and the pulse of a city that never clocks out.",
    motif: "Transit lines",
    palette: ["#111827", "#ff4d5a", "#c7ff4a"],
    colors: [
      { name: "Platform Black", hex: "#15171c" },
      { name: "Signal Red", hex: "#d9364f" },
      { name: "Night Lime", hex: "#b9db45" },
    ],
  },
  {
    name: "Desi Frequency",
    slug: "desi-frequency",
    tagline: "Turn the neighbourhood all the way up.",
    description: "Bold local rhythm translated into warm colour, playful type and all-day comfort.",
    motif: "Sound waves",
    palette: ["#17324d", "#ff633f", "#ffd166"],
    colors: [
      { name: "Radio Navy", hex: "#17324d" },
      { name: "Mirchi Orange", hex: "#e95a38" },
      { name: "Dhoop Yellow", hex: "#e8bd4d" },
    ],
  },
  {
    name: "Cosmic Picnic",
    slug: "cosmic-picnic",
    tagline: "Pack snacks. Leave orbit.",
    description: "Soft space-age colour and optimistic graphics for gloriously unplanned days.",
    motif: "Orbit rings",
    palette: ["#38204f", "#ff79ad", "#76e8d4"],
    colors: [
      { name: "Deep Space", hex: "#332046" },
      { name: "Moon Candy", hex: "#dc76a0" },
      { name: "Comet Mint", hex: "#71cbbb" },
    ],
  },
  {
    name: "Monsoon Club",
    slug: "monsoon-club",
    tagline: "Good weather is a state of mind.",
    description: "Earthy essentials inspired by wet streets, fresh leaves and long chai breaks.",
    motif: "Rain ripples",
    palette: ["#153f34", "#8eb69b", "#f4dfb4"],
    colors: [
      { name: "Forest Rain", hex: "#23493e" },
      { name: "Moss Green", hex: "#789a80" },
      { name: "Chai Foam", hex: "#dfcfad" },
    ],
  },
  {
    name: "Analog Arcade",
    slug: "analog-arcade",
    tagline: "Insert coin. Ignore the high score.",
    description: "Pixel energy, saturated neons and throwback graphics without borrowed characters.",
    motif: "Pixel grid",
    palette: ["#202124", "#f72585", "#3ec5e8"],
    colors: [
      { name: "High Score Black", hex: "#202124" },
      { name: "Power Pink", hex: "#d8297c" },
      { name: "Player Blue", hex: "#39aeca" },
    ],
  },
  {
    name: "Sunday Service",
    slug: "sunday-service",
    tagline: "Nothing urgent. Everything considered.",
    description: "Sun-washed staples designed for slow mornings, second coffees and nowhere to be.",
    motif: "Rising sun",
    palette: ["#7a3028", "#ef9858", "#fff0d2"],
    colors: [
      { name: "Brick Tea", hex: "#7a392f" },
      { name: "Marmalade", hex: "#d9864f" },
      { name: "Oat Milk", hex: "#e8ddc5" },
    ],
  },
  {
    name: "After Hours Athletics",
    slug: "after-hours-athletics",
    tagline: "Off duty is still a team sport.",
    description: "Collegiate proportions and court-side graphics reworked for everyday movement.",
    motif: "Court marks",
    palette: ["#102a43", "#f2c94c", "#e8f1f2"],
    colors: [
      { name: "Varsity Navy", hex: "#17324c" },
      { name: "Trophy Gold", hex: "#d8ae36" },
      { name: "Chalk White", hex: "#e6e9e7" },
    ],
  },
  {
    name: "Studio 99",
    slug: "studio-99",
    tagline: "Originals, numbered and remixed.",
    description: "Graphic experiments from the MI TRENDS studio, built around shape, type and colour.",
    motif: "Edition stamps",
    palette: ["#3d2c8d", "#ff5da2", "#f7f2e8"],
    colors: [
      { name: "Edition Violet", hex: "#49378f" },
      { name: "Studio Pink", hex: "#dc5591" },
      { name: "Gallery Cream", hex: "#e7e0d4" },
    ],
  },
];

export const categories: Category[] = [
  { name: "Men", slug: "men", description: "Relaxed layers, everyday graphics and easy fits." },
  { name: "Women", slug: "women", description: "Expressive silhouettes designed for comfort and movement." },
  { name: "Unisex", slug: "unisex", description: "No-rule staples made to be worn your way." },
];

const TOP_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const BOTTOM_SIZES = ["28", "30", "32", "34", "36", "38"];
const SHOE_SIZES = ["UK6", "UK7", "UK8", "UK9", "UK10", "UK11"];
const FREE_SIZE = ["Free size"];

type ProductBlueprint = {
  type: string;
  label: string;
  mrp: number;
  sizes: string[];
  fit: string;
  fabric: string;
  fixedCategory?: Product["category"];
};

const blueprints: ProductBlueprint[] = [
  {
    type: "Oversized T-shirt",
    label: "Oversized Tee",
    mrp: 1499,
    sizes: TOP_SIZES,
    fit: "Drop-shoulder oversized fit",
    fabric: "240 GSM combed cotton jersey",
  },
  {
    type: "Graphic T-shirt",
    label: "Graphic Tee",
    mrp: 1199,
    sizes: TOP_SIZES,
    fit: "Relaxed everyday fit",
    fabric: "200 GSM combed cotton jersey",
  },
  {
    type: "Shirt",
    label: "Camp Collar Shirt",
    mrp: 1799,
    sizes: TOP_SIZES,
    fit: "Easy camp-collar fit",
    fabric: "Breathable cotton-viscose twill",
  },
  {
    type: "Hoodie",
    label: "Heavyweight Hoodie",
    mrp: 2699,
    sizes: TOP_SIZES,
    fit: "Roomy unisex fit",
    fabric: "360 GSM brushed cotton fleece",
    fixedCategory: "unisex",
  },
  {
    type: "Sweatshirt",
    label: "Crew Sweatshirt",
    mrp: 2199,
    sizes: TOP_SIZES,
    fit: "Relaxed rib-trim fit",
    fabric: "320 GSM loopback cotton",
    fixedCategory: "unisex",
  },
  {
    type: "Joggers",
    label: "Everyday Joggers",
    mrp: 1899,
    sizes: BOTTOM_SIZES,
    fit: "Tapered comfort fit",
    fabric: "300 GSM cotton-rich French terry",
  },
  {
    type: "Shorts",
    label: "Utility Shorts",
    mrp: 1399,
    sizes: BOTTOM_SIZES,
    fit: "Relaxed above-knee fit",
    fabric: "Durable cotton twill",
  },
  {
    type: "Boxers",
    label: "Lounge Boxers",
    mrp: 899,
    sizes: TOP_SIZES,
    fit: "Comfort fit with soft elastic waist",
    fabric: "Lightweight cotton poplin",
    fixedCategory: "men",
  },
  {
    type: "Dress",
    label: "T-shirt Dress",
    mrp: 1999,
    sizes: TOP_SIZES,
    fit: "Easy straight fit",
    fabric: "220 GSM combed cotton jersey",
    fixedCategory: "women",
  },
  {
    type: "Co-ord Set",
    label: "Weekend Co-ord",
    mrp: 2799,
    sizes: TOP_SIZES,
    fit: "Relaxed two-piece fit",
    fabric: "Soft cotton-rich interlock",
  },
  {
    type: "Sneakers",
    label: "Low-top Sneakers",
    mrp: 3299,
    sizes: SHOE_SIZES,
    fit: "Regular fit; size up for a roomier feel",
    fabric: "Canvas upper with cushioned rubber sole",
    fixedCategory: "unisex",
  },
  {
    type: "Backpack",
    label: "Daytrip Backpack",
    mrp: 1899,
    sizes: FREE_SIZE,
    fit: "18-litre everyday carry",
    fabric: "Water-resistant recycled polyester",
    fixedCategory: "unisex",
  },
  {
    type: "Cap",
    label: "Five-panel Cap",
    mrp: 899,
    sizes: FREE_SIZE,
    fit: "Adjustable back strap",
    fabric: "Washed cotton canvas",
    fixedCategory: "unisex",
  },
  {
    type: "Socks",
    label: "Crew Socks",
    mrp: 499,
    sizes: FREE_SIZE,
    fit: "Stretch crew length",
    fabric: "Breathable cotton blend",
    fixedCategory: "unisex",
  },
  {
    type: "Phone Case",
    label: "Impact Phone Case",
    mrp: 699,
    sizes: FREE_SIZE,
    fit: "Universal showcase size",
    fabric: "Shock-absorbing TPU shell",
    fixedCategory: "unisex",
  },
  {
    type: "Bottle",
    label: "Steel Bottle",
    mrp: 799,
    sizes: FREE_SIZE,
    fit: "750 ml capacity",
    fabric: "Food-grade double-wall stainless steel",
    fixedCategory: "unisex",
  },
];

const editions = [
  "Night Shift",
  "City Loop",
  "Side B",
  "Easy Signal",
  "Dream State",
  "Open Late",
  "Local Hero",
  "Good Energy",
  "Daily Remix",
];

const categoryCycle: Product["category"][] = ["men", "women", "unisex"];
const discountBands = [10, 15, 20, 25, 30, 35, 40];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function priceAfterDiscount(mrp: number, discount: number) {
  return Math.round((mrp * (100 - discount)) / 100 / 10) * 10;
}

const blueprintPhotos: Record<string, { front: string[]; back?: string[] }> = {
  "Oversized T-shirt": {
    front: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80",
    ],
    back: [
      "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "Graphic T-shirt": {
    front: [
      "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1527719327859-c6ce80353573?w=800&auto=format&fit=crop&q=80",
    ],
    back: [
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "Shirt": {
    front: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=800&auto=format&fit=crop&q=80",
    ],
    back: [
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "Hoodie": {
    front: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1578768079052-aa76e520028b?w=800&auto=format&fit=crop&q=80",
    ],
    back: [
      "https://images.unsplash.com/photo-1578768079052-aa76e520028b?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "Sweatshirt": {
    front: [
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80",
    ],
    back: [
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "Joggers": {
    front: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80",
    ],
    back: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "Shorts": {
    front: [
      "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&auto=format&fit=crop&q=80",
    ],
    back: [
      "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "Sneakers": {
    front: [
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80",
    ],
    back: [
      "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "Backpack": {
    front: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "Cap": {
    front: [
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "Socks": {
    front: [
      "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "Phone Case": {
    front: [
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "Bottle": {
    front: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "Dress": {
    front: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "Co-ord Set": {
    front: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80",
    ],
  },
  "Boxers": {
    front: [
      "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&auto=format&fit=crop&q=80",
    ],
  },
};

function resolveProductImages(type: string, collectionIndex: number, slot: number) {
  const photos = blueprintPhotos[type] || blueprintPhotos["Graphic T-shirt"];
  const frontList = photos.front;
  const frontUrl = frontList[(collectionIndex + slot) % frontList.length];
  const backList = photos.back || frontList;
  const backUrl = backList[((collectionIndex + slot) + 1) % backList.length];
  return { frontUrl, backUrl };
}

function buildProduct(collection: Collection, collectionIndex: number, slot: number): Product {
  const blueprintIndex = (collectionIndex * 2 + slot) % blueprints.length;
  const blueprint = blueprints[blueprintIndex];
  const id = 1001 + collectionIndex * editions.length + slot;
  const name = `${editions[slot]} ${blueprint.label}`;
  const mrp = blueprint.mrp + ((collectionIndex + slot) % 3) * 100;
  const discount = discountBands[(collectionIndex * 3 + slot) % discountBands.length];
  const tags: Product["tags"] = [];

  if (slot <= 1 || (collectionIndex + slot) % 7 === 0) tags.push("new");
  if ((collectionIndex * 2 + slot) % 5 === 0) tags.push("bestseller");
  if (discount >= 30) tags.push("sale");

  const category =
    blueprint.fixedCategory ?? categoryCycle[(collectionIndex + slot) % categoryCycle.length];
  const outOfStock =
    blueprint.sizes.length > 1
      ? blueprint.sizes.filter((_, sizeIndex) => (sizeIndex + id) % 5 === 0)
      : [];
  const colors = [
    collection.colors[slot % collection.colors.length],
    collection.colors[(slot + 1) % collection.colors.length],
    collection.colors[(slot + 2) % collection.colors.length],
  ].map((color) => ({ ...color }));

  const { frontUrl, backUrl } = resolveProductImages(blueprint.type, collectionIndex, slot);

  return {
    id,
    slug: `${collection.slug}-${slugify(name)}`,
    name,
    collection: collection.name,
    collectionSlug: collection.slug,
    type: blueprint.type,
    category,
    colors,
    sizes: [...blueprint.sizes],
    outOfStock,
    mrp,
    price: priceAfterDiscount(mrp, discount),
    discount,
    rating: Number((4 + ((id * 7) % 10) / 10).toFixed(1)),
    reviewCount: 38 + ((id * 47) % 1260),
    tags,
    popularity: 1000 - collectionIndex * 31 - slot * 7 + ((id * 13) % 29),
    fit: blueprint.fit,
    fabric: blueprint.fabric,
    sku: `MIT-${String(collectionIndex + 1).padStart(2, "0")}-${String(
      blueprintIndex + 1,
    ).padStart(2, "0")}-${String(slot + 1).padStart(2, "0")}`,
    art: `${collection.motif} · Edition ${String(slot + 1).padStart(2, "0")}`,
    palette: [...collection.palette],
    imageUrl: frontUrl,
    backImageUrl: backUrl,
  };
}

/** A stable, locally generated catalogue: 8 collections × 9 products = 72 products. */
export const products: Product[] = collections.flatMap((collection, collectionIndex) =>
  editions.map((_, slot) => buildProduct(collection, collectionIndex, slot)),
);

export const catalog = products;
export const productTypes = Array.from(new Set(products.map((product) => product.type))).sort();

export const newArrivals = products
  .filter((product) => product.tags.includes("new"))
  .sort((a, b) => b.id - a.id);

export const bestsellers = products
  .filter((product) => product.tags.includes("bestseller"))
  .sort((a, b) => b.popularity - a.popularity);

export const dealsUnder799 = products
  .filter((product) => product.price <= 799)
  .sort((a, b) => b.discount - a.discount);

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export const getProductBySlug = getProduct;

export function getProductById(id: number | string) {
  const numericId = typeof id === "string" ? Number(id) : id;
  return products.find((product) => product.id === numericId);
}

export function getProductsByCollection(slug: string) {
  return products.filter((product) => product.collectionSlug === slug);
}

export function getProductsByCategory(category: Product["category"]) {
  return products.filter(
    (product) => product.category === category || product.category === "unisex",
  );
}

export function searchProducts(query: string) {
  const terms = query
    .trim()
    .toLocaleLowerCase("en-IN")
    .split(/\s+/)
    .filter(Boolean);

  if (!terms.length) return [];

  return products.filter((product) => {
    const haystack = [
      product.name,
      product.collection,
      product.type,
      product.category,
      product.tags.join(" "),
      product.art,
    ]
      .join(" ")
      .toLocaleLowerCase("en-IN");

    return terms.every((term) => haystack.includes(term));
  });
}
