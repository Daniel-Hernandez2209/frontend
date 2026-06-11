import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-shop-navbar',
  standalone: true,
  imports: [RouterModule],
  template: `
    <header class="navbar bg-base-100 shadow-sm sticky top-0 z-40 border-b border-base-200">

      <!-- Logo -->
      <div class="flex-1">
        <a routerLink="/store"
           class="btn btn-ghost normal-case text-xl font-extrabold tracking-tight gap-2">
          <div class="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span class="text-primary-content font-bold text-xs">AB</span>
          </div>
          ATHENA BRAND
        </a>
      </div>

      <!-- Acciones -->
      <div class="flex-none flex items-center gap-1">

        <!-- Botón de carrito — abre el drawer -->
        <button
          class="btn btn-ghost btn-circle indicator"
          (click)="cart.openCart()"
          aria-label="Abrir carrito"
        >
          @if (cart.totalQty() > 0) {
            <span class="indicator-item badge badge-primary badge-xs font-bold">
              {{ cart.totalQty() }}
            </span>
          }
          <!-- Icono carrito -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
               viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184
                     1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        </button>

        <!-- Separador -->
        <div class="divider divider-horizontal mx-0 h-6"></div>

        <!-- Panel admin -->
        <a routerLink="/admin/dashboard"
           class="btn btn-outline btn-sm hidden sm:flex">
          Panel Admin
        </a>
      </div>

    </header>
  `,
})
export class ShopNavbarComponent {
  protected cart = inject(CartService);
}
