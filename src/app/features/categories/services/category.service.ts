import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Category, ApiResponse, PaginatedResponse } from '../../../shared/types/interfaces';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/api/categories`;

  // Signals for state management
  categories = signal<Category[]>([]);
  selectedCategory = signal<Category | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  currentPage = signal(1);
  pageSize = signal(10);
  totalCategories = signal(0);

  // Filter state
  filters = signal({
    search: '',
    isActive: null as boolean | null
  });

  // Computed signals
  filteredCategories = computed(() => {
    const allCategories = this.categories();
    const { search, isActive } = this.filters();

    return allCategories.filter(category => {
      const matchesSearch = !search || 
        category.name.toLowerCase().includes(search.toLowerCase()) ||
        (category.slug && category.slug.toLowerCase().includes(search.toLowerCase()));

      const matchesActive = isActive === null || category.isActive === isActive;

      return matchesSearch && matchesActive;
    });
  });

  paginatedCategories = computed(() => {
    const filtered = this.filteredCategories();
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return filtered.slice(start, end);
  });

  totalPages = computed(() => {
    const total = this.filteredCategories().length;
    return Math.ceil(total / this.pageSize());
  });

  totalFilteredCategories = computed(() => {
    return this.filteredCategories().length;
  });

  constructor(private http: HttpClient) {
    this.loadCategories();
  }

  // Load all categories
  async loadCategories(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      const response = await firstValueFrom(
        this.http.get<PaginatedResponse<Category>>(
          `${this.apiUrl}?page=${this.currentPage()}&limit=${this.pageSize()}`
        )
      );

      this.categories.set(response.data || []);
      this.totalCategories.set(response.pagination?.total || 0);
    } catch (err: any) {
      const errorMsg = err?.error?.message || 'Failed to load categories';
      this.error.set(errorMsg);
      console.error('Error loading categories:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get all categories (no pagination)
  async getAll(): Promise<Category[]> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      const response = await firstValueFrom(
        this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}`)
      );

      this.categories.set(response.data || []);
      return response.data || [];
    } catch (err: any) {
      const errorMsg = err?.error?.message || 'Failed to fetch categories';
      this.error.set(errorMsg);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get category by ID
  async getById(id: string): Promise<Category | null> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      const response = await firstValueFrom(
        this.http.get<ApiResponse<Category>>(`${this.apiUrl}/${id}`)
      );

      this.selectedCategory.set(response.data || null);
      return response.data || null;
    } catch (err: any) {
      const errorMsg = err?.error?.message || 'Failed to load category';
      this.error.set(errorMsg);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Create category
  async create(category: Partial<Category>): Promise<Category | null> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      const response = await firstValueFrom(
        this.http.post<ApiResponse<Category>>(`${this.apiUrl}`, category)
      );

      if (response.data) {
        this.categories.update(cats => [...cats, response.data!]);
        this.totalCategories.update(total => total + 1);
      }

      return response.data || null;
    } catch (err: any) {
      const errorMsg = err?.error?.message || 'Failed to create category';
      this.error.set(errorMsg);
      throw new Error(errorMsg);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Update category
  async update(id: string, category: Partial<Category>): Promise<Category | null> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      const response = await firstValueFrom(
        this.http.put<ApiResponse<Category>>(`${this.apiUrl}/${id}`, category)
      );

      if (response.data) {
        this.categories.update(cats =>
          cats.map(cat => cat._id === id ? response.data! : cat)
        );

        if (this.selectedCategory()?._id === id) {
          this.selectedCategory.set(response.data);
        }
      }

      return response.data || null;
    } catch (err: any) {
      const errorMsg = err?.error?.message || 'Failed to update category';
      this.error.set(errorMsg);
      throw new Error(errorMsg);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Delete category
  async delete(id: string): Promise<boolean> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      await firstValueFrom(
        this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      );

      this.categories.update(cats => cats.filter(cat => cat._id !== id));
      this.totalCategories.update(total => total - 1);

      if (this.selectedCategory()?._id === id) {
        this.selectedCategory.set(null);
      }

      return true;
    } catch (err: any) {
      const errorMsg = err?.error?.message || 'Failed to delete category';
      this.error.set(errorMsg);
      throw new Error(errorMsg);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Search categories
  async search(query: string): Promise<Category[]> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      const response = await firstValueFrom(
        this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}/search`, {
          params: { q: query }
        })
      );

      return response.data || [];
    } catch (err: any) {
      const errorMsg = err?.error?.message || 'Search failed';
      this.error.set(errorMsg);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get categories for dropdown
  async getForDropdown(): Promise<Category[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}?isActive=true`)
      );
      return response.data || [];
    } catch (err) {
      return [];
    }
  }

  // Update filters
  updateFilter(filterKey: string, value: any): void {
    this.filters.update(f => ({
      ...f,
      [filterKey as keyof typeof f]: value
    }));
    this.currentPage.set(1); // Reset to first page
  }

  // Reset filters
  resetFilters(): void {
    this.filters.set({ search: '', isActive: null });
    this.currentPage.set(1);
  }

  // Pagination
  goToPage(page: number): void {
    const maxPage = this.totalPages();
    if (page >= 1 && page <= maxPage) {
      this.currentPage.set(page);
    }
  }

  getPageNumbers(): number[] {
    const totalPages = this.totalPages();
    const currentPage = this.currentPage();
    const adjacent = 2;
    const pages: number[] = [];

    for (let i = Math.max(1, currentPage - adjacent); i <= Math.min(totalPages, currentPage + adjacent); i++) {
      pages.push(i);
    }

    return pages;
  }

  // UI helpers
  getStatusColor(isActive: boolean): string {
    return isActive 
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }
}
