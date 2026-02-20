export type ProductCategory =
  | "Skincare"
  | "Maquiagem"
  | "Bem-estar"
  | "Cabelos"
  | "Acessórios"
  | "Corpo";

export type ProductStatus = "draft" | "review" | "published" | "paused";

export type ProductImageTone = "rose" | "noir" | "blush" | "plum";

export type ProductCurationFields = {
  brand?: string | null;
  currency?: string | null;
  badges?: string[] | null;
  ritual?: string | null;
  texture?: string | null;
  sensation?: string[] | null;
  result?: string[] | null;
};

export type Product = ProductCurationFields & {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
  description: string;
  images: string[];
  status: ProductStatus;
  createdAt: string;
  updatedAt?: string;
  sellerId: string;
  weightKg?: number;
  widthCm?: number;
  heightCm?: number;
  lengthCm?: number;
  highlights?: string[];
  imageTone?: ProductImageTone;
  featured?: boolean;
  stockQuantity?: number;
  curated?: boolean;
  curationFeedback?: string;
  imageUrls?: string[];
};

// Public catalog shape used by App Router pages and Supabase queries.
export type PublicProduct = ProductCurationFields & {
  id: string;
  slug: string;
  title: string;
  price_cents: number;
  hero_image_url?: string | null;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  category?: string | null;
  excerpt?: string | null;
  cover_image_url?: string | null;
  content_md?: string | null;
  reading_time_minutes?: number | null;
  related_product_slugs?: string[] | null;
  status?: "published" | "draft" | null;
  published_at?: string | null;
};

export type Seller = {
  id: string;
  name: string;
  bio: string;
  specialty: string;
  postalCode: string;
  imageTone: ProductImageTone;
  stripeAccountId?: string;
  commissionRate?: number;
};

export type SellerStore = {
  id: string;
  userId: string;
  storeName: string;
  category?: string;
  postalCode?: string;
  whatsapp?: string;
  instagram?: string;
  status?: SellerStatus;
  stripeAccountId?: string;
  commissionRate?: number;
  createdAt?: string;
  owner?: {
    id: string;
    email?: string;
    fullName?: string;
  };
};

export type DiaryStatus = "draft" | "published";

export type DiaryPost = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  coverImage: string;
  content: string;
  category: "Rotina" | "Autocuidado" | "Pele" | "Bem-estar";
  tags: string[];
  status: DiaryStatus;
  excerpt: string;
  updatedAt: string;
};

export type CartItem = {
  productId: string;
  sellerId: string;
  quantity: number;
};

export type ShippingQuoteItem = {
  id: string;
  quantity: number;
  weightKg: number;
  widthCm: number;
  heightCm: number;
  lengthCm: number;
  price: number;
};

export type ShippingCartItem = {
  productId: string;
  sellerId: string;
  quantity: number;
  weightKg: number;
  widthCm: number;
  heightCm: number;
  lengthCm: number;
  price: number;
};

export type ShippingOption = {
  serviceName: string;
  price: number;
  deliveryTimeDays: number;
  carrier: string;
  serviceId: string;
};

export type SellerShipment = ShippingOption & {
  sellerId: string;
  sellerName: string;
  originCep: string;
  destinationCep: string;
};

export type UserRole = "customer" | "seller" | "admin";

export type SellerStatus =
  | "draft"
  | "pending"
  | "approved"
  | "active"
  | "paused"
  | "rejected";

export type PartnerApplicationStatus = "pending" | "approved" | "rejected";

export type PartnerApplication = {
  id: string;
  userId: string;
  brandName: string;
  cnpj?: string | null;
  contactName: string;
  phone?: string | null;
  instagram?: string | null;
  catalogLink?: string | null;
  status: PartnerApplicationStatus;
  notesAdmin?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type SellerProfile = {
  sellerId?: string;
  storeName: string;
  responsibleName: string;
  contact: string;
  mainCategory: string;
  postalCode?: string;
  status?: SellerStatus;
  stripeAccountId?: string;
  commissionRate?: number;
  bio?: string;
  specialty?: string;
  imageTone?: ProductImageTone;
};

export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  sellerProfile?: SellerProfile;
  createdAt?: string;
};

export type Address = {
  fullName: string;
  street: string;
  number: string;
  city: string;
  state: string;
  zip: string;
  complement?: string;
};

export type PaymentStatus = "pending" | "paid";

export type Order = {
  id: string;
  customerId: string;
  totalProducts: number;
  totalShipping: number;
  totalOrder: number;
  status: "Confirmado" | "Em separação" | "Enviado";
  createdAt: string;
  paymentMethod: "cartao" | "pix" | "boleto";
  address: Address;
  destinationCep: string;
  paymentIntentId?: string;
  totalAmount?: number;
  paymentStatus?: PaymentStatus;
};

export type SubOrder = {
  id: string;
  orderId: string;
  sellerId: string;
  items: CartItem[];
  shippingValue: number;
  shippingService: string;
  status: "Confirmado" | "Em separação" | "Enviado";
  createdAt: string;
  productTotal?: number;
  shippingTotal?: number;
  platformFee?: number;
  sellerNetAmount?: number;
  paymentStatus?: PaymentStatus;
};

export type NotificationRecord = {
  id: string;
  type: string;
  title: string;
  body: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
};
