import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Product, ApiResponse, PaginatedResponse } from '../../../shared/types/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly API_URL = `${environment.apiUrl}/api`;

  // Signals (State Management)
  products = signal<Product[]>([]);
  selectedProduct = signal<Product | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalProducts = signal(0);

  // Filters
  filters = signal({
    search: '',
    category: '',
    minPrice: 0,
    maxPrice: Infinity,
    isActive: true
  });

  // Computed
  filteredProducts = computed(() => {
    const all = this.products();
    const f = this.filters();

    return all.filter(p => {
      const matchesSearch = !f.search || 
        p.name.toLowerCase().includes(f.search.toLowerCase()) ||
        p.sku.toLowerCase().includes(f.search.toLowerCase());
      
      const matchesCategory = !f.category || p.category === f.category;
      const matchesPrice = (p.discountPrice || p.price) >= f.minPrice && 
                          (p.discountPrice || p.price) <= f.maxPrice;
      const matchesActive = p.isActive === f.isActive;

      return matchesSearch && matchesCategory && matchesPrice && matchesActive;
    });
  });

  totalFilteredProducts = computed(() => this.filteredProducts().length);

  paginatedProducts = computed(() => {
    const filtered = this.filteredProducts();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return filtered.slice(start, start + size);
  });

  totalPages = computed(() => 
    Math.ceil(this.totalFilteredProducts() / this.pageSize())
  );

  constructor(private http: HttpClient) {}

  /**
   * Fetch all products
   */
  async getAll(page: number = 1, limit: number = 10): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.get<PaginatedResponse<Product>>(
          `${this.API_URL}/products`,
          { params: { page: page.toString(), limit: limit.toString() } }
        )
      );

      this.products.set(response.data || []);
      this.totalProducts.set(response.pagination.total);
      this.currentPage.set(page);
    } catch (err: any) {
      const message = err.error?.message || 'Failed to fetch products';
      this.error.set(message);
      console.error(message, err);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get product by slug
   */
  async getBySlug(slug: string): Promise<Product | null> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<Product>>(
          `${this.API_URL}/products/${slug}`
        )
      );

      if (response.data) {
        this.selectedProduct.set(response.data);
        return response.data;
      }
      return null;
    } catch (err: any) {
      const message = err.error?.message || 'Product not found';
      this.error.set(message);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get featured products
   */
  async getFeatured(): Promise<Product[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ data: Product[] }>(`${this.API_URL}/products/featured`)
      );
      return response.data || [];
    } catch (err) {
      console.error('Failed to fetch featured products', err);
      return [];
    }
  }

  /**
   * Search products
   */
  async search(query: string, filters?: any): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const params = {
        q: query,
        ...filters
      };

      const response = await firstValueFrom(
        this.http.get<{ data: Product[] }>(
          `${this.API_URL}/products/search`,
          { params }
        )
      );

      this.products.set(response.data || []);
    } catch (err: any) {
      this.error.set(err.error?.message || 'Search failed');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Create product (admin)
   */
  async create(data: Partial<Product>): Promise<Product> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<Product>>(`${this.API_URL}/products`, data)
      );

      if (response.data) {
        // Add to products list
        this.products.set([...this.products(), response.data]);
        return response.data;
      }

      throw new Error('Failed to create product');
    } catch (err: any) {
      const message = err.error?.message || 'Failed to create product';
      this.error.set(message);
      throw new Error(message);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Update product (admin)
   */
  async update(id: string, data: Partial<Product>): Promise<Product> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.put<ApiResponse<Product>>(`${this.API_URL}/products/${id}`, data)
      );

      if (response.data) {
        // Update in products list
        const updated = this.products().map(p => p._id === id ? response.data : p);
        this.products.set(updated);

        // Update selected product if it's the one being edited
        if (this.selectedProduct()?._id === id) {
          this.selectedProduct.set(response.data);
        }

        return response.data;
      }

      throw new Error('Failed to update product');
    } catch (err: any) {
      const message = err.error?.message || 'Failed to update product';
      this.error.set(message);
      throw new Error(message);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Delete product (admin)
   */
  async delete(id: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await firstValueFrom(
        this.http.delete(`${this.API_URL}/products/${id}`)
      );

      // Remove from products list
      const updated = this.products().filter(p => p._id !== id);
      this.products.set(updated);

      // Clear selected if it was deleted
      if (this.selectedProduct()?._id === id) {
        this.selectedProduct.set(null);
      }
    } catch (err: any) {
      const message = err.error?.message || 'Failed to delete product';
      this.error.set(message);
      throw new Error(message);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Update product stock for specific size (admin)
   */
  async updateStock(id: string, size: string, stock: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(`${this.API_URL}/products/${id}/stock`, { size, stock })
      );

      // Refresh product
      await this.getBySlug(id);
    } catch (err: any) {
      throw new Error(err.error?.message || 'Failed to update stock');
    }
  }

  /**
   * Upload product images
   */
  async uploadImages(files: File[]): Promise<string[]> {
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      const response = await firstValueFrom(
        this.http.post<{ urls: string[] }>(
          `${this.API_URL}/upload/products`,
          formData
        )
      );

      return response.urls || [];
    } catch (err: any) {
      throw new Error(err.error?.message || 'Failed to upload images');
    }
  }

  /**
   * Get product analytics
   */
  async getAnalytics(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.API_URL}/products/admin/analytics/stats`)
      );
      return response;
    } catch (err) {
      console.error('Failed to fetch analytics', err);
      return {};
    }
  }

  /**
   * Update filter
   */
  updateFilter(key: 'search' | 'category' | 'minPrice' | 'maxPrice' | 'isActive', value: any): void {
    const current = this.filters();
    this.filters.set({ ...current, [key]: value });
    this.currentPage.set(1); // Reset to first page
  }

  /**
   * Reset filters
   */
  resetFilters(): void {
    this.filters.set({
      search: '',
      category: '',
      minPrice: 0,
      maxPrice: Infinity,
      isActive: true
    });
    this.currentPage.set(1);
  }

  /**
   * Go to page
   */
  goToPage(page: number): void {
    const maxPage = this.totalPages();
    if (page >= 1 && page <= maxPage) {
      this.currentPage.set(page);
    }
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedProduct.set(null);
  }
}
