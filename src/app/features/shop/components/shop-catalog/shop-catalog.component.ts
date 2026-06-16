import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ShopService } from '../../services/shop.service';
import { CartService } from '../../services/cart.service';
import { LangService } from '../../../../core/services/lang.service';

type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest';

@Component({
  selector: 'app-shop-catalog',
  standalone: true,
  imports: [DecimalPipe, FormsModule, RouterModule],
  templateUrl: './shop-catalog.html',
  styleUrl: './shop-catalog.css',
})
export class ShopCatalogComponent implements OnInit {
  shopService = inject(ShopService);
  cartService = inject(CartService);
  protected lang = inject(LangService);
  private route = inject(ActivatedRoute);

  selectedCategory = '';
  searchQuery = '';
  maxPrice = 99_999_999;
  activeFilter = '';
  private sortOption = signal<SortOption>('relevance');

  catalogAnimKey = signal(0);
  private firstLoad = true;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const filter = params['filter'] ?? '';
      this.activeFilter = filter;

      if (filter === 'new') {
        this.shopService.setOnlyDiscounted(false);
        this.sortOption.set('newest');
      } else if (filter === 'sale') {
        this.shopService.setOnlyDiscounted(true);
        this.sortOption.set('relevance');
      } else {
        this.shopService.resetFilters();
        this.sortOption.set('relevance');
      }

      // Scroll al catálogo cuando hay filtro activo (no en la carga inicial sin filtro)
      if (!this.firstLoad || filter) {
        setTimeout(() => {
          document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }

      // Reinicia la animación de entrada de las cards
      this.catalogAnimKey.update((k) => k + 1);
      this.firstLoad = false;
    });
  }

  sortedProducts = computed(() => {
    const products = [...this.shopService.paginatedProducts()];
    switch (this.sortOption()) {
      case 'price_asc':
        return products.sort(
          (a, b) => this.shopService.getDisplayPrice(a) - this.shopService.getDisplayPrice(b),
        );
      case 'price_desc':
        return products.sort(
          (a, b) => this.shopService.getDisplayPrice(b) - this.shopService.getDisplayPrice(a),
        );
      case 'newest':
        return products.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      default:
        return products;
    }
  });

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.shopService.setSearchQuery(this.searchQuery);
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.shopService.setCategory(category);
  }

  onSortChange(event: Event): void {
    this.sortOption.set((event.target as HTMLSelectElement).value as SortOption);
  }

  resetFilters(): void {
    this.selectedCategory = '';
    this.searchQuery = '';
    this.maxPrice = 99_999_999;
    this.sortOption.set('relevance');
    this.shopService.resetFilters();
  }

  addToCart(product: any): void {
    const displayPrice = this.shopService.getDisplayPrice(product);
    const firstSize = product.sizes?.[0]?.size ?? 'M';
    const maxStock = product.sizes?.[0]?.stock ?? 1;

    this.cartService.addItem({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      price: displayPrice,
      image: product.images?.[0],
      size: firstSize,
      category: product.category,
      maxStock,
    });

    this.cartService.openCart();
  }

  previousPage(): void {
    const current = this.shopService.currentPage();
    if (current > 1) this.shopService.goToPage(current - 1);
  }

  nextPage(): void {
    const current = this.shopService.currentPage();
    if (current < this.shopService.totalPages()) this.shopService.goToPage(current + 1);
  }

  goToPage(page: number): void {
    this.shopService.goToPage(page);
  }

  retryLoad(): void {
    this.shopService.loadProducts();
  }

  scrollToCatalog(): void {
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  }

  starsArray(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  }

  readonly fallbackImg = 'https://placehold.co/400x533/f5f5f5/a3a3a3?text=ATHENA';
  readonly heroImage = '/assets/portada.jpg';

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = this.fallbackImg;
  }
}
