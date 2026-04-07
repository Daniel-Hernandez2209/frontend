import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './categories-list.component.html',
  styleUrls: []
})
export class CategoriesListComponent implements OnInit {
  searchQuery = '';
  selectedStatus: boolean | null = null;
  statusOptions = [
    { label: 'All', value: null },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
  ];

  // Getter signals from service
  get categories() { return this.categoryService.categories; }
  get isLoading() { return this.categoryService.isLoading; }
  get error() { return this.categoryService.error; }
  get paginatedCategories() { return this.categoryService.paginatedCategories; }
  get currentPage() { return this.categoryService.currentPage; }
  get totalPages() { return this.categoryService.totalPages; }
  get totalFilteredCategories() { return this.categoryService.totalFilteredCategories; }

  constructor(
    public categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.categoryService.loadCategories();
  }

  onSearchChange(): void {
    this.categoryService.updateFilter('search', this.searchQuery);
  }

  onStatusChange(): void {
    this.categoryService.updateFilter('isActive', this.selectedStatus);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = null;
    this.categoryService.resetFilters();
  }

  deleteCategory(id: string): void {
    if (confirm('¿Está seguro que desea eliminar esta categoría?')) {
      this.categoryService.delete(id).catch(err => {
        alert('Error al eliminar: ' + err.message);
      });
    }
  }

  editCategory(id: string): void {
    this.router.navigate(['/admin/categories', id, 'edit']);
  }

  // Pagination
  previousPage(): void {
    if (this.currentPage() > 1) {
      this.categoryService.goToPage(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.categoryService.goToPage(this.currentPage() + 1);
    }
  }

  goToPage(page: number): void {
    this.categoryService.goToPage(page);
  }

  getPageNumbers(): number[] {
    return this.categoryService.getPageNumbers();
  }

  // UI helpers
  getStatusColor(isActive: boolean): string {
    return this.categoryService.getStatusColor(isActive);
  }

  getStatusLabel(isActive: boolean): string {
    return this.categoryService.getStatusLabel(isActive);
  }

  formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }
}
