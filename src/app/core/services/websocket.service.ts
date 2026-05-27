import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private socket: Socket | null = null;
  private connected$ = new BehaviorSubject<boolean>(false);

  constructor(private authService: AuthService) {}

  /**
   * Conecta al servidor WebSocket
   */
  connect(): void {
    if (this.socket?.connected) return;

    const token = this.authService.getAccessToken();
    this.socket = io(environment.wsUrl, {
      auth: {
        token: token || undefined,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
      this.connected$.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
      this.connected$.next(false);
    });

    this.socket.on('error', (error: any) => {
      console.error('❌ WebSocket error:', error);
    });
  }

  /**
   * Desconecta del servidor WebSocket
   */
  disconnect(): void {
    this.socket?.disconnect();
    this.connected$.next(false);
  }

  /**
   * Escucha eventos del servidor
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.socket) {
      console.warn('WebSocket no conectado');
      return;
    }
    this.socket.on(event, callback);
  }

  /**
   * Emite un evento al servidor
   */
  emit(event: string, data?: any): void {
    if (!this.socket) {
      console.warn('WebSocket no conectado');
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * Escucha eventos de órdenes en tiempo real
   */
  onOrdersUpdated(callback: (order: any) => void): void {
    this.on('orders:updated', callback);
  }

  /**
   * Escucha actualizaciones de inventario
   */
  onStocksUpdated(callback: (product: any) => void): void {
    this.on('stocks:updated', callback);
  }

  /**
   * Escucha estadísticas del dashboard
   */
  onDashboardStats(callback: (stats: any) => void): void {
    this.on('dashboard:stats:updated', callback);
  }

  /**
   * Solicita estadísticas frescas
   */
  requestStats(): void {
    this.emit('request:stats');
  }

  /**
   * Verifica si está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Observable de estado de conexión
   */
  getConnectionStatus() {
    return this.connected$.asObservable();
  }
}
