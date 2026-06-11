import { Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe],
  template: `
    <div class="p-6 max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Carrito de compras</h1>
        <a routerLink="/store" class="btn btn-ghost btn-sm">← Seguir comprando</a>
      </div>

      <!-- Empty State -->
      @if (cart.isEmpty()) {
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <span class="text-6xl">🛒</span>
          <p class="text-xl font-medium">Tu carrito está vacío</p>
          <p class="text-base-content/60">Agrega productos para comenzar</p>
          <a routerLink="/store" class="btn btn-primary mt-2">Ver catálogo</a>
        </div>
      }

      <!-- Cart Content -->
      @if (!cart.isEmpty()) {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Items -->
          <div class="lg:col-span-2 flex flex-col gap-3">
            @for (item of cart.items(); track item.productId + item.size) {
              <div class="card card-side bg-base-100 shadow-sm border border-base-200">
                <!-- Imagen -->
                <figure class="w-24 flex-shrink-0">
                  @if (item.image) {
                    <img [src]="item.image" [alt]="item.productName"
                         class="w-full h-full object-cover" />
                  } @else {
                    <div class="w-24 h-24 bg-base-200 flex items-center justify-center text-2xl">
                      👕
                    </div>
                  }
                </figure>
                <div class="card-body p-4 flex-row items-center gap-4">
                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold truncate">{{ item.productName }}</p>
                    <p class="text-sm text-base-content/60">SKU: {{ item.sku }}</p>
                    <div class="flex gap-2 mt-1">
                      <span class="badge badge-outline badge-sm">{{ item.size }}</span>
                      @if (item.category) {
                        <span class="badge badge-ghost badge-sm">{{ item.category }}</span>
                      }
                    </div>
                  </div>

                  <!-- Precio unitario -->
                  <div class="text-right min-w-[80px]">
                    <p class="text-sm text-base-content/60">c/u</p>
                    <p class="font-medium">{{ item.price | currency: 'COP':'symbol':'1.0-0' }}</p>
                  </div>

                  <!-- Cantidad -->
                  <div class="join">
                    <button class="btn btn-sm join-item btn-ghost"
                            (click)="decrement(item)"
                            [disabled]="item.quantity <= 1">−</button>
                    <span class="btn btn-sm join-item cursor-default no-animation min-w-[2.5rem]">
                      {{ item.quantity }}
                    </span>
                    <button class="btn btn-sm join-item btn-ghost"
                            (click)="increment(item)"
                            [disabled]="item.quantity >= item.maxStock || item.quantity >= 10">+</button>
                  </div>

                  <!-- Subtotal -->
                  <div class="text-right min-w-[90px]">
                    <p class="font-bold text-primary">
                      {{ item.price * item.quantity | currency: 'COP':'symbol':'1.0-0' }}
                    </p>
                  </div>

                  <!-- Eliminar -->
                  <button class="btn btn-ghost btn-sm text-error"
                          (click)="remove(item)"
                          title="Eliminar">✕</button>
                </div>
              </div>
            }

            <!-- Limpiar carrito -->
            <button class="btn btn-ghost btn-sm text-error self-start mt-2"
                    (click)="clear()">
              🗑 Vaciar carrito
            </button>
          </div>

          <!-- Resumen -->
          <div class="lg:col-span-1">
            <div class="card bg-base-100 shadow-sm border border-base-200 sticky top-6">
              <div class="card-body">
                <h2 class="card-title text-lg mb-2">Resumen del pedido</h2>

                <div class="flex flex-col gap-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-base-content/70">
                      Subtotal ({{ cart.totalQty() }} unidades)
                    </span>
                    <span>{{ cart.subtotal() | currency: 'COP':'symbol':'1.0-0' }}</span>
                  </div>

                  <div class="flex justify-between">
                    <span class="text-base-content/70">Envío</span>
                    @if (cart.shipping() === 0) {
                      <span class="text-success font-medium">Gratis</span>
                    } @else {
                      <span>{{ cart.shipping() | currency: 'COP':'symbol':'1.0-0' }}</span>
                    }
                  </div>

                  @if (cart.shipping() > 0) {
                    <p class="text-xs text-base-content/50">
                      Envío gratis en compras mayores a
                      {{ 200000 | currency: 'COP':'symbol':'1.0-0' }}
                    </p>
                  }

                  <div class="flex justify-between">
                    <span class="text-base-content/70">IVA (19%)</span>
                    <span>{{ cart.tax() | currency: 'COP':'symbol':'1.0-0' }}</span>
                  </div>

                  <div class="divider my-1"></div>

                  <div class="flex justify-between text-base font-bold">
                    <span>Total</span>
                    <span class="text-primary text-lg">
                      {{ cart.total() | currency: 'COP':'symbol':'1.0-0' }}
                    </span>
                  </div>
                </div>

                <div class="card-actions flex-col mt-4 gap-2">
                  <button class="btn btn-primary w-full" routerLink="/checkout">
                    Ir al checkout
                  </button>
                  <button class="btn btn-outline w-full btn-sm" routerLink="/store">
                    Seguir comprando
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      }
    </div>
  `,
})
export class CartComponent {
  protected cart = inject(CartService);
  private router = inject(Router);

  increment(item: CartItem): void {
    this.cart.updateQuantity(item.productId, item.size, item.quantity + 1);
  }

  decrement(item: CartItem): void {
    this.cart.updateQuantity(item.productId, item.size, item.quantity - 1);
  }

  remove(item: CartItem): void {
    this.cart.removeItem(item.productId, item.size);
  }

  clear(): void {
    this.cart.clearCart();
  }
}
