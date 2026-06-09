import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="p-6 max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-4xl font-bold text-base-900">🛒 Shopping Cart</h1>
        <a routerLink="/store" class="btn btn-ghost">← Continue Shopping</a>
      </div>

      <!-- Error Alert -->
      @if (cartService.cartError()) {
        <div class="alert alert-error mb-6">
          <span>{{ cartService.cartError() }}</span>
          <button (click)="dismissError()" class="btn btn-sm btn-ghost">✕</button>
        </div>
      }

      <!-- Empty State -->
      @if (cartService.itemCount() === 0) {
        <div class="alert alert-info text-center py-12">
          <div class="text-lg">Your cart is empty</div>
          <div class="text-sm text-base-600 mt-2">
            Browse our products and add items to get started!
          </div>
          <a routerLink="/store" class="btn btn-primary mt-4">Start Shopping</a>
        </div>
      }

      <!-- Cart Content -->
      @if (cartService.itemCount() > 0) {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Items Section -->
          <div class="lg:col-span-2">
            <div class="card bg-base-100 shadow-sm overflow-hidden">
              <div class="overflow-x-auto">
                <table class="table w-full">
                  <thead class="bg-base-200">
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Subtotal</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of cartService.getItems(); track item.productId + item.size) {
                      <tr class="hover:bg-base-50 transition">
                        <!-- Product Info -->
                        <td>
                          <div class="flex items-center gap-4">
                            <div class="w-16 h-16 bg-base-300 rounded-lg flex-shrink-0">
                              @if (item.image) {
                                <img
                                  [src]="item.image"
                                  [alt]="item.productName"
                                  class="w-full h-full object-cover rounded-lg"
                                />
                              } @else {
                                <div
                                  class="w-full h-full flex items-center justify-center text-2xl"
                                >
                                  📦
                                </div>
                              }
                            </div>
                            <div>
                              <p class="font-medium text-base-900">
                                {{ item.productName }}
                              </p>
                              <p class="text-xs text-base-500 mt-1">SKU: {{ item.sku || 'N/A' }}</p>
                              @if (item.size) {
                                <p class="text-xs text-base-500">Size: {{ item.size }}</p>
                              }
                            </div>
                          </div>
                        </td>

                        <!-- Price -->
                        <td>
                          <span class="font-medium">{{ item.price | currency }}</span>
                        </td>

                        <!-- Quantity -->
                        <td>
                          <div class="flex items-center gap-2">
                            <button
                              (click)="decreaseQuantity(item)"
                              class="btn btn-sm btn-ghost"
                              [disabled]="item.quantity <= 1"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              [value]="item.quantity"
                              (change)="updateQuantity(item, $event)"
                              min="1"
                              class="input input-bordered input-sm w-16 text-center"
                            />
                            <button (click)="increaseQuantity(item)" class="btn btn-sm btn-ghost">
                              +
                            </button>
                          </div>
                        </td>

                        <!-- Subtotal -->
                        <td>
                          <span class="font-semibold">
                            {{ item.price * item.quantity | currency }}
                          </span>
                        </td>

                        <!-- Remove -->
                        <td>
                          <button
                            (click)="removeItem(item)"
                            class="btn btn-sm btn-error btn-ghost"
                            title="Remove from cart"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Summary Section -->
          <div class="lg:col-span-1">
            <div class="card bg-base-100 shadow-sm sticky top-6">
              <div class="card-body">
                <h2 class="text-2xl font-bold text-base-900 mb-4">Order Summary</h2>

                <!-- Items Count -->
                <div class="flex justify-between items-center pb-3 border-b border-base-300">
                  <span class="text-base-600"> Items ({{ cartService.totalQuantity() }}) </span>
                  <span class="font-semibold">{{ cartService.subtotal() | currency }}</span>
                </div>

                <!-- Tax -->
                <div class="flex justify-between items-center pb-3 border-b border-base-300">
                  <span class="text-base-600">
                    Tax ({{ cartService.getTaxRate() * 100 | number: '1.0-0' }}%)
                  </span>
                  <span class="font-semibold">{{ cartService.tax() | currency }}</span>
                </div>

                <!-- Discount (si hay cupón) -->
                @if (cartService.appliedCouponInfo()) {
                  <div
                    class="flex justify-between items-center pb-3 border-b border-base-300 text-success"
                  >
                    <span class="text-base-600">
                      Discount ({{ cartService.discountPercentage() }}%)
                    </span>
                    <span class="font-semibold">
                      -{{ cartService.discountAmount() | currency }}
                    </span>
                  </div>
                }

                <!-- Total -->
                <div class="flex justify-between items-center py-4 mb-4">
                  <span class="text-lg font-bold text-base-900">Total</span>
                  <span class="text-2xl font-bold text-primary">{{
                    cartService.total() | currency
                  }}</span>
                </div>

                <!-- Coupon Code Section -->
                @if (!cartService.appliedCouponInfo()) {
                  <div class="form-control mb-4">
                    <label class="label">
                      <span class="label-text">Apply Coupon Code</span>
                    </label>
                    <div class="input-group">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        [(ngModel)]="couponCode"
                        class="input input-bordered input-sm w-full"
                      />
                      <button
                        (click)="applyCoupon()"
                        [disabled]="!couponCode || cartService.loading()"
                        class="btn btn-sm btn-primary"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                } @else {
                  <div class="alert alert-success mb-4">
                    <div class="flex justify-between items-center w-full">
                      <div>
                        <p class="font-semibold">✅ Coupon Applied</p>
                        <p class="text-sm">{{ cartService.appliedCouponInfo()?.code }}</p>
                        <p class="text-sm">Save: {{ cartService.discountAmount() | currency }}</p>
                      </div>
                      <button (click)="removeCoupon()" class="btn btn-sm btn-ghost text-error">
                        Remove
                      </button>
                    </div>
                  </div>
                }

                <!-- Buttons -->
                <button
                  routerLink="/checkout"
                  [disabled]="cartService.loading()"
                  class="btn btn-primary w-full mb-3"
                >
                  @if (cartService.loading()) {
                    <span class="loading loading-spinner loading-sm"></span>
                  }
                  Proceed to Checkout
                </button>

                <button (click)="continueShopping()" class="btn btn-outline w-full">
                  Continue Shopping
                </button>

                <!-- Clear Cart -->
                <button (click)="confirmClear()" class="btn btn-ghost w-full mt-4 text-error">
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class CartComponent {
  cartService = inject(CartService);
  authService = inject(AuthService);
  couponCode: string = '';

  /**
   * Aumentar cantidad de un item
   */
  increaseQuantity(item: any): void {
    this.cartService.updateQuantity(item.productId, item.quantity + 1, item.size);
  }

  /**
   * Disminuir cantidad de un item
   */
  decreaseQuantity(item: any): void {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.productId, item.quantity - 1, item.size);
    }
  }

  /**
   * Actualizar cantidad manualmente
   */
  updateQuantity(item: any, event: any): void {
    const quantity = parseInt(event.target.value, 10);
    if (quantity > 0) {
      this.cartService.updateQuantity(item.productId, quantity, item.size);
    }
  }

  /**
   * Eliminar item del carrito
   */
  removeItem(item: any): void {
    if (confirm(`Remove ${item.productName} from cart?`)) {
      this.cartService.removeFromCart(item.productId, item.size);
    }
  }

  /**
   * Continuar comprando
   */
  continueShopping(): void {
    window.history.back();
  }

  /**
   * Confirmar limpiar carrito
   */
  confirmClear(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartService.clearCart();
    }
  }

  /**
   * Aplicar cupón de descuento
   */
  applyCoupon(): void {
    if (this.couponCode.trim()) {
      this.cartService.applyCoupon(this.couponCode).subscribe(
        (response) => {
          console.log('Cupón aplicado exitosamente:', response);
        },
        (error) => {
          console.error('Error applying coupon:', error);
        },
      );
    }
  }

  /**
   * Remover cupón aplicado
   */
  removeCoupon(): void {
    this.cartService.removeCoupon();
    console.log('Cupón removido');
  }

  /**
   * Descartar mensaje de error
   */
  dismissError(): void {
    // El error se limpia en el servicio o esperar a que se actualice
    console.log('Error message dismissed');
  }
}
