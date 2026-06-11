import { Component, inject, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CurrencyPipe, RouterModule],
  template: `
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-base-200">
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none"
             viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184
                   1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
        <h2 class="font-bold text-lg">
          Mi carrito
          @if (cart.totalQty() > 0) {
            <span class="badge badge-primary badge-sm ml-1">{{ cart.totalQty() }}</span>
          }
        </h2>
      </div>
      <button class="btn btn-ghost btn-sm btn-circle" (click)="close.emit()">✕</button>
    </div>

    <!-- Items — zona scrolleable -->
    <div class="flex-1 overflow-y-auto">

      <!-- Empty state -->
      @if (cart.isEmpty()) {
        <div class="flex flex-col items-center justify-center h-64 gap-3 text-base-content/50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 opacity-30" fill="none"
               viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184
                     1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          <p class="font-medium">Tu carrito está vacío</p>
          <button class="btn btn-primary btn-sm" (click)="goToStore()">
            Ver catálogo
          </button>
        </div>
      }

      <!-- Lista de items -->
      @if (!cart.isEmpty()) {
        <ul class="divide-y divide-base-200">
          @for (item of cart.items(); track item.productId + item.size) {
            <li class="flex gap-3 p-4 hover:bg-base-50 transition-colors">

              <!-- Imagen -->
              <div class="w-16 h-16 rounded-lg overflow-hidden bg-base-200 flex-shrink-0">
                @if (item.image) {
                  <img [src]="item.image" [alt]="item.productName"
                       class="w-full h-full object-cover" />
                } @else {
                  <div class="w-full h-full flex items-center justify-center text-xl opacity-40">
                    👕
                  </div>
                }
              </div>

              <!-- Info + controles -->
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm truncate leading-tight">{{ item.productName }}</p>
                <div class="flex gap-1 mt-0.5">
                  <span class="badge badge-ghost badge-xs">{{ item.size }}</span>
                  @if (item.category) {
                    <span class="badge badge-ghost badge-xs">{{ item.category }}</span>
                  }
                </div>

                <div class="flex items-center justify-between mt-2">
                  <!-- Stepper de cantidad -->
                  <div class="join">
                    <button class="btn btn-xs join-item btn-ghost font-bold"
                            (click)="decrement(item)"
                            [disabled]="item.quantity <= 1">−</button>
                    <span class="btn btn-xs join-item no-animation cursor-default min-w-[2rem]
                                 pointer-events-none">
                      {{ item.quantity }}
                    </span>
                    <button class="btn btn-xs join-item btn-ghost font-bold"
                            (click)="increment(item)"
                            [disabled]="item.quantity >= item.maxStock || item.quantity >= 10">+</button>
                  </div>

                  <!-- Precio línea -->
                  <span class="font-semibold text-sm text-primary">
                    {{ item.price * item.quantity | currency:'COP':'symbol':'1.0-0' }}
                  </span>
                </div>
              </div>

              <!-- Eliminar -->
              <button class="btn btn-ghost btn-xs text-error self-start mt-1 flex-shrink-0"
                      (click)="remove(item)"
                      title="Eliminar">✕</button>
            </li>
          }
        </ul>
      }
    </div>

    <!-- Footer — resumen y acciones -->
    @if (!cart.isEmpty()) {
      <div class="border-t border-base-200 p-4 flex flex-col gap-3">

        <!-- Desglose de precios -->
        <div class="flex flex-col gap-1 text-sm">
          <div class="flex justify-between text-base-content/70">
            <span>Subtotal</span>
            <span>{{ cart.subtotal() | currency:'COP':'symbol':'1.0-0' }}</span>
          </div>
          <div class="flex justify-between text-base-content/70">
            <span>Envío</span>
            @if (cart.shipping() === 0) {
              <span class="text-success font-medium">Gratis 🎉</span>
            } @else {
              <span>{{ cart.shipping() | currency:'COP':'symbol':'1.0-0' }}</span>
            }
          </div>
          <div class="flex justify-between text-base-content/70">
            <span>IVA (19%)</span>
            <span>{{ cart.tax() | currency:'COP':'symbol':'1.0-0' }}</span>
          </div>
        </div>

        <!-- Barra de progreso hacia envío gratis -->
        @if (cart.shipping() > 0) {
          @let progress = cart.subtotal() / 200000 * 100;
          <div class="text-xs text-base-content/60">
            <div class="flex justify-between mb-1">
              <span>Faltan {{ (200000 - cart.subtotal()) | currency:'COP':'symbol':'1.0-0' }}
                para envío gratis</span>
            </div>
            <progress class="progress progress-primary w-full h-1.5"
                      [value]="progress" max="100"></progress>
          </div>
        }

        <div class="divider my-0"></div>

        <!-- Total -->
        <div class="flex justify-between items-baseline">
          <span class="font-bold">Total</span>
          <span class="text-xl font-bold text-primary">
            {{ cart.total() | currency:'COP':'symbol':'1.0-0' }}
          </span>
        </div>

        <!-- CTAs -->
        <button class="btn btn-primary w-full" (click)="goToCheckout()">
          Finalizar compra
        </button>
        <button class="btn btn-outline btn-sm w-full" (click)="goToCart()">
          Ver carrito completo
        </button>
        <button class="btn btn-ghost btn-xs text-error w-full" (click)="cart.clearCart()">
          Vaciar carrito
        </button>
      </div>
    }
  `,
  host: { class: 'flex flex-col h-full' },
})
export class CartDrawerComponent {
  protected cart = inject(CartService);
  private router = inject(Router);

  /** Emitido al cerrar para que el padre actualice el checkbox del drawer */
  close = output<void>();

  increment(item: CartItem): void {
    this.cart.updateQuantity(item.productId, item.size, item.quantity + 1);
  }

  decrement(item: CartItem): void {
    this.cart.updateQuantity(item.productId, item.size, item.quantity - 1);
  }

  remove(item: CartItem): void {
    this.cart.removeItem(item.productId, item.size);
  }

  goToCheckout(): void {
    this.cart.closeCart();
    this.router.navigate(['/checkout']);
  }

  goToCart(): void {
    this.cart.closeCart();
    this.router.navigate(['/store/cart']);
  }

  goToStore(): void {
    this.cart.closeCart();
    this.router.navigate(['/store']);
  }
}
