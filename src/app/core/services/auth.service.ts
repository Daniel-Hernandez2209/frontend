import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { AppStore } from '@core/store/app.store';
import { environment } from '@environments/environment';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  isVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: {
    accessToken: string;
    refreshToken: string;
  };
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private http = inject(HttpClient); // ← agregado para refresh directo
  private router = inject(Router);
  private appStore = inject(AppStore);

  currentUser = signal<User | null>(null);
  isAuthenticated = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);

  userRole = computed(() => this.currentUser()?.role ?? 'guest');
  isAdmin = computed(() => this.userRole() === 'admin');
  displayName = computed(() => {
    const u = this.currentUser();
    if (!u) return 'Invitado';
    return `${u.firstName} ${u.lastName}`.trim();
  });

  constructor() {
    effect(() => {
      const user = this.currentUser();
      this.appStore.setCurrentUser(user);
      if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
      } else {
        sessionStorage.removeItem('currentUser');
      }
    });

    this.loadStoredUser();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(
      tap((response) => {
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
        sessionStorage.setItem('access_token', response.token.accessToken);
        sessionStorage.setItem('refresh_token', response.token.refreshToken);
        this.router.navigate(['/admin/dashboard']);
      }),
      catchError((err) => {
        this.error.set(err.error?.message || 'Error en login');
        this.isLoading.set(false);
        throw err;
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  logout(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.error.set(null);
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = sessionStorage.getItem('refresh_token');
      if (!refreshToken) {
        console.warn('❌ No hay refresh token');
        return false;
      }

      const response = await firstValueFrom(
        this.http.post<{ token: { accessToken: string } }>(
          `${environment.apiUrl}/api/auth/refresh-token`,
          { refreshToken },
          { headers: { Authorization: `Bearer ${refreshToken}` } },
        ),
      );

      if (response?.token?.accessToken) {
        sessionStorage.setItem('access_token', response.token.accessToken); // ← cambio
        return true;
      }
      return false;
    } catch (err) {
      console.error('❌ Error refrescando token:', err);
      this.logout();
      return false;
    }
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem('access_token');
  }

  private loadStoredUser(): void {
    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
        console.log('✅ Usuario cargado desde storage:', user.firstName, user.lastName);
      } catch (err) {
        console.error('❌ Error cargando usuario:', err);
        sessionStorage.removeItem('currentUser');
      }
    }
  }
}
