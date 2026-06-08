import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { Category } from '@shared/types/interfaces';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './categories-list.component.html',
  styleUrls: [],
})
export class CategoriesListComponent implements OnInit {
  private categoryService = inject(CategoryService);

  // ── Estado (Signals) ────────────────────────────────────────────
  categories = signal<Category[]>([]);
  private loading = signal(false);
  private error = signal<string | null>(null);

  // Filtros (Signals)
  searchQuery = signal('');
  selectedStatus = signal<string>('all');
  currentPage = signal(1);
  private pageSize = signal(10);

  // Status options
  statusOptions = [
    { label: 'All Categories', value: 'all' },
    { label: 'Active', value: 'true' },
    { label: 'Inactive', value: 'false' },
  ];

  // ── Computed ────────────────────────────────────────────────────
  filteredCategories = computed(() => {
    let result = this.categories();
    const search = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();

    if (search) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.slug.toLowerCase().includes(search) ||
          (c.description?.toLowerCase().includes(search) ?? false),
      );
    }

    if (status !== 'all') {
      const isActive = status === 'true';
      result = result.filter((c) => c.isActive === isActive);
    }

    return result;
  });

  totalFilteredCategories = computed(() => this.filteredCategories().length);
  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalFilteredCategories() / this.pageSize())),
  );

  paginatedCategories = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredCategories().slice(start, start + this.pageSize());
  });

  isLoading = computed(() => this.loading());
  errorMsg = computed(() => this.error());

  ngOnInit(): void {
    this.loadCategories();
  }

  // ── CARGA ───────────────────────────────────────────────────────

  async loadCategories(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const categories = await this.categoryService.getAll();
      this.categories.set(categories ?? []);
      this.currentPage.set(1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar categorías';
      this.error.set(msg);
      this.categories.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  onStatusSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedStatus.set(value);
    this.currentPage.set(1);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.currentPage.set(1);
  }

  // ── CRUD ────────────────────────────────────────────────────────

  async deleteCategory(id: string): Promise<void> {
    const category = this.categories().find((c) => c._id === id);
    if (!category) return;

    if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) return;

    this.loading.set(true);
    try {
      const result = await this.categoryService.delete(id);
      console.log('Category deleted:', result);
      this.categories.update((cats) => cats.filter((c) => c._id !== id));
      this.currentPage.set(1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar';
      this.error.set(msg);
    } finally {
      this.loading.set(false);
    }
  }

  // ── PAGINACIÓN ─────────────────────────────────────────────────

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) this.goToPage(this.currentPage() + 1);
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    let start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    start = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  // ── HELPERS ─────────────────────────────────────────────────────

  formatDate(dateString: string | Date): string {
    try {
      return new Date(dateString).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  }
}
