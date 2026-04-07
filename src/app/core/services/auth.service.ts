import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../../shared/types/interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/api/auth`;

  // Signals state
  currentUser = signal<User | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Computed derived state
  isAuthenticated = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'admin');
  userFullName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Initialize user from sessionStorage on service creation
    this.initializeUser();

    // Auto-save user to sessionStorage when it changes
    effect(() => {
      const user = this.currentUser();
      if (user) {
        sessionStorage.setItem('current_user', JSON.stringify(user));
      } else {
        sessionStorage.removeItem('current_user');
      }
    });
  }

  /**
   * Initialize user from sessionStorage
   */
  private initializeUser(): void {
    const stored = sessionStorage.getItem('current_user');
    if (stored) {
      try {
        this.currentUser.set(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        this.logout();
      }
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
      );

      if (response.success && response.data) {
        // Store tokens in sessionStorage
        sessionStorage.setItem('access_token', response.data.accessToken);
        sessionStorage.setItem('refresh_token', response.data.refreshToken);

        // Set current user
        this.currentUser.set(response.data.user);

        // Navigate to dashboard
        this.router.navigate(['/admin/dashboard']);
      }
    } catch (err: any) {
      const message = err.error?.message || 'Login failed. Please try again.';
      this.error.set(message);
      throw new Error(message);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/register`, data)
      );

      if (response.success) {
        // Auto-login after registration
        await this.login({ email: data.email, password: data.password });
      }
    } catch (err: any) {
      const message = err.error?.message || 'Registration failed. Please try again.';
      this.error.set(message);
      throw new Error(message);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Logout user and clear session
   */
  logout(): void {
    // Clear sessionStorage
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('current_user');

    // Reset signals
    this.currentUser.set(null);
    this.error.set(null);

    // Navigate to login
    this.router.navigate(['/login']);
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return sessionStorage.getItem('access_token');
  }

  /**
   * Get current refresh token
   */
  getRefreshToken(): string | null {
    return sessionStorage.getItem('refresh_token');
  }

  /**
   * Refresh JWT tokens
   */
  async refreshToken(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/refresh-token`, {})
      );

      if (response.success && response.data) {
        sessionStorage.setItem('access_token', response.data.accessToken);
        sessionStorage.setItem('refresh_token', response.data.refreshToken);
        this.currentUser.set(response.data.user);
        return true;
      }
      return false;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<User>>(`${this.API_URL}/me`)
      );
      if (response.success && response.data) {
        this.currentUser.set(response.data);
        return response.data;
      }
      throw new Error('Failed to fetch profile');
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.put<ApiResponse<User>>(`${this.API_URL}/profile`, data)
      );
      if (response.success && response.data) {
        this.currentUser.set(response.data);
        return response.data;
      }
      throw new Error('Failed to update profile');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await firstValueFrom(
        this.http.post(`${this.API_URL}/change-password`, {
          currentPassword,
          newPassword
        })
      );
    } catch (err: any) {
      const message = err.error?.message || 'Failed to change password';
      this.error.set(message);
      throw new Error(message);
    } finally {
      this.isLoading.set(false);
    }
  }
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
}
