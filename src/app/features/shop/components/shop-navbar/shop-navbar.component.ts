import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { LangService } from '../../../../core/services/lang.service';

@Component({
  selector: 'app-shop-navbar',
  standalone: true,
  imports: [RouterModule],
  template: `
    <header class="sticky top-0 z-50 bg-white border-b border-neutral-100 h-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

        <!-- Logo -->
        <a routerLink="/store" class="flex items-center gap-2.5 shrink-0 group">
          <img src="/assets/logo.jpeg" alt="Athena Brand"
               class="h-9 w-auto group-hover:opacity-80 transition-opacity duration-200"/>
          <span class="font-black text-sm tracking-widest uppercase text-black hidden sm:block">
            ATHENA BRAND
          </span>
        </a>

        <!-- Right actions -->
        <div class="flex items-center gap-4">

          <!-- Lang toggle -->
          <button
            (click)="lang.toggle()"
            class="flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase
                   text-neutral-400 hover:text-black transition-colors duration-200 px-1"
          >
            <span class="text-sm leading-none">{{ lang.lang() === 'es' ? '🇨🇴' : '🇺🇸' }}</span>
            <span>{{ lang.lang() === 'es' ? 'ES' : 'EN' }}</span>
          </button>

          <!-- Separator -->
          <span class="w-px h-4 bg-neutral-200"></span>

          <!-- Instagram -->
          <a href="https://instagram.com/_athena_brand" target="_blank" rel="noopener noreferrer"
             class="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500
                    hover:text-black transition-colors duration-200 tracking-wide">
            <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            <span class="hidden sm:block">@_athena_brand</span>
          </a>

          <!-- Admin link -->
          @if (auth.isAdmin()) {
            <a routerLink="/admin/dashboard"
               class="text-[11px] font-semibold uppercase tracking-widest text-neutral-400
                      hover:text-black transition-colors hidden sm:block">
              {{ lang.t().adminPanel }}
            </a>
          }

          <!-- User menu -->
          @if (auth.isAuthenticated()) {
            <div class="relative group">
              <button class="w-8 h-8 rounded-full bg-black text-white text-xs font-black
                             flex items-center justify-center hover:bg-neutral-800 transition-colors">
                {{ initials() }}
              </button>
              <div class="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl
                           border border-neutral-100 opacity-0 invisible
                           group-hover:opacity-100 group-hover:visible
                           transition-all duration-200 z-50 overflow-hidden">
                <div class="px-4 py-3 border-b border-neutral-100">
                  <p class="text-xs font-bold text-black truncate">{{ auth.displayName() }}</p>
                </div>
                <button (click)="auth.logout()"
                        class="w-full text-left px-4 py-3 text-xs font-semibold text-red-500
                               hover:bg-red-50 transition-colors">
                  {{ lang.t().logout }}
                </button>
              </div>
            </div>
          }

        </div>
      </div>
    </header>
  `,
})
export class ShopNavbarComponent {
  protected auth = inject(AuthService);
  protected lang = inject(LangService);

  initials(): string {
    const u = this.auth.currentUser();
    if (!u) return '?';
    return ((u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')).toUpperCase();
  }
}
