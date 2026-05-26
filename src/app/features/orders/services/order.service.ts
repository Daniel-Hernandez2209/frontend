import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Order, ApiResponse, PaginatedResponse } from '../../../shared/types/interfaces';
import { WebsocketService } from '../../../core/services/websocket.service';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly API_URL = `${environment.apiUrl}/api`;

  // Signals (State Management)
  orders = signal<Order[]>([]);
  selectedOrder = signal<Order | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalOrders = signal(0);

  // Filters
  filters = signal({
    search: '',
    status: '', // pending, processing, shipped, delivered, cancelled
    minDate: '',
    maxDate: '',
    minAmount: 0,
    maxAmount: Infinity,
  });

  // Real-time tracking
  recentlyUpdatedOrders = signal<string[]>([]);

  // Computed
  filteredOrders = computed(() => {
    const all = this.orders();
    const f = this.filters();

    return all.filter((order) => {
      let matchesSearch = true;
      if (f.search) {
        matchesSearch =
          order._id.includes(f.search.toUpperCase()) ||
          (order.user?.name?.toLowerCase().includes(f.search.toLowerCase()) ?? false) ||
          (order.user?.email?.toLowerCase().includes(f.search.toLowerCase()) ?? false);
      }

      const matchesStatus = !f.status || order.status === f.status;

      let matchesDate = true;
      if (f.minDate || f.maxDate) {
        const orderDate = new Date(order.createdAt);
        const minDate = f.minDate ? new Date(f.minDate) : null;
        const maxDate = f.maxDate ? new Date(f.maxDate) : null;

        if (minDate && orderDate < minDate) matchesDate = false;
        if (maxDate && orderDate > maxDate) matchesDate = false;
      }

      const orderTotal =
        order.total || order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const matchesAmount = orderTotal >= f.minAmount && orderTotal <= f.maxAmount;

      return matchesSearch && matchesStatus && matchesDate && matchesAmount;
    });
  });

  totalFilteredOrders = computed(() => this.filteredOrders().length);

  paginatedOrders = computed(() => {
    const filtered = this.filteredOrders();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return filtered.slice(start, start + size);
  });

  totalPages = computed(() => Math.ceil(this.totalFilteredOrders() / this.pageSize()));

  // Real-time highlight effect
  private highlightEffect = effect(() => {
    const recentIds = this.recentlyUpdatedOrders();
    if (recentIds.length > 0) {
      // Clear highlight after 3 seconds
      setTimeout(() => {
        this.recentlyUpdatedOrders.set(
          recentIds.filter((id) => {
            const order = this.orders().find((o) => o._id === id);
            return order && Math.random() > 0.5; // Random cleanup for demo
          }),
        );
      }, 3000);
    }
  });

  constructor(
    private http: HttpClient,
    private websocketService: WebsocketService,
  ) {
    this.setupWebSocketListeners();
  }

  /**
   * Setup WebSocket listeners for real-time order updates
   */
  private setupWebSocketListeners(): void {
    // Listen for order updates
    this.websocketService.onOrdersUpdated((updatedOrder: Order) => {
      this.handleOrderUpdate(updatedOrder);
    });
  }

  /**
   * Handle order update from WebSocket
   */
  private handleOrderUpdate(updatedOrder: Order): void {
    const existingIdx = this.orders().findIndex((o) => o._id === updatedOrder._id);

    if (existingIdx >= 0) {
      // Update existing order
      const updated = [...this.orders()];
      updated[existingIdx] = updatedOrder;
      this.orders.set(updated);
    } else {
      // Add new order to list
      this.orders.set([updatedOrder, ...this.orders()]);
    }

    // Mark as recently updated for UI highlighting
    this.recentlyUpdatedOrders.set([updatedOrder._id, ...this.recentlyUpdatedOrders().slice(0, 4)]);

    // Update selected if it's the one being updated
    if (this.selectedOrder()?._id === updatedOrder._id) {
      this.selectedOrder.set(updatedOrder);
    }
  }

  /**
   * Fetch all orders
   */
  async getAll(page: number = 1, limit: number = 10): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.get<PaginatedResponse<Order>>(`${this.API_URL}/orders`, {
          params: { page: page.toString(), limit: limit.toString() },
        }),
      );

      this.orders.set(response.data || []);
      this.totalOrders.set(response.pagination.total);
      this.currentPage.set(page);
    } catch (err: any) {
      const message = err.error?.message || 'Failed to fetch orders';
      this.error.set(message);
      console.error(message, err);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get order by ID
   */
  async getById(id: string): Promise<Order | null> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<Order>>(`${this.API_URL}/orders/${id}`),
      );

      if (response.data) {
        this.selectedOrder.set(response.data);
        return response.data;
      }
      return null;
    } catch (err: any) {
      const message = err.error?.message || 'Order not found';
      this.error.set(message);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Search orders
   */
  async search(query: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.get<{ data: Order[] }>(`${this.API_URL}/orders/search`, { params: { q: query } }),
      );

      this.orders.set(response.data || []);
    } catch (err: any) {
      this.error.set(err.error?.message || 'Search failed');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Update order status (admin only)
   */
  async updateStatus(id: string, status: string): Promise<Order> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.patch<ApiResponse<Order>>(`${this.API_URL}/orders/${id}/status`, { status }),
      );

      if (response.data) {
        this.handleOrderUpdate(response.data);
        return response.data;
      }

      throw new Error('Failed to update order status');
    } catch (err: any) {
      const message = err.error?.message || 'Failed to update order status';
      this.error.set(message);
      throw new Error(message);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Add note to order (admin only)
   */
  async addNote(id: string, note: string): Promise<Order> {
    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<Order>>(`${this.API_URL}/orders/${id}/notes`, { note }),
      );

      if (response.data) {
        this.handleOrderUpdate(response.data);
        return response.data;
      }

      throw new Error('Failed to add note');
    } catch (err: any) {
      throw new Error(err.error?.message || 'Failed to add note');
    }
  }

  /**
   * Get order statistics
   */
  async getStats(): Promise<any> {
    try {
      const response = await firstValueFrom(this.http.get(`${this.API_URL}/orders/admin/stats`));
      return response;
    } catch (err) {
      console.error('Failed to fetch order stats', err);
      return {};
    }
  }

  /**
   * Update filter
   */
  updateFilter(
    key: 'search' | 'status' | 'minDate' | 'maxDate' | 'minAmount' | 'maxAmount',
    value: any,
  ): void {
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
      status: '',
      minDate: '',
      maxDate: '',
      minAmount: 0,
      maxAmount: Infinity,
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
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get status display label
   */
  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      pending: 'Pending',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedOrder.set(null);
  }
}
