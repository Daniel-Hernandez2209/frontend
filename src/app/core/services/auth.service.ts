// src/app/core/services/auth.service.ts
import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { AppStore } from '../store/app.store';

// ==================== TIPOS ====================
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'vendor' | 'customer';
  avatar?: string;
  createdAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// ==================== SERVICE ====================
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  private appStore = inject(AppStore);

  // ✨ SIGNALS - ESTADO REACTIVO
  currentUser = signal<User | null>(null);
  isAuthenticated = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // 🧮 COMPUTED - VALORES DERIVADOS AUTOMÁTICOS
  userRole = computed(() => this.currentUser()?.role ?? 'guest');
  isAdmin = computed(() => this.userRole() === 'admin');
  displayName = computed(() => this.currentUser()?.name ?? 'Invitado');

  constructor() {
    // 🔔 EFFECT - SINCRONIZAR CON SESSIONSTORAGE AUTOMÁTICAMENTE
    effect(() => {
      const user = this.currentUser();
      this.appStore.setCurrentUser(user);
      if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        console.log('✅ Usuario guardado en sessionStorage');
      } else {
        sessionStorage.removeItem('currentUser');
        console.log('🗑️ Usuario removido de sessionStorage');
      }
    });

    // Cargar usuario que ya estaba logueado
    this.loadStoredUser();
  }

  /**
   * Login - RxJS OK aquí (para formularios)
   */
  login(credentials: LoginRequest): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.api
      .post<AuthResponse>('/auth/login', credentials)
      .toPromise()
      .then((response) => {
        if (!response) {
          throw new Error('No response from server');
        }

        // Guardar datos con signals
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);

        // Guardar tokens en sessionStorage
        sessionStorage.setItem('access_token', response.access_token);
        sessionStorage.setItem('refresh_token', response.refresh_token);

        console.log('✅ Login exitoso');

        // Navegar a dashboard
        return this.router.navigate(['/dashboard']);
      })
      .catch((err: any) => {
        this.error.set(err.message || 'Error en login');
        throw err;
      })
      .finally(() => {
        this.isLoading.set(false);
      });
  }

  /**
   * Logout
   */
  logout(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.error.set(null);
    sessionStorage.clear();
    this.router.navigate(['/auth/login']);
    console.log('✅ Logout exitoso');
  }

  /**
   * Refresh token automático
   */
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = sessionStorage.getItem('refresh_token');
      if (!refreshToken) {
        console.warn('❌ No hay refresh token');
        return false;
      }

      const response = await this.api
        .post<{ access_token: string }>('/auth/refresh', {
          refreshToken,
        })
        .toPromise();

      if (response) {
        sessionStorage.setItem('access_token', response.access_token);
        console.log('✅ Token refrescado');
        return true;
      }
      return false;
    } catch (err) {
      console.error('❌ Error refrescando token:', err);
      this.logout();
      return false;
    }
  }

  /**
   * Obtener token actual
   */
  getAccessToken(): string | null {
    return sessionStorage.getItem('access_token');
  }

  /**
   * Cargar usuario desde sessionStorage (al iniciar app)
   */
  private loadStoredUser(): void {
    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
        console.log('✅ Usuario cargado desde storage:', user.name);
      } catch (err) {
        console.error('❌ Error cargando usuario:', err);
        sessionStorage.removeItem('currentUser');
      }
    }
  }
}
