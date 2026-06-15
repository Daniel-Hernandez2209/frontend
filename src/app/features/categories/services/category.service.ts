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
  private adminUrl = `${environment.apiUrl}/api/admin/categories`;

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

  // Load all categories (admin — incluye inactivas)
  async loadCategories(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      const response = await firstValueFrom(
        this.http.get<any>(`${this.adminUrl}`)
      );
      const list = response.data || [];
      this.categories.set(list);
      this.totalCategories.set(list.length);
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Failed to load categories');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get all categories admin
  async getAll(): Promise<Category[]> {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      const response = await firstValueFrom(
        this.http.get<any>(`${this.adminUrl}`)
      );
      const list = response.data || [];
      this.categories.set(list);
      return list;
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Failed to fetch categories');
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get category by slug (for edit form)
  async getById(slug: string): Promise<Category | null> {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      const response = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/${slug}`)
      );
      const cat = response.data || null;
      this.selectedCategory.set(cat);
      return cat;
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Failed to load category');
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
        this.http.post<any>(`${this.adminUrl}`, category)
      );
      const created = response.data || null;
      if (created) {
        this.categories.update(cats => [created, ...cats]);
        this.totalCategories.update(t => t + 1);
      }
      return created;
    } catch (err: any) {
      const msg = err?.error?.message || err?.error?.errors?.join(', ') || 'Failed to create category';
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Update category by slug
  async update(slug: string, category: Partial<Category>): Promise<Category | null> {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      const response = await firstValueFrom(
        this.http.put<any>(`${this.adminUrl}/${slug}`, category)
      );
      const updated = response.data || null;
      if (updated) {
        this.categories.update(cats => cats.map(c => c.slug === slug ? updated : c));
        if (this.selectedCategory()?.slug === slug) this.selectedCategory.set(updated);
      }
      return updated;
    } catch (err: any) {
      const msg = err?.error?.message || 'Failed to update category';
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Delete category by slug
  async delete(slug: string): Promise<boolean> {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      await firstValueFrom(
        this.http.delete<any>(`${this.adminUrl}/${slug}`)
      );
      this.categories.update(cats => cats.filter(c => c.slug !== slug));
      this.totalCategories.update(t => Math.max(0, t - 1));
      if (this.selectedCategory()?.slug === slug) this.selectedCategory.set(null);
      return true;
    } catch (err: any) {
      const msg = err?.error?.message || 'Failed to delete category';
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Toggle active/inactive
  async toggle(slug: string): Promise<void> {
    try {
      await firstValueFrom(this.http.put<any>(`${this.adminUrl}/${slug}/toggle`, {}));
      this.categories.update(cats => cats.map(c =>
        c.slug === slug ? { ...c, isActive: !c.isActive } : c
      ));
    } catch (err: any) {
      throw new Error(err?.error?.message || 'Failed to toggle category');
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
