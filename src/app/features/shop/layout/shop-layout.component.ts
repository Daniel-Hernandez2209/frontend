import { Component, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CartService } from '../services/cart.service';
import { ShopNavbarComponent } from '../components/shop-navbar/shop-navbar.component';
import { CartDrawerComponent } from '../components/cart-drawer/cart-drawer.component';

/**
 * Layout raíz de la tienda pública.
 *
 * Estructura DaisyUI drawer-end:
 *
 *  ┌─────────────────────────────┐
 *  │  drawer-content             │
 *  │  ┌─────────────────────┐   │
 *  │  │ ShopNavbar          │   │
 *  │  ├─────────────────────┤   │
 *  │  │ <router-outlet>     │   │
 *  │  └─────────────────────┘   │
 *  └─────────────────────────────┘
 *                      ╔══════════╗
 *                      ║ Drawer   ║ ← se desliza desde la derecha
 *                      ║ (carrito)║
 *                      ╚══════════╝
 *
 * El signal `CartService.isOpen` es la fuente de verdad.
 * El checkbox del drawer se sincroniza vía property binding.
 */
@Component({
  selector: 'app-shop-layout',
  standalone: true,
  imports: [RouterOutlet, ShopNavbarComponent, CartDrawerComponent],
  template: `
    <div class="drawer drawer-end min-h-screen">

      <!--
        El checkbox es el mecanismo que DaisyUI usa internamente para CSS.
        Lo controlamos programáticamente desde CartService.isOpen.
      -->
      <input
        id="cart-drawer"
        type="checkbox"
        class="drawer-toggle"
        [checked]="cart.isOpen()"
        (change)="onOverlayChange($event)"
      />

      <!-- Contenido principal -->
      <div class="drawer-content flex flex-col">
        <app-shop-navbar />
        <main class="flex-1 bg-base-200/40">
          <router-outlet />
        </main>
      </div>

      <!-- Panel lateral del carrito -->
      <div class="drawer-side z-50">
        <!-- Overlay oscuro — clic cierra el drawer -->
        <label
          for="cart-drawer"
          class="drawer-overlay"
          (click)="cart.closeCart()"
        ></label>

        <!-- Panel: ancho fijo en desktop, full en mobile -->
        <div class="w-full max-w-sm min-h-full bg-base-100 shadow-2xl flex flex-col">
          <app-cart-drawer (close)="cart.closeCart()" />
        </div>
      </div>

    </div>
  `,
})
export class ShopLayoutComponent {
  protected cart = inject(CartService);

  /**
   * Cuando el usuario hace clic en el overlay nativo del checkbox,
   * sincronizamos el Signal con el estado real del checkbox.
   */
  onOverlayChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    checked ? this.cart.openCart() : this.cart.closeCart();
  }
}
