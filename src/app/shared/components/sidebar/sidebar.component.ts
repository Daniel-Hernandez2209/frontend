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
    <aside class="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto sticky top-0">
      <nav class="px-4 py-6 space-y-2">
        <!-- Dashboard -->
        <a
          routerLink="/admin/dashboard"
          routerLinkActive="bg-blue-50 text-blue-600"
          [routerLinkActiveOptions]="{ exact: true }"
          class="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
        >
          <span class="text-xl">📊</span>
          <span class="font-medium">Dashboard</span>
        </a>

        <!-- Products -->
        <div>
          <button
            (click)="toggleMenu('products')"
            class="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
          >
            <div class="flex items-center space-x-3">
              <span class="text-xl">📦</span>
              <span class="font-medium">Products</span>
            </div>
            <span [class.rotate-180]="menus['products']" class="transition">▼</span>
          </button>
          <div *ngIf="menus['products']" class="ml-4 mt-1 space-y-1">
            <a
              routerLink="/admin/products"
              routerLinkActive="bg-blue-50 text-blue-600"
              class="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition"
            >
              All Products
            </a>
            <a
              routerLink="/admin/products/create"
              class="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition"
            >
              Add Product
            </a>
          </div>
        </div>

        <!-- Orders -->
        <div>
          <button
            (click)="toggleMenu('orders')"
            class="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
          >
            <div class="flex items-center space-x-3">
              <span class="text-xl">🛒</span>
              <span class="font-medium">Orders</span>
            </div>
            <span [class.rotate-180]="menus['orders']" class="transition">▼</span>
          </button>
          <div *ngIf="menus['orders']" class="ml-4 mt-1 space-y-1">
            <a
              routerLink="/admin/orders"
              routerLinkActive="bg-blue-50 text-blue-600"
              class="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition"
            >
              All Orders
            </a>
            <a
              routerLink="/admin/orders"
              [queryParams]="{ status: 'pending' }"
              class="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition"
            >
              Pending
            </a>
          </div>
        </div>

        <!-- Categories -->
        <a
          routerLink="/admin/categories"
          routerLinkActive="bg-blue-50 text-blue-600"
          class="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
        >
          <span class="text-xl">🏷️</span>
          <span class="font-medium">Categories</span>
        </a>

        <!-- Users -->
        <a
          routerLink="/admin/users"
          routerLinkActive="bg-blue-50 text-blue-600"
          class="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
        >
          <span class="text-xl">👥</span>
          <span class="font-medium">Users</span>
        </a>

        <!-- Settings -->
        <div class="border-t border-gray-200 mt-6 pt-6">
          <a
            routerLink="/admin/profile"
            routerLinkActive="bg-blue-50 text-blue-600"
            class="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
          >
            <span class="text-xl">⚙️</span>
            <span class="font-medium">Settings</span>
          </a>
        </div>
      </nav>
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
