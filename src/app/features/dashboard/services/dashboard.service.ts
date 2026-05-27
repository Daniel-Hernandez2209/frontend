import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { WebsocketService } from '../../../core/services/websocket.service';
import { ProductService } from '../../products/services/product.service';
import { OrderService } from '../../orders/services/order.service';
import { UserService } from '../../users/services/user.service';

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  activeProducts: number;
  totalUsers: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  totalCategories: number;
  newUsersThisMonth: number;
  newOrdersThisMonth: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string | string[];
    backgroundColor?: string | string[];
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly API_URL = `${environment.apiUrl}/api`;

  // Signals
  stats = signal<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    activeProducts: 0,
    totalUsers: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    totalCategories: 0,
    newUsersThisMonth: 0,
    newOrdersThisMonth: 0,
  });

  isLoading = signal(false);
  error = signal<string | null>(null);

  // Sales Chart Data
  salesChartData = signal<ChartData>({
    labels: [],
    datasets: [],
  });

  // Orders by Status
  ordersByStatusData = signal<ChartData>({
    labels: [],
    datasets: [],
  });

  // Top Products
  topProductsData = signal<ChartData>({
    labels: [],
    datasets: [],
  });

  // Monthly trends
  monthlyTrendsData = signal<ChartData>({
    labels: [],
    datasets: [],
  });

  constructor(
    private http: HttpClient,
    private wsService: WebsocketService,
    private productService: ProductService,
    private orderService: OrderService,
    private userService: UserService,
  ) {
    // Setup real-time updates
    this._setupWebSocketListeners();

    // Auto-refresh when orders/products/users change
    effect(
      () => {
        this._updateStatsFromServices();
      },
      { allowSignalWrites: true },
    );
  }

  /**
   * Load all dashboard data
   */
  async loadDashboard(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Load orders and products
      await this.orderService.getAll(1, 100);
      await this.productService.getAll(1, 100);
      await this.userService.loadUsers();

      // Load dashboard stats from API
      const [statsResp, salesResp, statusResp, productsResp, trendsResp] = await Promise.all([
        this._fetchStats(),
        this._fetchSalesChart(),
        this._fetchOrdersByStatus(),
        this._fetchTopProducts(),
        this._fetchMonthlyTrends(),
      ]);

      this.stats.set(statsResp);
      this.salesChartData.set(salesResp);
      this.ordersByStatusData.set(statusResp);
      this.topProductsData.set(productsResp);
      this.monthlyTrendsData.set(trendsResp);
    } catch (err: any) {
      const message = err.error?.message || 'Failed to load dashboard';
      this.error.set(message);
      console.error('Dashboard load error:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Setup WebSocket listeners for real-time updates
   */
  private _setupWebSocketListeners(): void {
    // Listen for order updates
    this.wsService.onOrdersUpdated((order: any) => {
      this._updateStatsFromServices();
    });

    // Listen for product updates
    this.wsService.onStocksUpdated((product: any) => {
      this._updateStatsFromServices();
    });

    // Listen for stock updates
    this.wsService.onStocksUpdated((stock: any) => {
      this._updateStatsFromServices();
    });
  }

  /**
   * Update stats from loaded services
   */
  private _updateStatsFromServices(): void {
    const orders = this.orderService.orders();
    const products = this.productService.products();
    const users = this.userService.users();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate derived stats
    const totalRevenue = orders.reduce((sum, order: any) => {
      return (
        sum +
        (order.total ||
          order.items.reduce((s: number, item: any) => s + item.price * item.quantity, 0))
      );
    }, 0);

    const ordersByStatus = {
      pending: orders.filter((o: any) => o.status === 'pending').length,
      processing: orders.filter((o: any) => o.status === 'processing').length,
      shipped: orders.filter((o: any) => o.status === 'shipped').length,
      delivered: orders.filter((o: any) => o.status === 'delivered').length,
    };

    const newUsersThisMonth = users.filter(
      (u: any) => new Date(u.createdAt) >= startOfMonth,
    ).length;
    const newOrdersThisMonth = orders.filter(
      (o: any) => new Date(o.createdAt) >= startOfMonth,
    ).length;

    this.stats.update((s) => ({
      ...s,
      totalOrders: orders.length,
      totalRevenue,
      activeProducts: products.filter((p: any) => p.isActive).length,
      totalUsers: users.length,
      pendingOrders: ordersByStatus.pending,
      processingOrders: ordersByStatus.processing,
      shippedOrders: ordersByStatus.shipped,
      deliveredOrders: ordersByStatus.delivered,
      newUsersThisMonth,
      newOrdersThisMonth,
    }));

    // Update order status chart
    this.ordersByStatusData.set({
      labels: ['Pending', 'Processing', 'Shipped', 'Delivered'],
      datasets: [
        {
          label: 'Orders by Status',
          data: [
            ordersByStatus.pending,
            ordersByStatus.processing,
            ordersByStatus.shipped,
            ordersByStatus.delivered,
          ],
          backgroundColor: [
            'rgba(234, 179, 8, 0.6)', // yellow
            'rgba(59, 130, 246, 0.6)', // blue
            'rgba(168, 85, 247, 0.6)', // purple
            'rgba(34, 197, 94, 0.6)', // green
          ],
        },
      ],
    });
  }

  /**
   * Fetch stats from API
   */
  private async _fetchStats(): Promise<DashboardStats> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ data: DashboardStats }>(`${this.API_URL}/dashboard/stats`),
      );
      return response.data || this.stats();
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      return this.stats();
    }
  }

  /**
   * Fetch sales chart data
   */
  private async _fetchSalesChart(): Promise<ChartData> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ data: ChartData }>(`${this.API_URL}/dashboard/sales-chart`),
      );
      return response.data || this._generateSalesChartFallback();
    } catch (err) {
      return this._generateSalesChartFallback();
    }
  }

  /**
   * Fetch orders by status
   */
  private async _fetchOrdersByStatus(): Promise<ChartData> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ data: ChartData }>(`${this.API_URL}/dashboard/orders-status`),
      );
      return response.data || { labels: [], datasets: [] };
    } catch (err) {
      return { labels: [], datasets: [] };
    }
  }

  /**
   * Fetch top products
   */
  private async _fetchTopProducts(): Promise<ChartData> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ data: ChartData }>(`${this.API_URL}/dashboard/top-products`),
      );
      return response.data || this._generateTopProductsFallback();
    } catch (err) {
      return this._generateTopProductsFallback();
    }
  }

  /**
   * Fetch monthly trends
   */
  private async _fetchMonthlyTrends(): Promise<ChartData> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ data: ChartData }>(`${this.API_URL}/dashboard/monthly-trends`),
      );
      return response.data || this._generateMonthlyTrendsFallback();
    } catch (err) {
      return this._generateMonthlyTrendsFallback();
    }
  }

  /**
   * Fallback data generators (if API fails)
   */
  private _generateSalesChartFallback(): ChartData {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return {
      labels: months,
      datasets: [
        {
          label: 'Sales ($)',
          data: [12000, 19000, 13000, 15000, 10000, 16000],
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        },
      ],
    };
  }

  private _generateTopProductsFallback(): ChartData {
    return {
      labels: ['Classic T-Shirt', 'Denim Jacket', 'Sneakers', 'Hoodie', 'Jeans'],
      datasets: [
        {
          label: 'Sales',
          data: [120, 95, 87, 65, 54],
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
        },
      ],
    };
  }

  private _generateMonthlyTrendsFallback(): ChartData {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return {
      labels: months,
      datasets: [
        {
          label: 'Revenue',
          data: [65, 59, 80, 81, 56, 55],
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
        },
        {
          label: 'Orders',
          data: [28, 48, 40, 19, 86, 27],
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        },
      ],
    };
  }

  /**
   * Refresh dashboard data
   */
  async refresh(): Promise<void> {
    await this.loadDashboard();
  }
}
