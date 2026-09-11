export type UserRole = "customer" | "admin";
export type ProductStatus = "draft" | "active";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type FulfillmentStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
export type CouponType = "percentage" | "fixed";
export type ReturnStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "received"
  | "refunded";
/** Which section of the store a product belongs to. */
export type Gender = "men" | "women" | "unisex";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  site_name: string;
  tagline: string | null;
  logo_url: string | null;
  logo_inverted_url: string | null;
  favicon_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  business_address: string | null;
  currency_code: string;
  currency_symbol: string;
  tax_rate: number;
  tax_inclusive: boolean;
  announcement_bar_active: boolean;
  announcement_bar_text: string | null;
  announcement_bar_link: string | null;
  announcement_bar_color: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_twitter: string | null;
  social_tiktok: string | null;
  social_youtube: string | null;
  sale_active: boolean;
  sale_headline: string | null;
  sale_ends_at: string | null;
  updated_at: string;
}

export interface SeoSettings {
  id: string;
  meta_title_template: string;
  default_meta_description: string | null;
  og_default_image_url: string | null;
  ga_tracking_id: string | null;
  fb_pixel_id: string | null;
  search_console_meta: string | null;
  robots_txt: string | null;
  updated_at: string;
}

export interface PageSeo {
  id: string;
  page_slug: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  alt_text: string | null;
}

export interface ProductOptionValue {
  id: string;
  option_id: string;
  value: string;
  sort_order: number;
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  sort_order: number;
  product_option_values?: ProductOptionValue[];
}

export interface VariantOptionValue {
  option_name: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string | null;
  price: number | null;
  stock_quantity: number;
  option_values: VariantOptionValue[];
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  gender: Gender;
  price: number;
  sale_price: number | null;
  sale_start: string | null;
  sale_end: string | null;
  sku: string | null;
  stock_quantity: number;
  track_inventory: boolean;
  allow_backorders: boolean;
  status: ProductStatus;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  tags: string[] | null;
  units_sold: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWithRelations extends Product {
  categories?: Category | null;
  product_images?: ProductImage[];
  product_options?: ProductOption[];
  product_variants?: ProductVariant[];
  reviews?: Review[];
  avg_rating?: number;
  review_count?: number;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export type AddressInput = Omit<Address, "id" | "user_id" | "created_at">;

export interface OrderAddress {
  full_name: string;
  phone?: string | null;
  email?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  title: string;
  slug: string | null;
  image_url: string | null;
  variant_info: VariantOptionValue[] | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  shipping_address: OrderAddress;
  billing_address: OrderAddress | null;
  shipping_method: string | null;
  shipping_cost: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  coupon_code: string | null;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  tracking_number: string | null;
  tracking_carrier: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  order_timeline?: OrderTimelineEntry[];
}

export interface OrderTimelineEntry {
  id: string;
  order_id: string;
  status: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified: boolean;
  author_name: string | null;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order_amount: number;
  usage_limit: number | null;
  per_customer_limit: number | null;
  times_used: number;
  valid_from: string | null;
  valid_to: string | null;
  applicable_products: string[] | null;
  applicable_categories: string[] | null;
  is_active: boolean;
  created_at: string;
}

export interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

export interface HeroSlide {
  id: string;
  image_url: string;
  heading: string;
  subheading: string | null;
  cta_text: string | null;
  cta_link: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Banner {
  id: string;
  image_url: string | null;
  heading: string | null;
  text: string | null;
  link: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  estimated_delivery: string | null;
  free_shipping_threshold: number | null;
  sort_order: number;
  is_active: boolean;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  products?: ProductWithRelations;
}

export interface MediaAsset {
  id: string;
  url: string;
  filename: string;
  size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Testimonial {
  id: string;
  author_name: string;
  author_role: string | null;
  quote: string;
  rating: number;
  avatar_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface SocialPost {
  id: string;
  image_url: string;
  link: string | null;
  caption: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ReturnItem {
  order_item_id: string;
  title: string;
  variant_info: VariantOptionValue[] | null;
  quantity: number;
}

export interface ReturnRequest {
  id: string;
  order_id: string;
  user_id: string | null;
  order_number: string;
  email: string;
  reason: string;
  comment: string | null;
  items: ReturnItem[];
  refund_amount: number;
  status: ReturnStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

/** A line in the client-side cart. Persisted to localStorage. */
export interface CartItem {
  key: string;
  productId: string;
  variantId: string | null;
  slug: string;
  title: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
  variantInfo: VariantOptionValue[];
}

export interface AppliedCoupon {
  code: string;
  type: CouponType;
  value: number;
  discount: number;
}
