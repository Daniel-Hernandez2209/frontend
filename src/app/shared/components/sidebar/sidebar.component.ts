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
    <aside class="w-64 bg-base-100 border-r border-base-300 h-screen overflow-y-auto sticky top-0">
      <nav class="p-4 space-y-2">
        <!-- Dashboard -->
        <a
          routerLink="/admin/dashboard"
          routerLinkActive="bg-primary text-primary-content"
          [routerLinkActiveOptions]="{ exact: true }"
          class="flex items-center gap-3 px-4 py-3 text-base-content hover:bg-base-200 rounded-lg transition"
        >
          <span class="text-xl">📊</span>
          <span class="font-medium">Dashboard</span>
        </a>

        <!-- Products Collapse -->
        <div class="collapse collapse-arrow bg-base-200 rounded-lg">
          <input type="checkbox" [checked]="menus['products']" (change)="toggleMenu('products')" />
          <div class="collapse-title flex items-center gap-3 px-4 py-3 font-medium cursor-pointer">
            <span class="text-xl">📦</span>
            <span>Products</span>
          </div>
          <div class="collapse-content pl-4 space-y-1">
            <a
              routerLink="/admin/products"
              routerLinkActive="text-primary font-semibold"
              class="block px-4 py-2 text-sm text-base-content hover:bg-base-300 rounded-lg transition"
            >
              All Products
            </a>
            <a
              routerLink="/admin/products/create"
              class="block px-4 py-2 text-sm text-base-content hover:bg-base-300 rounded-lg transition"
            >
              Add Product
            </a>
          </div>
        </div>

        <!-- Orders Collapse -->
        <div class="collapse collapse-arrow bg-base-200 rounded-lg">
          <input type="checkbox" [checked]="menus['orders']" (change)="toggleMenu('orders')" />
          <div class="collapse-title flex items-center gap-3 px-4 py-3 font-medium cursor-pointer">
            <span class="text-xl">🛒</span>
            <span>Orders</span>
          </div>
          <div class="collapse-content pl-4 space-y-1">
            <a
              routerLink="/admin/orders"
              routerLinkActive="text-primary font-semibold"
              class="block px-4 py-2 text-sm text-base-content hover:bg-base-300 rounded-lg transition"
            >
              All Orders
            </a>
            <a
              routerLink="/admin/orders"
              [queryParams]="{ status: 'pending' }"
              class="block px-4 py-2 text-sm text-base-content hover:bg-base-300 rounded-lg transition"
            >
              Pending
            </a>
          </div>
        </div>

        <!-- Categories -->
        <a
          routerLink="/admin/categories"
          routerLinkActive="bg-primary text-primary-content"
          class="flex items-center gap-3 px-4 py-3 text-base-content hover:bg-base-200 rounded-lg transition"
        >
          <span class="text-xl">🏷️</span>
          <span class="font-medium">Categories</span>
        </a>

        <!-- Users -->
        <a
          routerLink="/admin/users"
          routerLinkActive="bg-primary text-primary-content"
          class="flex items-center gap-3 px-4 py-3 text-base-content hover:bg-base-200 rounded-lg transition"
        >
          <span class="text-xl">👥</span>
          <span class="font-medium">Users</span>
        </a>

        <!-- Settings -->
        <div class="border-t border-base-300 mt-6 pt-6">
          <a
            routerLink="/admin/profile"
            routerLinkActive="bg-primary text-primary-content"
            class="flex items-center gap-3 px-4 py-3 text-base-content hover:bg-base-200 rounded-lg transition"
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
