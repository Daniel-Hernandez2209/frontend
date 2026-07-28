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

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  accessToken?: string;
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
  accessToken = signal<string | null>(null);

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
        if (response.accessToken) {
          this.accessToken.set(response.accessToken);
          sessionStorage.setItem('accessToken', response.accessToken);
        }
        const destination = response.user.role === 'admin' ? '/admin/dashboard' : '/store';
        this.router.navigate([destination]);
      }),
      catchError((err) => {
        this.error.set(err.error?.message || 'Error en login');
        this.isLoading.set(false);
        throw err;
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.api.post<AuthResponse>('/auth/register', data).pipe(
      catchError((err) => {
        this.error.set(err.error?.message || 'Error al registrarse');
        this.isLoading.set(false);
        throw err;
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  forgotPassword(email: string): Observable<{ success: boolean; message: string }> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.api.post<{ success: boolean; message: string }>('/auth/forgot-password', { email }).pipe(
      catchError((err) => {
        this.error.set(err.error?.message || 'Error al enviar el correo');
        throw err;
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  resetPassword(token: string, password: string): Observable<{ success: boolean; message: string }> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.api.post<{ success: boolean; message: string }>('/auth/reset-password', { token, password }).pipe(
      catchError((err) => {
        this.error.set(err.error?.message || 'Error al restablecer la contraseña');
        throw err;
      }),
      finalize(() => this.isLoading.set(false)),
    );
  }

  logout(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.accessToken.set(null);
    this.error.set(null);
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ accessToken?: string }>(
          `${environment.apiUrl}/api/auth/refresh-token`,
          {},
          { withCredentials: true },
        ),
      );
      if (response?.accessToken) {
        this.accessToken.set(response.accessToken);
        sessionStorage.setItem('accessToken', response.accessToken);
      }
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  private loadStoredUser(): void {
    const token = sessionStorage.getItem('accessToken');
    if (token) this.accessToken.set(token);

    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      } catch {
        sessionStorage.removeItem('currentUser');
      }
    }
  }
}
