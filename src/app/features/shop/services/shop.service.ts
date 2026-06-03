import { Injectable, signal, computed, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { firstValueFrom } from 'rxjs';

export interface Product {
  _id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  images: string[];
  sizes: Array<{ size: string; stock: number }>;
  totalStock: number;
  isActive: boolean;
  isFeatured: boolean;
  rating?: number; // ✨ NUEVO - Calificación del producto (0-5)
  reviews?: number; // ✨ NUEVO - Cantidad de reseñas
  createdAt: string;
  updatedAt: string;
}

export interface ShopFilters {
  search: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  page: number;
  limit: number;
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

  // Filtros
  private searchQuery = signal('');
  private selectedCategory = signal('');
  private minPrice = signal(0);
  private maxPrice = signal(10000);
  public currentPage = signal(1);
  private pageSize = signal(12);

  // ── Computed (productos filtrados) ──────────────────────────────────
  filteredProducts = computed(() => {
    let result = this.products();
    const search = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();
    const min = this.minPrice();
    const max = this.maxPrice();

    // Filtrar por búsqueda
    if (search) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search),
      );
    }

    // Filtrar por categoría
    if (category) {
      result = result.filter((p) => p.category === category);
    }

    // Filtrar por precio
    result = result.filter(
      (p) => (p.discountPrice || p.price) >= min && (p.discountPrice || p.price) <= max,
    );

    return result;
  });

  totalProducts = computed(() => this.filteredProducts().length);
  totalPages = computed(() => Math.ceil(this.totalProducts() / this.pageSize()));

  paginatedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredProducts().slice(start, end);
  });

  // ── Getters para estado ─────────────────────────────────────────────
  isLoading = computed(() => this.loading());
  errorMessage = computed(() => this.error());
  getCategories = computed(() => this.categories());

  constructor() {
    this.loadProducts();
    this.loadCategories();
  }

  // ── MÉTODOS PÚBLICOS ────────────────────────────────────────────────

  /**
   * Cargar todos los productos públicos
   */
  async loadProducts(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(
        this.apiService.get<{ products: Product[] }>('/products'),
      );
      this.products.set(response.products.filter((p) => p.isActive));
      this.error.set(null);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to load products';
      this.error.set(errorMessage);
      console.error('Error loading products:', errorMessage);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Cargar categorías
   */
  async loadCategories(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.apiService.get<{ categories: any[] }>('/categories'),
      );
      const activeCategories = response.categories.filter((c) => c.isActive).map((c) => c.name);
      this.categories.set(activeCategories);
    } catch (err) {
      // Silenciosamente fallar si hay error
      console.error('Failed to load categories:', err);
      this.categories.set([]);
    }
  }

  /**
   * Obtener detalle de un producto
   */
  async getProductDetail(id: string): Promise<Product> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const product = await firstValueFrom(this.apiService.get<Product>(`/products/${id}`));
      return product;
    } catch (err: any) {
      const errorMessage = err?.message || 'Product not found';
      this.error.set(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Buscar productos
   */
  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  /**
   * Filtrar por categoría
   */
  setCategory(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
  }

  /**
   * Establecer rango de precios
   */
  setPriceRange(min: number, max: number): void {
    this.minPrice.set(min);
    this.maxPrice.set(max);
    this.currentPage.set(1);
  }

  /**
   * Ir a página específica
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  /**
   * Obtener números de página para paginación
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages();
    const current = this.currentPage();

    // Mostrar siempre un rango de 5 páginas
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Resetear filtros
   */
  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('');
    this.minPrice.set(0);
    this.maxPrice.set(10000);
    this.currentPage.set(1);
  }

  /**
   * Obtener precio con descuento
   */
  getDisplayPrice(product: Product): number {
    return product.discountPrice || product.price;
  }

  /**
   * Calcular porcentaje de descuento
   */
  getDiscountPercentage(product: Product): number {
    if (!product.discountPrice) return 0;
    return Math.round(((product.price - product.discountPrice) / product.price) * 100);
  }

  /**
   * Verificar si hay stock disponible
   */
  hasStock(product: Product): boolean {
    return product.totalStock > 0;
  }

  /**
   * Obtener calificación promedio del producto
   */
  getRating(product: Product): number {
    return product.rating || 0;
  }

  /**
   * Obtener cantidad de reseñas del producto
   */
  getReviewCount(product: Product): number {
    return product.reviews || 0;
  }

  /**
   * Obtener todos los productos (sin filtrar)
   */
  getAllProducts(): Product[] {
    return this.products();
  }

  /**
   * Buscar un producto por ID
   */
  getProductById(id: string): Product | undefined {
    return this.products().find((p) => p._id === id);
  }
}
