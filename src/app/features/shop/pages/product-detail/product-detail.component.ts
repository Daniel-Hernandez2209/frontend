import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ShopService, Product } from '../../services/shop.service';
import { CartService } from '../../../shared/services/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-base-200 p-6">
      <div class="max-w-6xl mx-auto">
        <!-- Back Button -->
        <a routerLink="/store" class="btn btn-ghost mb-6">← Back to Shop</a>

        <!-- Loading State -->
        <div *ngIf="loading()" class="flex justify-center items-center h-96">
          <div class="text-center">
            <span class="loading loading-spinner loading-lg"></span>
            <p class="text-base-600 mt-4">Loading product...</p>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="error()" class="alert alert-error mb-6">
          {{ error() }}
        </div>

        <!-- Product Content -->
        <div *ngIf="product() && !loading()" class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Image Gallery -->
          <div class="flex flex-col gap-4">
            <!-- Main Image -->
            <div class="h-96 bg-base-300 rounded-lg overflow-hidden">
              <img
                *ngIf="currentImage()"
                [src]="currentImage()"
                [alt]="product()!.name"
                class="w-full h-full object-cover"
              />
              <div *ngIf="!currentImage()" class="w-full h-full flex items-center justify-center text-6xl">
                📦
              </div>
            </div>

            <!-- Thumbnails -->
            <div class="flex gap-2">
              <button
                *ngFor="let image of product()!.images; let i = index"
                (click)="selectImage(i)"
                [class.ring-2]="imageIndex() === i"
                class="h-20 w-20 rounded-lg bg-base-300 overflow-hidden ring-primary"
              >
                <img
                  [src]="image"
                  [alt]="'Thumbnail ' + i"
                  class="w-full h-full object-cover"
                />
              </button>
            </div>
          </div>

          <!-- Product Details -->
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
              <!-- Category & Featured -->
              <div class="flex items-center gap-2 mb-4">
                <span class="badge badge-ghost">{{ product()!.category }}</span>
                <span *ngIf="product()!.isFeatured" class="badge badge-primary">Featured</span>
              </div>

              <!-- Name -->
              <h1 class="text-4xl font-bold text-base-900 mb-4">{{ product()!.name }}</h1>

              <!-- Description -->
              <p class="text-base-600 mb-6">{{ product()!.description }}</p>

              <!-- Price -->
              <div class="flex items-center gap-3 mb-4 py-4 border-y border-base-300">
                <span class="text-4xl font-bold text-primary">
                  {{ shopService.getDisplayPrice(product()!) | currency }}
                </span>
                <span *ngIf="product()!.discountPrice" class="text-lg line-through text-base-500">
                  {{ product()!.price | currency }}
                </span>
                <span *ngIf="product()!.discountPrice" class="badge badge-error">
                  -{{ shopService.getDiscountPercentage(product()!) }}%
                </span>
              </div>

              <!-- Stock Status -->
              <div class="mb-6">
                <span
                  [class]="shopService.hasStock(product()!) ? 'badge badge-success badge-lg' : 'badge badge-error badge-lg'"
                >
                  {{ shopService.hasStock(product()!)
                    ? `In Stock (${product()!.totalStock} available)`
                    : 'Out of Stock'
                  }}
                </span>
              </div>

              <!-- Sizes -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-base-900 mb-3">Select Size</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    *ngFor="let size of product()!.sizes"
                    (click)="selectSize(size.size)"
                    [disabled]="size.stock === 0"
                    [class.btn-active]="selectedSize() === size.size"
                    class="btn btn-outline"
                  >
                    {{ size.size }}
                    <span *ngIf="size.stock === 0" class="text-xs">(Out)</span>
                  </button>
                </div>
                <p *ngIf="!selectedSize()" class="text-sm text-error mt-2">Please select a size</p>
              </div>

              <!-- Quantity -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-base-900 mb-3">Quantity</label>
                <div class="flex items-center gap-3">
                  <button (click)="decreaseQuantity()" class="btn btn-outline btn-sm">−</button>
                  <input
                    type="number"
                    [value]="quantity()"
                    [min]="1"
                    [max]="maxQuantity()"
                    (change)="updateQuantity($event)"
                    class="input input-bordered w-20 text-center"
                  />
                  <button (click)="increaseQuantity()" class="btn btn-outline btn-sm">+</button>
                </div>
              </div>

              <!-- Add to Cart Button -->
              <button
                (click)="addToCart()"
                [disabled]="!selectedSize() || !shopService.hasStock(product()!)"
                class="btn btn-primary btn-lg w-full mb-4"
              >
                🛒 Add to Cart - {{ (shopService.getDisplayPrice(product()!) * quantity()) | currency }}
              </button>

              <!-- SKU & Details -->
              <div class="divider"></div>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-base-600">SKU:</span>
                  <span class="font-mono">{{ product()!.sku }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-600">Category:</span>
                  <span>{{ product()!.category }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-600">Available Stock:</span>
                  <span>{{ product()!.totalStock }} units</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-600">Created:</span>
                  <span>{{ product()!.createdAt | date: 'short' }}</span>
                </div>
              </div>

              <!-- Trust Badges -->
              <div class="mt-6 p-4 bg-base-200 rounded-lg">
                <p class="text-xs text-base-600">
                  ✓ Free shipping on orders over $50<br />
                  ✓ 30-day return policy<br />
                  ✓ Secure checkout<br />
                  ✓ Fast delivery
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  shopService = inject(ShopService);
  cartService = inject(CartService);

  // Estado con Signals
  product = signal<Product | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  imageIndex = signal(0);
  selectedSize = signal<string | null>(null);
  quantity = signal(1);

  // Computed
  currentImage = computed(() => {
    const p = this.product();
    return p?.images?.[this.imageIndex()] || null;
  });

  maxQuantity = computed(() => {
    const size = this.selectedSize();
    if (!size) return 1;
    const sizeStock = this.product()?.sizes.find((s) => s.size === size)?.stock || 0;
    return Math.max(1, sizeStock);
  });

  ngOnInit(): void {
    this.loadProduct();
  }

  private async loadProduct(): Promise<void> {
    try {
      const id = this.route.snapshot.paramMap.get('id');
      if (!id) {
        this.error.set('Product ID not found');
        return;
      }

      const product = await this.shopService.getProductDetail(id);
      this.product.set(product);
      // Auto-select first available size
      const firstAvailableSize = product.sizes.find((s) => s.stock > 0);
      if (firstAvailableSize) {
        this.selectedSize.set(firstAvailableSize.size);
      }
    } catch (err: any) {
      this.error.set(err.message || 'Failed to load product');
    } finally {
      this.loading.set(false);
    }
  }

  selectImage(index: number): void {
    this.imageIndex.set(index);
  }

  selectSize(size: string): void {
    this.selectedSize.set(size);
    this.quantity.set(1);
  }

  increaseQuantity(): void {
    const max = this.maxQuantity();
    if (this.quantity() < max) {
      this.quantity.update((q) => q + 1);
    }
  }

  decreaseQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update((q) => q - 1);
    }
  }

  updateQuantity(event: any): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    if (value > 0 && value <= this.maxQuantity()) {
      this.quantity.set(value);
    }
  }

  addToCart(): void {
    const product = this.product();
    const size = this.selectedSize();
    const qty = this.quantity();

    if (!product || !size) {
      alert('Please select a size');
      return;
    }

    this.cartService.addToCart(
      {
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        price: this.shopService.getDisplayPrice(product),
        image: product.images?.[0],
        size,
        category: product.category,
      },
      qty,
    );

    alert(`${qty} x ${product.name} added to cart!`);
    // Opcional: Ir al carrito automáticamente
    // this.router.navigate(['/cart']);
  }
}
