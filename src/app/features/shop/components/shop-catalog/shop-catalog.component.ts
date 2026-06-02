import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ShopService } from '../../services/shop.service';
import { CartService } from '../../../shared/services/cart.service';

@Component({
  selector: 'app-shop-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-base-200 p-6">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-base-900">🛍️ Our Collection</h1>
          <p class="text-base-600 mt-2">Browse our latest products and find your favorites</p>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <!-- Sidebar Filters -->
          <div class="md:col-span-1">
            <div class="card bg-base-100 shadow-sm sticky top-6">
              <div class="card-body">
                <h2 class="text-lg font-bold text-base-900 mb-4">Filters</h2>

                <!-- Search -->
                <div class="form-control w-full mb-4">
                  <input
                    type="text"
                    placeholder="Search products..."
                    [value]="shopService.private?.searchQuery ?? ''"
                    (input)="onSearch($event)"
                    class="input input-bordered w-full"
                  />
                </div>

                <!-- Category Filter -->
                <div class="form-control w-full mb-4">
                  <label class="label">
                    <span class="label-text font-semibold">Category</span>
                  </label>
                  <select
                    [(ngModel)]="selectedCategory"
                    (ngModelChange)="onCategoryChange($event)"
                    class="select select-bordered w-full"
                  >
                    <option value="">All Categories</option>
                    <option *ngFor="let cat of shopService.getCategories()" [value]="cat">
                      {{ cat }}
                    </option>
                  </select>
                </div>

                <!-- Price Range -->
                <div class="form-control w-full mb-4">
                  <label class="label">
                    <span class="label-text font-semibold">Price Range</span>
                    <span class="label-text-alt">
                      ${{ minPrice }} - ${{ maxPrice }}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    [value]="minPrice"
                    (input)="onMinPriceChange($event)"
                    class="range range-sm"
                  />
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    [value]="maxPrice"
                    (input)="onMaxPriceChange($event)"
                    class="range range-sm mt-2"
                  />
                </div>

                <!-- Reset Filters -->
                <button
                  (click)="resetFilters()"
                  class="btn btn-outline w-full"
                >
                  Reset Filters
                </button>

                <!-- Results Count -->
                <div class="mt-6 p-3 bg-base-200 rounded-lg text-center">
                  <p class="text-sm text-base-600">
                    Showing <span class="font-bold">{{ shopService.totalProducts() }}</span> products
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Products Grid -->
          <div class="md:col-span-3">
            <!-- Loading State -->
            <div *ngIf="shopService.isLoading()" class="flex justify-center items-center h-96">
              <div class="text-center">
                <span class="loading loading-spinner loading-lg"></span>
                <p class="text-base-600 mt-4">Loading products...</p>
              </div>
            </div>

            <!-- Error State -->
            <div *ngIf="shopService.errorMessage()" class="alert alert-error">
              {{ shopService.errorMessage() }}
            </div>

            <!-- Empty State -->
            <div *ngIf="!shopService.isLoading() && shopService.totalProducts() === 0" class="alert alert-info">
              <div class="text-center w-full">
                <p class="text-lg">No products found</p>
                <p class="text-sm text-base-600 mt-1">Try adjusting your filters</p>
              </div>
            </div>

            <!-- Products Grid -->
            <div
              *ngIf="!shopService.isLoading() && shopService.totalProducts() > 0"
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <div
                *ngFor="let product of shopService.paginatedProducts()"
                class="card bg-base-100 shadow-sm hover:shadow-lg transition-shadow"
              >
                <!-- Product Image -->
                <figure class="h-48 bg-base-300 relative overflow-hidden">
                  <img
                    *ngIf="product.images && product.images[0]"
                    [src]="product.images[0]"
                    [alt]="product.name"
                    class="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                  <div *ngIf="!product.images || product.images.length === 0" class="w-full h-full flex items-center justify-center text-5xl">
                    📦
                  </div>

                  <!-- Discount Badge -->
                  <div *ngIf="product.discountPrice" class="badge badge-error absolute top-2 right-2">
                    -{{ shopService.getDiscountPercentage(product) }}%
                  </div>

                  <!-- Featured Badge -->
                  <div *ngIf="product.isFeatured" class="badge badge-primary absolute top-2 left-2">
                    Featured
                  </div>
                </figure>

                <!-- Product Info -->
                <div class="card-body">
                  <!-- Category -->
                  <span class="badge badge-ghost text-xs">{{ product.category }}</span>

                  <!-- Name -->
                  <h2 class="card-title text-lg line-clamp-2">{{ product.name }}</h2>

                  <!-- Description -->
                  <p class="text-sm text-base-600 line-clamp-2">{{ product.description }}</p>

                  <!-- Price -->
                  <div class="flex items-center gap-2 mt-2">
                    <span class="text-2xl font-bold text-primary">
                      {{ shopService.getDisplayPrice(product) | currency }}
                    </span>
                    <span *ngIf="product.discountPrice" class="text-sm line-through text-base-500">
                      {{ product.price | currency }}
                    </span>
                  </div>

                  <!-- Stock Status -->
                  <div class="flex items-center gap-2 text-sm mt-2">
                    <span
                      [class]="shopService.hasStock(product) ? 'badge badge-success' : 'badge badge-error'"
                    >
                      {{ shopService.hasStock(product) ? `In Stock (${product.totalStock})` : 'Out of Stock' }}
                    </span>
                  </div>

                  <!-- Actions -->
                  <div class="card-actions justify-between mt-4">
                    <button
                      routerLink="/store/product/{{ product._id }}"
                      class="btn btn-outline btn-sm flex-1"
                    >
                      View Details
                    </button>
                    <button
                      (click)="addToCart(product)"
                      [disabled]="!shopService.hasStock(product)"
                      class="btn btn-primary btn-sm flex-1"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <div
              *ngIf="shopService.totalPages() > 1"
              class="flex justify-center items-center gap-2 mt-8"
            >
              <button
                (click)="previousPage()"
                [disabled]="shopService.private?.currentPage === 1"
                class="btn btn-outline btn-sm"
              >
                ← Previous
              </button>

              <div class="flex gap-1">
                <button
                  *ngFor="let page of shopService.getPageNumbers()"
                  (click)="goToPage(page)"
                  [class.btn-active]="shopService.private?.currentPage === page"
                  class="btn btn-outline btn-sm"
                >
                  {{ page }}
                </button>
              </div>

              <button
                (click)="nextPage()"
                [disabled]="shopService.private?.currentPage === shopService.totalPages()"
                class="btn btn-outline btn-sm"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class ShopCatalogComponent {
  shopService = inject(ShopService);
  cartService = inject(CartService);

  selectedCategory = '';
  minPrice = 0;
  maxPrice = 10000;

  onSearch(event: any): void {
    const query = (event.target as HTMLInputElement).value;
    this.shopService.setSearchQuery(query);
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.shopService.setCategory(category);
  }

  onMinPriceChange(event: any): void {
    this.minPrice = parseInt((event.target as HTMLInputElement).value, 10);
    this.shopService.setPriceRange(this.minPrice, this.maxPrice);
  }

  onMaxPriceChange(event: any): void {
    this.maxPrice = parseInt((event.target as HTMLInputElement).value, 10);
    this.shopService.setPriceRange(this.minPrice, this.maxPrice);
  }

  resetFilters(): void {
    this.selectedCategory = '';
    this.minPrice = 0;
    this.maxPrice = 10000;
    this.shopService.resetFilters();
  }

  addToCart(product: any): void {
    this.cartService.addToCart(
      {
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        price: this.shopService.getDisplayPrice(product),
        image: product.images?.[0],
        category: product.category,
      },
      1,
    );
    alert(`${product.name} added to cart!`);
  }

  previousPage(): void {
    const current = (this.shopService as any).private?.currentPage || 1;
    this.shopService.goToPage(current - 1);
  }

  nextPage(): void {
    const current = (this.shopService as any).private?.currentPage || 1;
    this.shopService.goToPage(current + 1);
  }

  goToPage(page: number): void {
    this.shopService.goToPage(page);
  }
}
