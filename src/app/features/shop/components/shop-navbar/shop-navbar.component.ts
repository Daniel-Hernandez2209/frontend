import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { LangService } from '../../../../core/services/lang.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

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
            <a routerLink="/store" [queryParams]="{}"
               class="text-sm font-medium text-neutral-500 hover:text-black transition-colors tracking-wide uppercase">
              {{ lang.t().navCollection }}
            </a>
            <a routerLink="/store" [queryParams]="{filter: 'new'}"
               class="text-sm font-medium text-neutral-500 hover:text-black transition-colors tracking-wide uppercase">
              {{ lang.t().navNew }}
            </a>
            <a routerLink="/store" [queryParams]="{filter: 'sale'}"
               class="text-sm font-medium text-neutral-500 hover:text-black transition-colors tracking-wide uppercase">
              {{ lang.t().navSale }}
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

            <!-- Admin link — solo visible para admins -->
            @if (auth.isAdmin()) {
              <a routerLink="/admin/dashboard"
                 class="hidden sm:flex text-xs font-semibold uppercase tracking-widest
                        text-neutral-400 hover:text-black transition-colors px-2 py-1">
                {{ lang.t().adminPanel }}
              </a>
            }

            <!-- User menu -->
            @if (auth.isAuthenticated()) {
              <div class="relative group">
                <button class="flex items-center gap-2 px-3 py-1.5 rounded-full
                               hover:bg-neutral-100 transition-colors duration-200">
                  <div class="w-7 h-7 rounded-full bg-black text-white text-xs font-bold
                               flex items-center justify-center tracking-wider">
                    {{ initials() }}
                  </div>
                  <svg class="w-3 h-3 text-neutral-400 group-hover:text-black transition-colors"
                       fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                <!-- Dropdown -->
                <div class="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-xl
                             border border-neutral-100 opacity-0 invisible
                             group-hover:opacity-100 group-hover:visible
                             transition-all duration-200 z-50 overflow-hidden">
                  <div class="px-4 py-3 border-b border-neutral-100">
                    <p class="text-xs font-bold text-black truncate">{{ auth.displayName() }}</p>
                    <p class="text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">
                      {{ auth.userRole() }}
                    </p>
                  </div>
                  <button (click)="auth.logout()"
                          class="w-full text-left px-4 py-3 text-xs font-semibold text-red-500
                                 hover:bg-red-50 transition-colors tracking-wide uppercase">
                    Cerrar sesión
                  </button>
                </div>
              </div>
            }

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
  protected auth = inject(AuthService);
  private router = inject(Router);

  initials(): string {
    const u = this.auth.currentUser();
    if (!u) return '?';
    return ((u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')).toUpperCase();
  }
}
