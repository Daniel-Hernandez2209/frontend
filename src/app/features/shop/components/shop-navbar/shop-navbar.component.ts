import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { LangService } from '../../../../core/services/lang.service';

@Component({
  selector: 'app-shop-navbar',
  standalone: true,
  imports: [RouterModule],
  template: `
    <header class="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-neutral-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">

          <!-- Logo -->
          <a routerLink="/store" class="flex items-center gap-2 group">
            <div class="w-8 h-8 bg-black rounded-full flex items-center justify-center
                        group-hover:bg-neutral-700 transition-colors duration-200">
              <span class="text-white font-black text-xs tracking-tighter">AB</span>
            </div>
            <span class="font-black text-base tracking-widest uppercase text-black">
              {{ lang.t().brand }}
            </span>
          </a>

          <!-- Nav links (desktop) -->
          <nav class="hidden md:flex items-center gap-8">
            <a routerLink="/store"
               class="text-sm font-medium text-neutral-500 hover:text-black transition-colors tracking-wide uppercase">
              Colección
            </a>
            <a routerLink="/store"
               class="text-sm font-medium text-neutral-500 hover:text-black transition-colors tracking-wide uppercase">
              Nuevos
            </a>
            <a routerLink="/store"
               class="text-sm font-medium text-neutral-500 hover:text-black transition-colors tracking-wide uppercase">
              Ofertas
            </a>
          </nav>

          <!-- Actions -->
          <div class="flex items-center gap-3">

            <!-- Lang toggle -->
            <button
              (click)="lang.toggle()"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200
                     text-xs font-bold tracking-widest uppercase hover:bg-black hover:text-white
                     hover:border-black transition-all duration-200"
            >
              <span>{{ lang.lang() === 'es' ? '🇨🇴' : '🇺🇸' }}</span>
              <span>{{ lang.lang() === 'es' ? 'ES' : 'EN' }}</span>
            </button>

            <!-- Admin link -->
            <a routerLink="/admin/dashboard"
               class="hidden sm:flex text-xs font-semibold uppercase tracking-widest
                      text-neutral-400 hover:text-black transition-colors px-2 py-1">
              {{ lang.t().adminPanel }}
            </a>

            <!-- Cart button -->
            <button
              (click)="cart.openCart()"
              class="relative flex items-center justify-center w-10 h-10 rounded-full
                     hover:bg-neutral-100 transition-colors duration-200"
              [attr.aria-label]="lang.t().cart"
            >
              @if (cart.totalQty() > 0) {
                <span class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-black text-white
                             text-[10px] font-bold rounded-full flex items-center justify-center">
                  {{ cart.totalQty() }}
                </span>
              }
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
})
export class ShopNavbarComponent {
  protected cart = inject(CartService);
  protected lang = inject(LangService);
}
