import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { WebsocketService } from '../../../../core/services/websocket.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'dashboard.component.html',
  styleUrl: 'dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  get isLoading() {
    return this.dashboardService.isLoading;
  }
  get error() {
    return this.dashboardService.error;
  }
  get stats() {
    return this.dashboardService.stats;
  }
  get wsConnected() {
    return this.wsService.isConnected;
  }

  constructor(
    private dashboardService: DashboardService,
    private wsService: WebsocketService,
  ) {}

  ngOnInit(): void {
    this.dashboardService.loadDashboard();
  }

  async refresh(): Promise<void> {
    await this.dashboardService.refresh();
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  /**
   * Format large numbers with K suffix
   */
  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Get status color for order stats
   */
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'text-yellow-600 bg-yellow-50',
      processing: 'text-blue-600 bg-blue-50',
      shipped: 'text-purple-600 bg-purple-50',
      delivered: 'text-green-600 bg-green-50',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  }
}
