import { Injectable, signal, computed, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { firstValueFrom } from 'rxjs';

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  subcategory?: string;
  images: ProductImage[];
  sizes: Array<{ size: string; stock: number }>;
  colors?: Array<{ name: string; hex: string; image?: string }>;
  totalStock: number;
  isActive: boolean;
  isFeatured: boolean;
  rating?: { average: number; count: number };
  material?: string;
  tags?: string[];
  views?: number;
  sales?: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  private apiService = inject(ApiService);

  // ── Estado ──────────────────────────────────────────────────────────
  private products = signal<Product[]>([]);
  private categories = signal<string[]>([]);
  private loading = signal(false);
  private error = signal<string | null>(null);

  private searchQuery = signal('');
  private selectedCategory = signal('');
  private minPrice = signal(0);
  private maxPrice = signal(99_999_999);
  private onlyDiscountedSignal = signal(false);
  public currentPage = signal(1);
  private pageSize = signal(12);

  // ── Computed ────────────────────────────────────────────────────────
  filteredProducts = computed(() => {
    let result = this.products();
    const search = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();
    const min = this.minPrice();
    const max = this.maxPrice();
    const onlyDiscounted = this.onlyDiscountedSignal();

    if (search) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search),
      );
    }

    if (category) {
      result = result.filter((p) => p.category === category);
    }

    if (onlyDiscounted) {
      result = result.filter((p) => !!p.discountPrice);
    }

    result = result.filter((p) => {
      const displayPrice = p.discountPrice ?? p.price;
      return displayPrice >= min && displayPrice <= max;
    });

    return result;
  });

  totalProducts = computed(() => this.filteredProducts().length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalProducts() / this.pageSize())));

  paginatedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredProducts().slice(start, start + this.pageSize());
  });

  // Getters públicos
  isLoading = computed(() => this.loading());
  errorMessage = computed(() => this.error());
  getCategories = computed(() => {
    // Siempre derivar de los productos cargados para garantizar que aparecen todas
    const fromProducts = [
      ...new Set(
        this.products()
          .map((p) => p.category)
          .filter(Boolean),
      ),
    ].sort();
    if (fromProducts.length > 0) return fromProducts;
    // Fallback: usar las categorías de la API si los productos aún no cargaron
    return this.categories().sort();
  });

  constructor() {
    this.loadProducts();
    this.loadCategories();
  }

  // ── MÉTODOS PÚBLICOS ────────────────────────────────────────────────

  async loadProducts(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      // ✅ Ajusta la URL según tu ApiService (con o sin /api prefix)
      const response = await firstValueFrom(
        this.apiService.get<{ products: Product[] }>('/products?limit=100'),
      );
      // ✅ Defensa: verifica que products exista en la respuesta
      const products = response?.products ?? [];
      this.products.set(products.filter((p) => p.isActive));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar productos';
      this.error.set(msg);
      console.error('ShopService.loadProducts:', msg);
    } finally {
      this.loading.set(false);
    }
  }

  async loadCategories(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.apiService.get<{ categories: Array<{ name: string; isActive: boolean }> }>(
          '/categories',
        ),
      );
      const active = (response?.categories ?? []).filter((c) => c.isActive).map((c) => c.name);
      this.categories.set(active);
    } catch (err) {
      console.error('ShopService.loadCategories:', err);
      this.categories.set([]);
    }
  }

  async getProductDetail(slug: string): Promise<Product> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(
        this.apiService.get<{ success: boolean; product: Product }>(`/products/${slug}`),
      );
      if (!response?.product) throw new Error('Producto no encontrado');
      return response.product;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Producto no encontrado';
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Filtros ─────────────────────────────────────────────────────────
  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
  }

  setPriceRange(min: number, max: number): void {
    this.minPrice.set(min);
    this.maxPrice.set(max);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    const total = this.totalPages();
    if (page >= 1 && page <= total) {
      this.currentPage.set(page);
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    let start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    // Ajustar start si end se acercó al límite
    start = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  setOnlyDiscounted(value: boolean): void {
    this.onlyDiscountedSignal.set(value);
    this.currentPage.set(1);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('');
    this.minPrice.set(0);
    this.maxPrice.set(99_999_999);
    this.onlyDiscountedSignal.set(false);
    this.currentPage.set(1);
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  getDisplayPrice(product: Product): number {
    return product.discountPrice ?? product.price;
  }

  getDiscountPercentage(product: Product): number {
    if (!product.discountPrice) return 0;
    return Math.round(((product.price - product.discountPrice) / product.price) * 100);
  }

  hasStock(product: Product): boolean {
    if (typeof product.totalStock === 'number') return product.totalStock > 0;
    return (product.sizes ?? []).reduce((acc, s) => acc + s.stock, 0) > 0;
  }

  getPrimaryImage(product: Product): string {
    if (!product.images?.length) return '';
    const primary = product.images.find((img) => img.isPrimary);
    return (primary ?? product.images[0]).url;
  }

  getHoverImage(product: Product): string {
    if (!product.images || product.images.length < 2) return '';
    const primary = product.images.find((img) => img.isPrimary) ?? product.images[0];
    const other = product.images.find((img) => img !== primary);
    return other?.url ?? '';
  }

  getRating(product: Product): number {
    return product.rating?.average ?? 0;
  }

  getReviewCount(product: Product): number {
    return product.rating?.count ?? 0;
  }

  getAllProducts(): Product[] {
    return this.products();
  }

  getProductById(id: string): Product | undefined {
    return this.products().find((p) => p._id === id);
  }
}
