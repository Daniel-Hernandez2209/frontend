import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './orders-list.component.html',
  styleUrls: []
})
export class OrdersListComponent implements OnInit {
  // Bindings to signals
  get isLoading() { return this.orderService.isLoading; }
  get error() { return this.orderService.error; }
  get paginatedOrders() { return this.orderService.paginatedOrders; }
  get currentPage() { return this.orderService.currentPage; }
  get totalPages() { return this.orderService.totalPages; }
  get totalFilteredOrders() { return this.orderService.totalFilteredOrders; }
  get recentlyUpdatedOrders() { return this.orderService.recentlyUpdatedOrders; }

  // Local state
  searchQuery = '';
  selectedStatus = '';
  minDate = '';
  maxDate = '';
  minAmount = 0;
  maxAmount = Infinity;

  statuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    // Load initial orders
    this.orderService.getAll();
  }

  onSearchChange(query: string): void {
    this.orderService.updateFilter('search', query);
  }

  onStatusChange(status: string): void {
    this.orderService.updateFilter('status', status);
  }

  onDateChange(): void {
    this.orderService.updateFilter('minDate', this.minDate);
    this.orderService.updateFilter('maxDate', this.maxDate);
  }

  onAmountChange(): void {
    this.orderService.updateFilter('minAmount', this.minAmount);
    this.orderService.updateFilter('maxAmount', this.maxAmount);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.minDate = '';
    this.maxDate = '';
    this.minAmount = 0;
    this.maxAmount = Infinity;
    this.orderService.resetFilters();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  isRecentlyUpdated(orderId: string): boolean {
    return this.recentlyUpdatedOrders().includes(orderId);
  }

  getStatusColor(status: string): string {
    return this.orderService.getStatusColor(status);
  }

  getStatusLabel(status: string): string {
    return this.orderService.getStatusLabel(status);
  }

  previousPage(): void {
    this.orderService.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.orderService.goToPage(this.currentPage() + 1);
  }

  goToPage(page: number): void {
    this.orderService.goToPage(page);
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

  getOrderTotal(order: any): number {
    return order.total || order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  }

  getItemCount(order: any): number {
    return order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
  }
}
