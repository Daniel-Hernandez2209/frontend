import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../../features/shop/services/cart.service';

@Component({
  selector: 'app-shop-navbar',
  standalone: true,
  imports: [CurrencyPipe, RouterModule],
  template: `
    <div class="navbar bg-base-100 shadow-sm sticky top-0 z-50">
      <div class="flex-1">
        <a routerLink="/store" class="btn btn-ghost text-2xl font-bold"> 🎨 ATHENA BRAND </a>
      </div>

      <div class="flex-none gap-4">
        <!-- Cart Button with Badge -->
        <div class="dropdown dropdown-end">
          <a tabindex="0" routerLink="/store/cart" class="btn btn-ghost btn-circle indicator">
            @if (cartService.itemCount() > 0) {
              <span class="indicator-item badge badge-primary badge-sm">
                {{ cartService.totalQty() }}
              </span>
            }
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </a>
          <div tabindex="0" class="card card-compact dropdown-content bg-base-100 shadow-lg">
            <div class="card-body">
              <span class="text-lg font-bold">{{ cartService.totalQty() }} productos</span>
              <span class="text-info">Subtotal: {{ cartService.subtotal() | currency:'COP':'symbol':'1.0-0' }}</span>
              <div class="card-actions">
                <a routerLink="/store/cart" class="btn btn-primary btn-block">View cart</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Admin Link -->
        <a routerLink="/admin/dashboard" class="btn btn-outline btn-sm"> Admin Panel </a>
      </div>
    </div>
  `,
  styles: [],
})
export class ShopNavbarComponent {
  cartService = inject(CartService);
}
