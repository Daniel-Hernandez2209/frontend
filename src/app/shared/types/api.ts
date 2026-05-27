// ============= AUTH =============
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface User {
  _id: string;
  name?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  isVerified?: boolean;
  isActive?: boolean;
  role?: 'user' | 'admin';
  email?: string;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
  message?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  message?: string;
}

// ============= PRODUCTS =============
export interface Product {
  _id: string;
  id?: string;
  title: string;
  slug?: string;
  description: string;
  price: number;
  discount?: number;
  images: string[];
  category: string;
  categoryName?: string;
  stock: number;
  tags?: string[];
  reviews?: Review[];
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCreateRequest {
  title: string;
  description: string;
  price: number;
  discount?: number;
  category: string;
  stock: number;
  images?: File[];
}

// ============= CATEGORIES =============
export interface Category {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt?: string;
}

// ============= ORDERS =============
export interface OrderItem {
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
  discount?: number;
}

export interface Order {
  _id: string;
  id?: string;
  userId: string;
  items: OrderItem[];
  total: number;
  discount?: number;
  shippingAddress: Address;
  billingAddress?: Address;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'stripe' | 'pse' | 'transfer';
  paymentStatus: 'pending' | 'completed' | 'failed';
  trackingNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderCreateRequest {
  items: {
    productId: string;
    quantity: number;
  }[];
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// ============= REVIEWS =============
export interface Review {
  _id?: string;
  userId: string;
  userName?: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

// ============= PAGINATED RESPONSES =============
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

// ============= CART =============
export interface CartItem {
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  discount?: number;
  subtotal: number;
}

// ============= ERROR RESPONSE =============
export interface ErrorResponse {
  message: string;
  statusCode: number;
  error?: any;
}
