import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  isConnected = signal(false);

  constructor() {
    this.initialize();
  }

  /**
   * Initialize WebSocket connection
   */
  private initialize(): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.apiUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
      // Include JWT token in handshake
      auth: (cb) => {
        const token = sessionStorage.getItem('access_token');
        cb({ token });
      }
    });

    this.setupEventListeners();
  }

  /**
   * Setup global socket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.isConnected.set(true);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.isConnected.set(false);
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });
  }

  /**
   * Listen to real-time order updates
   */
  onOrdersUpdated(callback: (data: any) => void): void {
    this.socket?.on('orders:updated', callback);
  }

  /**
   * Listen to stock updates
   */
  onStocksUpdated(callback: (data: any) => void): void {
    this.socket?.on('stocks:updated', callback);
  }

  /**
   * Listen to product updates
   */
  onProductsUpdated(callback: (data: any) => void): void {
    this.socket?.on('products:updated', callback);
  }

  /**
   * Listen to user created
   */
  onUserCreated(callback: (data: any) => void): void {
    this.socket?.on('users:created', callback);
  }

  /**
   * Listen to dashboard stats updates
   */
  onDashboardStatsUpdated(callback: (data: any) => void): void {
    this.socket?.on('dashboard:stats:updated', callback);
  }

  /**
   * Listen to custom event
   */
  on<T = any>(event: string, callback: (data: T) => void): void {
    this.socket?.on(event, callback);
  }

  /**
   * Emit event to server
   */
  emit<T = any>(event: string, data?: T): void {
    this.socket?.emit(event, data);
  }

  /**
   * Unsubscribe from event
   */
  off(event: string): void {
    this.socket?.off(event);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket?.connected) {
      this.socket.disconnect();
    }
  }

  /**
   * Reconnect WebSocket
   */
  reconnect(): void {
    if (!this.socket?.connected) {
      this.socket?.connect();
    }
  }

  /**
   * Get socket instance (if needed for advanced operations)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}
