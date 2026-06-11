export { CartService } from '@core/services/cart.service';
export type { CartItem, AddToCartInput, OrderItemPayload } from '@core/services/cart.service';

// CouponResponse se mantiene exportado para compatibilidad con cualquier referencia existente
export interface CouponResponse {
  code: string;
  discountPercentage: number;
  discountAmount: number;
  subtotal: number;
  tax: number;
  discountedTotal: number;
  message?: string;
}
