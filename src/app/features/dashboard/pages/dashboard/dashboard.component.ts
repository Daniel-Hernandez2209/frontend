import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebSocketService } from '../../../../core/services/websocket.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-bold mb-6">Dashboard</h1>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600 text-sm font-medium">Total Orders</p>
          <p class="text-3xl font-bold mt-2">1,234</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600 text-sm font-medium">Total Revenue</p>
          <p class="text-3xl font-bold mt-2">$45,230</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600 text-sm font-medium">Active Products</p>
          <p class="text-3xl font-bold mt-2">342</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-600 text-sm font-medium">WebSocket Status</p>
          <p class="text-lg font-bold mt-2" [class.text-green-600]="wsConnected()" [class.text-red-600]="!wsConnected()">
            {{ wsConnected() ? 'Connected' : 'Disconnected' }}
          </p>
        </div>
      </div>

      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p class="text-blue-900">
          <strong>Phase 1 Complete!</strong> The admin dashboard is ready. Next phase will include fully functional modules for products, orders, categories, and users management.
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardComponent implements OnInit {
  get wsConnected() {
    return this.wsService.isConnected;
  }

  constructor(private wsService: WebSocketService) {}

  ngOnInit(): void {
    // Test WebSocket connection
    this.wsService.on('connect', () => {
      console.log('Dashboard: WebSocket connected');
    });
  }
}
