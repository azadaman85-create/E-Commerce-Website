import type {
  Address,
  Brand,
  Category,
  Collection,
  Coupon,
  Customer,
  InventoryLog,
  Order,
  OrderItem,
  OrderStatus,
  PageContent,
  Product,
  ProductVariant,
  Promotion,
  Review,
  Tag,
} from '../types'

function img(seed: string) {
  return `https://picsum.photos/seed/${seed}/480/600`
}

export const CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Dresses', slug: 'dresses', productCount: 3 },
  { id: 'cat-1-1', name: 'Midi Dresses', slug: 'midi-dresses', parentId: 'cat-1', productCount: 0 },
  { id: 'cat-1-2', name: 'Slip Dresses', slug: 'slip-dresses', parentId: 'cat-1', productCount: 0 },
  { id: 'cat-2', name: 'Shirts', slug: 'shirts', productCount: 3 },
  { id: 'cat-2-1', name: 'Casual Shirts', slug: 'casual-shirts', parentId: 'cat-2', productCount: 0 },
  { id: 'cat-3', name: 'Outerwear', slug: 'outerwear', productCount: 2 },
  { id: 'cat-3-1', name: 'Jackets', slug: 'jackets', parentId: 'cat-3', productCount: 0 },
  { id: 'cat-4', name: 'Bottoms', slug: 'bottoms', productCount: 2 },
  { id: 'cat-5', name: 'Accessories', slug: 'accessories', productCount: 2 },
]

export const BRANDS: Brand[] = [
  { id: 'brand-1', name: 'MI TRENDS', slug: 'mi-trends', productCount: 10 },
  { id: 'brand-2', name: 'MI TRENDS Atelier', slug: 'mi-trends-atelier', productCount: 1 },
  { id: 'brand-3', name: 'MI TRENDS Basics', slug: 'mi-trends-basics', productCount: 1 },
]

export const COLLECTIONS: Collection[] = [
  { id: 'col-1', name: 'Autumn Editorial', slug: 'autumn-editorial', productCount: 5 },
  { id: 'col-2', name: 'Boutique Essentials', slug: 'boutique-essentials', productCount: 4 },
  { id: 'col-3', name: 'Limited Drop', slug: 'limited-drop', productCount: 3 },
]

export const TAGS: Tag[] = [
  { id: 'tag-1', name: 'new-arrival' },
  { id: 'tag-2', name: 'bestseller' },
  { id: 'tag-3', name: 'linen' },
  { id: 'tag-4', name: 'handwoven' },
  { id: 'tag-5', name: 'sustainable' },
]

const SIZES = ['XS', 'S', 'M', 'L', 'XL']
const COLORS = ['Ink Black', 'Bone', 'Clay', 'Sage', 'Burgundy']

function makeVariants(productId: string, count: number): ProductVariant[] {
  const variants: ProductVariant[] = []
  for (let i = 0; i < count; i++) {
    const size = SIZES[i % SIZES.length]
    const color = COLORS[Math.floor(i / SIZES.length) % COLORS.length]
    const stock = [0, 3, 8, 14, 22, 40][i % 6]
    variants.push({
      id: `${productId}-v${i}`,
      productId,
      size,
      color,
      sku: `${productId.toUpperCase()}-${size}-${color.slice(0, 2).toUpperCase()}`,
      stock,
      reserved: Math.min(stock, i % 3),
      threshold: 10,
    })
  }
  return variants
}

interface ProductSeed {
  id: string
  name: string
  categoryId: string
  collectionIds: string[]
  brand: string
  price: number
  salePrice?: number
  status: Product['status']
  rating: number
  reviewCount: number
  createdAt: string
  tags: string[]
  variantCount: number
}

const PRODUCT_SEEDS: ProductSeed[] = [
  { id: 'p-01', name: 'Bias-Cut Slip Dress', categoryId: 'cat-1', collectionIds: ['col-1'], brand: 'MI TRENDS', price: 4200, salePrice: 3360, status: 'active', rating: 4.6, reviewCount: 38, createdAt: '2026-08-02', tags: ['tag-1', 'tag-2'], variantCount: 10 },
  { id: 'p-02', name: 'Wrap Midi Dress', categoryId: 'cat-1', collectionIds: ['col-1', 'col-2'], brand: 'MI TRENDS', price: 3800, status: 'active', rating: 4.3, reviewCount: 21, createdAt: '2026-07-18', tags: ['tag-3'], variantCount: 8 },
  { id: 'p-03', name: 'Handloom Cotton Dress', categoryId: 'cat-1', collectionIds: ['col-3'], brand: 'MI TRENDS', price: 5200, status: 'draft', rating: 0, reviewCount: 0, createdAt: '2026-09-01', tags: ['tag-4', 'tag-5'], variantCount: 6 },
  { id: 'p-04', name: 'Oversized Linen Shirt', categoryId: 'cat-2', collectionIds: ['col-2'], brand: 'MI TRENDS', price: 2600, status: 'active', rating: 4.8, reviewCount: 54, createdAt: '2026-06-11', tags: ['tag-2', 'tag-3'], variantCount: 10 },
  { id: 'p-05', name: 'Tailored Poplin Shirt', categoryId: 'cat-2', collectionIds: ['col-2'], brand: 'MI TRENDS', price: 2200, salePrice: 1760, status: 'active', rating: 4.1, reviewCount: 12, createdAt: '2026-08-22', tags: [], variantCount: 8 },
  { id: 'p-06', name: 'Silk Blend Shirt', categoryId: 'cat-2', collectionIds: ['col-1'], brand: 'MI TRENDS', price: 3400, status: 'archived', rating: 3.9, reviewCount: 9, createdAt: '2026-03-14', tags: ['tag-5'], variantCount: 6 },
  { id: 'p-07', name: 'Wool Overcoat', categoryId: 'cat-3', collectionIds: ['col-1', 'col-3'], brand: 'MI TRENDS', price: 8600, status: 'active', rating: 4.7, reviewCount: 17, createdAt: '2026-07-30', tags: ['tag-2'], variantCount: 8 },
  { id: 'p-08', name: 'Quilted Field Jacket', categoryId: 'cat-3', collectionIds: ['col-2'], brand: 'MI TRENDS', price: 6200, salePrice: 4960, status: 'active', rating: 4.4, reviewCount: 26, createdAt: '2026-05-09', tags: ['tag-1'], variantCount: 8 },
  { id: 'p-09', name: 'High-Rise Wide Trouser', categoryId: 'cat-4', collectionIds: ['col-2'], brand: 'MI TRENDS', price: 3100, status: 'active', rating: 4.5, reviewCount: 31, createdAt: '2026-08-14', tags: ['tag-3'], variantCount: 10 },
  { id: 'p-10', name: 'Pleated Culottes', categoryId: 'cat-4', collectionIds: ['col-3'], brand: 'MI TRENDS', price: 2900, status: 'draft', rating: 0, reviewCount: 0, createdAt: '2026-09-05', tags: [], variantCount: 6 },
  { id: 'p-11', name: 'Woven Leather Belt', categoryId: 'cat-5', collectionIds: ['col-1'], brand: 'MI TRENDS', price: 1400, status: 'active', rating: 4.2, reviewCount: 8, createdAt: '2026-04-27', tags: ['tag-4'], variantCount: 4 },
  { id: 'p-12', name: 'Silk Scarf', categoryId: 'cat-5', collectionIds: ['col-3'], brand: 'MI TRENDS', price: 1100, salePrice: 880, status: 'active', rating: 4.9, reviewCount: 44, createdAt: '2026-06-30', tags: ['tag-2', 'tag-5'], variantCount: 4 },
]

export const PRODUCTS: Product[] = PRODUCT_SEEDS.map((seed) => ({
  id: seed.id,
  name: seed.name,
  slug: seed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  sku: `MIT-${seed.id.toUpperCase()}`,
  categoryId: seed.categoryId,
  collectionIds: seed.collectionIds,
  brand: seed.brand,
  price: seed.price,
  salePrice: seed.salePrice,
  description:
    'A considered piece cut from responsibly sourced fabric, designed for everyday wear with an editorial edge.',
  fabric: '100% organic cotton',
  care: 'Hand wash cold. Do not bleach. Line dry in shade.',
  fit: 'Relaxed fit — sizes up for an oversized look.',
  sizeGuide: 'Runs true to size. See size chart for exact measurements.',
  images: [img(`${seed.id}-a`), img(`${seed.id}-b`), img(`${seed.id}-c`)],
  status: seed.status,
  rating: seed.rating,
  reviewCount: seed.reviewCount,
  createdAt: seed.createdAt,
  tags: seed.tags,
  variants: makeVariants(seed.id, seed.variantCount),
}))

export const INVENTORY_LOGS: InventoryLog[] = [
  { id: 'log-1', variantId: 'p-01-v0', productName: 'Bias-Cut Slip Dress', variantLabel: 'XS / Ink Black', change: 20, reason: 'Initial stock intake', adjustedBy: 'Admin', date: '2026-08-02' },
  { id: 'log-2', variantId: 'p-04-v2', productName: 'Oversized Linen Shirt', variantLabel: 'M / Ink Black', change: -5, reason: 'Damaged in transit', adjustedBy: 'Product Manager', date: '2026-08-20' },
  { id: 'log-3', variantId: 'p-07-v1', productName: 'Wool Overcoat', variantLabel: 'S / Ink Black', change: 10, reason: 'Restock from supplier', adjustedBy: 'Product Manager', date: '2026-09-01' },
  { id: 'log-4', variantId: 'p-09-v3', productName: 'High-Rise Wide Trouser', variantLabel: 'L / Ink Black', change: -2, reason: 'Customer return, not resellable', adjustedBy: 'Admin', date: '2026-09-08' },
]

const FIRST_NAMES = ['Aanya', 'Vivaan', 'Diya', 'Kabir', 'Meera', 'Rohan', 'Ishita', 'Aditya', 'Sara', 'Aryan', 'Nisha', 'Farhan']
const LAST_NAMES = ['Sharma', 'Mehta', 'Kapoor', 'Rao', 'Bose', 'Nair', 'Iyer', 'Khan', 'Gupta', 'Verma', 'Reddy', 'Chatterjee']
const CITIES: { city: string; state: string }[] = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Jaipur', state: 'Rajasthan' },
]

function makeAddress(seed: number): Address {
  const place = CITIES[seed % CITIES.length]
  return {
    line1: `${12 + seed} Marine Lane`,
    line2: seed % 2 === 0 ? `Apt ${seed}B` : undefined,
    city: place.city,
    state: place.state,
    zip: `${400000 + seed * 7}`,
    country: 'India',
    phone: `+91 98${(10000000 + seed * 137).toString().slice(0, 8)}`,
  }
}

export const CUSTOMERS: Customer[] = Array.from({ length: 14 }).map((_, i) => {
  const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`
  const totalOrders = [0, 1, 2, 3, 5, 8][i % 6]
  return {
    id: `cust-${i + 1}`,
    name,
    email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
    phone: makeAddress(i).phone,
    joinedAt: `2026-0${(i % 8) + 1}-${(i % 27) + 1}`.replace(/-(\d)$/, '-0$1'),
    status: i % 9 === 0 ? 'inactive' : 'active',
    addresses: [makeAddress(i)],
    totalOrders,
    totalSpent: totalOrders * (1800 + i * 220),
  }
})

const ORDER_STATUSES: OrderStatus[] = [
  'new', 'confirmed', 'packing', 'ready', 'shipped', 'out_for_delivery', 'delivered', 'delivered', 'cancelled', 'returned', 'refunded',
]

function makeOrderItems(seed: number): OrderItem[] {
  const count = (seed % 3) + 1
  const items: OrderItem[] = []
  for (let i = 0; i < count; i++) {
    const product = PRODUCTS[(seed + i) % PRODUCTS.length]
    const variant = product.variants[(seed + i) % product.variants.length]
    items.push({
      id: `${product.id}-item-${i}`,
      productId: product.id,
      productName: product.name,
      image: product.images[0],
      size: variant.size,
      color: variant.color,
      qty: (i % 2) + 1,
      price: product.salePrice ?? product.price,
    })
  }
  return items
}

export const ORDERS: Order[] = Array.from({ length: 24 }).map((_, i) => {
  const items = makeOrderItems(i)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const shipping = subtotal > 3000 ? 0 : 150
  const discount = i % 5 === 0 ? Math.round(subtotal * 0.1) : 0
  const customer = CUSTOMERS[i % CUSTOMERS.length]
  const address = makeAddress(i)
  const status = ORDER_STATUSES[i % ORDER_STATUSES.length]
  return {
    id: `ord-${i + 1}`,
    orderNumber: `MIT-${10042 + i}`,
    customerId: customer.id,
    customerName: customer.name,
    items,
    subtotal,
    shipping,
    discount,
    total: subtotal + shipping - discount,
    status,
    paymentStatus:
      status === 'refunded' ? 'refunded' : status === 'cancelled' ? 'failed' : 'paid',
    paymentMethod: i % 3 === 0 ? 'UPI' : i % 3 === 1 ? 'Card' : 'Razorpay Wallet',
    shippingAddress: address,
    billingAddress: address,
    createdAt: `2026-09-${((i % 11) + 1).toString().padStart(2, '0')}`,
  }
})

export const REVIEWS: Review[] = Array.from({ length: 12 }).map((_, i) => {
  const product = PRODUCTS[i % PRODUCTS.length]
  const customer = CUSTOMERS[(i + 3) % CUSTOMERS.length]
  return {
    id: `rev-${i + 1}`,
    productId: product.id,
    productName: product.name,
    customerId: customer.id,
    customerName: customer.name,
    rating: [5, 4, 5, 3, 4, 2, 5][i % 7],
    comment:
      i % 3 === 0
        ? 'Fabric feels premium and the fit is exactly as described. Will buy again.'
        : i % 3 === 1
          ? 'Good quality but sizing ran a little large for me.'
          : 'Loved the color in person, arrived earlier than expected.',
    status: i % 4 === 0 ? 'pending' : i % 4 === 1 ? 'rejected' : 'approved',
    createdAt: `2026-08-${((i % 27) + 1).toString().padStart(2, '0')}`,
  }
})

export const COUPONS: Coupon[] = [
  { id: 'coup-1', code: 'WELCOME10', type: 'percentage', value: 10, minOrder: 1500, usageLimit: 500, usedCount: 214, startDate: '2026-07-01', endDate: '2026-12-31', status: 'active' },
  { id: 'coup-2', code: 'FLAT500', type: 'fixed', value: 500, minOrder: 3000, usageLimit: 200, usedCount: 88, startDate: '2026-08-01', endDate: '2026-09-30', status: 'active' },
  { id: 'coup-3', code: 'FESTIVE25', type: 'percentage', value: 25, minOrder: 4000, usageLimit: 300, usedCount: 0, startDate: '2026-10-01', endDate: '2026-10-15', status: 'scheduled' },
  { id: 'coup-4', code: 'SUMMER15', type: 'percentage', value: 15, minOrder: 2000, usageLimit: 400, usedCount: 400, startDate: '2026-04-01', endDate: '2026-06-30', status: 'expired' },
]

export const PROMOTIONS: Promotion[] = [
  { id: 'promo-1', title: 'Autumn Editorial Launch', bannerImage: img('promo-1'), linkUrl: '/collections/autumn-editorial', startDate: '2026-09-01', endDate: '2026-09-30', status: 'active' },
  { id: 'promo-2', title: 'Festive Season Sale', bannerImage: img('promo-2'), linkUrl: '/sale', startDate: '2026-10-01', endDate: '2026-10-20', status: 'scheduled' },
  { id: 'promo-3', title: 'Monsoon Clearance', bannerImage: img('promo-3'), linkUrl: '/clearance', startDate: '2026-06-01', endDate: '2026-07-15', status: 'ended' },
]

export const PAGE_CONTENT: PageContent = {
  hero: {
    headline: 'Cut for the way you move',
    subheadline: 'The Autumn Editorial collection — considered fabric, quiet color.',
    image: img('hero-main'),
    ctaLabel: 'Shop the collection',
    ctaUrl: '/collections/autumn-editorial',
  },
  banners: PROMOTIONS,
  featuredProductIds: ['p-01', 'p-04', 'p-07', 'p-12'],
  announcement: {
    enabled: true,
    text: 'Complimentary shipping on orders over ₹3,000 — ends this week.',
  },
}
