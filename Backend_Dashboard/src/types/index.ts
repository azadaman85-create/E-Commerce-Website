export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'product_manager'
  | 'order_manager'
  | 'content_manager'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: AdminRole
  avatarInitial: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parentId?: string
  productCount: number
}

export interface Collection {
  id: string
  name: string
  slug: string
  productCount: number
}

export interface Brand {
  id: string
  name: string
  slug: string
  productCount: number
}

export interface Tag {
  id: string
  name: string
}

export type AttributeType = 'size' | 'color' | 'fabric' | 'fit' | 'gender'

export interface AttributeOption {
  id: string
  type: AttributeType
  value: string
}

export type ProductStatus = 'active' | 'draft' | 'archived'

export interface ProductVariant {
  id: string
  productId: string
  size: string
  color: string
  sku: string
  stock: number
  reserved: number
  threshold: number
}

export interface InventoryLog {
  id: string
  variantId: string
  productName: string
  variantLabel: string
  change: number
  reason: string
  adjustedBy: string
  date: string
}

export interface Product {
  id: string
  name: string
  slug: string
  sku: string
  categoryId: string
  collectionIds: string[]
  brand: string
  price: number
  salePrice?: number
  description: string
  fabric: string
  care: string
  fit: string
  sizeGuide: string
  images: string[]
  status: ProductStatus
  rating: number
  reviewCount: number
  createdAt: string
  tags: string[]
  variants: ProductVariant[]
}

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'packing'
  | 'ready'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded'

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded'

export interface OrderItem {
  id: string
  productId: string
  productName: string
  image: string
  size: string
  color: string
  qty: number
  price: number
}

export interface Address {
  line1: string
  line2?: string
  city: string
  state: string
  zip: string
  country: string
  phone: string
}

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  discount: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: string
  shippingAddress: Address
  billingAddress: Address
  createdAt: string
}

export interface Review {
  id: string
  productId: string
  productName: string
  customerId: string
  customerName: string
  rating: number
  comment: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface WishlistItem {
  productId: string
  productName: string
  image: string
  price: number
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  joinedAt: string
  status: 'active' | 'inactive'
  addresses: Address[]
  totalOrders: number
  totalSpent: number
}

export type CouponType = 'percentage' | 'fixed'

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  minOrder: number
  usageLimit: number
  usedCount: number
  startDate: string
  endDate: string
  status: 'active' | 'scheduled' | 'expired'
}

export interface Promotion {
  id: string
  title: string
  bannerImage: string
  linkUrl: string
  startDate: string
  endDate: string
  status: 'active' | 'scheduled' | 'ended'
}

export interface PageContent {
  hero: {
    headline: string
    subheadline: string
    image: string
    ctaLabel: string
    ctaUrl: string
  }
  banners: Promotion[]
  featuredProductIds: string[]
  announcement: {
    enabled: boolean
    text: string
  }
}
