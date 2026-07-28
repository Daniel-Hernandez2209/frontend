import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

interface MenuItem {
  label: string;
  route?: string;
  icon: string;
  children?: MenuItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="w-56 bg-neutral-900 border-r border-neutral-800 h-screen flex flex-col shrink-0">

      <!-- Logo -->
      <div class="px-5 py-5 border-b border-neutral-800">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span class="text-black font-black text-xs tracking-tighter">AB</span>
          </div>
          <div>
            <p class="text-white font-black text-sm tracking-widest uppercase">Athena</p>
            <p class="text-neutral-600 text-[10px] tracking-widest uppercase">Admin Panel</p>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

        <a routerLink="/admin/dashboard"
           routerLinkActive="bg-white text-black"
           [routerLinkActiveOptions]="{ exact: true }"
           class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white transition text-sm font-semibold">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
          </svg>
          Dashboard
        </a>

        <!-- Productos -->
        <div>
          <button (click)="toggleMenu('products')"
                  class="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl
                         text-neutral-400 hover:bg-neutral-800 hover:text-white transition text-sm font-semibold">
            <span class="flex items-center gap-3">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
              </svg>
              Productos
            </span>
            <svg class="w-3.5 h-3.5 transition-transform" [class.rotate-180]="menus['products']"
                 fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          @if (menus['products']) {
            <div class="ml-4 mt-0.5 pl-3 border-l border-neutral-800 space-y-0.5">
              <a routerLink="/admin/products" routerLinkActive="text-white font-bold"
                 class="block px-3 py-2 text-xs text-neutral-500 hover:text-white rounded-lg transition">
                Todos los productos
              </a>
              <a routerLink="/admin/products/create"
                 class="block px-3 py-2 text-xs text-neutral-500 hover:text-white rounded-lg transition">
                Agregar producto
              </a>
            </div>
          }
        </div>

        <!-- Pedidos -->
        <div>
          <button (click)="toggleMenu('orders')"
                  class="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl
                         text-neutral-400 hover:bg-neutral-800 hover:text-white transition text-sm font-semibold">
            <span class="flex items-center gap-3">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              Pedidos
            </span>
            <svg class="w-3.5 h-3.5 transition-transform" [class.rotate-180]="menus['orders']"
                 fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          @if (menus['orders']) {
            <div class="ml-4 mt-0.5 pl-3 border-l border-neutral-800 space-y-0.5">
              <a routerLink="/admin/orders" routerLinkActive="text-white font-bold"
                 class="block px-3 py-2 text-xs text-neutral-500 hover:text-white rounded-lg transition">
                Todos los pedidos
              </a>
              <a routerLink="/admin/orders" [queryParams]="{ status: 'pending' }"
                 class="block px-3 py-2 text-xs text-neutral-500 hover:text-white rounded-lg transition">
                Pendientes
              </a>
            </div>
          }
        </div>

        <a routerLink="/admin/categories"
           routerLinkActive="bg-white text-black"
           class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white transition text-sm font-semibold">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
          </svg>
          Categorías
        </a>

        <a routerLink="/admin/users"
           routerLinkActive="bg-white text-black"
           class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white transition text-sm font-semibold">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Usuarios
        </a>
      </nav>

      <!-- Footer -->
      <div class="px-3 py-4 border-t border-neutral-800">
        <a routerLink="/store"
           class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-600 hover:text-white hover:bg-neutral-800 transition text-xs font-semibold">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
          Ver tienda
        </a>
      </div>
    </aside>
  `,
  styles: [],
})
export class SidebarComponent {
  menus: { [key: string]: boolean } = {
    products: true,
    orders: true,
  };

  toggleMenu(menu: string): void {
    this.menus[menu] = !this.menus[menu];
  }
}
