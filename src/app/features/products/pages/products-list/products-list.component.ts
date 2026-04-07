import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './products-list.component.html',
  styleUrls: []
})
export class ProductsListComponent implements OnInit {
  // Bindings to signals
  get isLoading() { return this.productService.isLoading; }
  get error() { return this.productService.error; }
  get paginatedProducts() { return this.productService.paginatedProducts; }
  get currentPage() { return this.productService.currentPage; }
  get totalPages() { return this.productService.totalPages; }
  get totalFilteredProducts() { return this.productService.totalFilteredProducts; }

  // Local state
  searchQuery = '';
  selectedCategory = '';
  minPrice = 0;
  maxPrice = Infinity;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    // Load initial products
    this.productService.getAll();
  }

  onSearchChange(query: string): void {
    this.productService.updateFilter('search', query);
  }

  onCategoryChange(category: string): void {
    this.productService.updateFilter('category', category);
  }

  onFilterChange(): void {
    this.productService.updateFilter('minPrice', this.minPrice);
    this.productService.updateFilter('maxPrice', this.maxPrice);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.minPrice = 0;
    this.maxPrice = Infinity;
    this.productService.resetFilters();
  }

  async deleteProduct(id: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await this.productService.delete(id);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }

  getTotalStock(product: any): number {
    return product.sizes?.reduce((total: number, size: any) => total + (size.stock || 0), 0) || 0;
  }

  previousPage(): void {
    this.productService.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.productService.goToPage(this.currentPage() + 1);
  }

  goToPage(page: number): void {
    this.productService.goToPage(page);
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    const startPage = Math.max(1, current - 2);
    const endPage = Math.min(total, current + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
}

