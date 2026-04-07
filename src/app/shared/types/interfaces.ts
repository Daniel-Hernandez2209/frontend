// User interfaces
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

// Product interfaces
export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: ProductImage[];
  category: string;
  subcategory?: string;
  sizes: ProductSize[];
  colors: ProductColor[];
  sku: string;
  tags: string[];
  material?: string;
  isActive: boolean;
  isFeatured: boolean;
  views: number;
  sales: number;
  rating: { average: number; count: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface ProductSize {
  size: string;
  stock: number;
}

export interface ProductColor {
  name: string;
  hex: string;
  image?: string;
}

// Order interfaces
export interface Order {
  _id: string;
  user?: string;
  guestInfo?: { email: string; firstName: string; lastName: string; phone: string };
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  payment: PaymentInfo;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  statusHistory: StatusHistoryEntry[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  product: string;
  productSnapshot: { name: string; images: string[]; category: string; sku: string };
  size: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  department: string;
  zipCode: string;
  country: string;
}

export interface PaymentInfo {
  method: 'pse' | 'cash_on_delivery' | 'bank_transfer';
  status: 'pending' | 'confirmed' | 'failed';
  transactionId?: string;
  paymentId?: string;
}

export interface StatusHistoryEntry {
  status: string;
  timestamp: Date;
  notes?: string;
}

// Category interfaces
export interface Category {
  _id: string;
  slug: string;
  name: string;
  description: string;
  image?: string;
  subcategories: Subcategory[];
  isActive: boolean;
  order: number;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Subcategory {
  name: string;
  slug: string;
  description: string;
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
  errorId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
