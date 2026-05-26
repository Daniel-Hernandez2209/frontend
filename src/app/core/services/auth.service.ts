import { computed, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenResponse,
} from '../../shared/types/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  // State Signals
  currentUser = signal<User | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  isAuthenticated = signal(false);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.initializeAuth();
  }

  /**
   * Inicializa la autenticación desde el almacenamiento
   */
  private initializeAuth(): void {
    const token = this.getAccessToken();
    if (token && this.isTokenValid(token)) {
      try {
        // Decodificar JWT sin verificar firma
        const payload = this.decodeToken(token);
        this.currentUser.set(payload);
        this.isAuthenticated.set(true);
      } catch (e) {
        this.logout();
      }
    } else if (token) {
      // Token expirado, intentar refresh
      this.refreshToken().subscribe({
        error: () => this.logout(),
      });
    }
  }

  /**
   * LOGIN - Autentica usuario con credenciales
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        this.setTokens(response.accessToken, response.refreshToken);
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        const errorMsg = this.handleError(error);
        this.error.set(errorMsg);
        this.isLoading.set(false);
        return throwError(() => new Error(errorMsg));
      }),
    );
  }

  /**
   * REGISTER - Registra nuevo usuario
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((response) => {
        this.setTokens(response.accessToken, response.refreshToken);
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        const errorMsg = this.handleError(error);
        this.error.set(errorMsg);
        this.isLoading.set(false);
        return throwError(() => new Error(errorMsg));
      }),
    );
  }

  /**
   * REFRESH TOKEN - Refresca el access token
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token found'));
    }

    return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap((response) => {
        sessionStorage.setItem(environment.jwtTokenName, response.accessToken);
      }),
      catchError((error) => {
        this.logout();
        return throwError(() => new Error('Token refresh failed'));
      }),
    );
  }

  /**
   * LOGOUT - Cierra la sesión
   */
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearAuth();
      }),
      catchError(() => {
        // Limpiar incluso si falla
        this.clearAuth();
        return throwError(() => new Error('Logout failed'));
      }),
    );
  }

  /**
   * FORGOT PASSWORD - Solicita reset de contraseña
   */
  forgotPassword(email: string): Observable<{ message: string }> {
    this.isLoading.set(true);
    return this.http.post<{ message: string }>(`${this.apiUrl}/forgot-password`, { email }).pipe(
      tap(() => this.isLoading.set(false)),
      catchError((error) => {
        this.error.set(this.handleError(error));
        this.isLoading.set(false);
        return throwError(() => error);
      }),
    );
  }

  /**
   * RESET PASSWORD - Resetea la contraseña
   */
  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.apiUrl}/reset-password`, { token, password })
      .pipe(
        catchError((error) => {
          this.error.set(this.handleError(error));
          return throwError(() => error);
        }),
      );
  }

  /**
   * CHANGE PASSWORD - Cambia contraseña (autenticado)
   */
  changePassword(oldPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.apiUrl}/change-password`, { oldPassword, newPassword })
      .pipe(
        catchError((error) => {
          this.error.set(this.handleError(error));
          return throwError(() => error);
        }),
      );
  }

  /**
   * VERIFY EMAIL - Verifica email de usuario
   */
  verifyEmail(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/verify-email`, { token }).pipe(
      catchError((error) => {
        this.error.set(this.handleError(error));
        return throwError(() => error);
      }),
    );
  }

  // ============= HELPERS =============

  /**
   * Obtiene el access token
   */
  getAccessToken(): string | null {
    return sessionStorage.getItem(environment.jwtTokenName);
  }

  /**
   * Obtiene el refresh token
   */
  getRefreshToken(): string | null {
    return sessionStorage.getItem(environment.refreshTokenName);
  }

  /**
   * Guarda tokens en sessionStorage
   */
  private setTokens(accessToken: string, refreshToken?: string): void {
    sessionStorage.setItem(environment.jwtTokenName, accessToken);
    if (refreshToken) {
      sessionStorage.setItem(environment.refreshTokenName, refreshToken);
    }
  }

  /**
   * Limpia la autenticación
   */
  private clearAuth(): void {
    sessionStorage.removeItem(environment.jwtTokenName);
    sessionStorage.removeItem(environment.refreshTokenName);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Decodifica un JWT sin verificar firma
   */
  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid token');
      const decoded = JSON.parse(atob(parts[1]));
      return decoded;
    } catch {
      throw new Error('Failed to decode token');
    }
  }

  /**
   * Verifica si el token es válido (no expirado)
   */
  private isTokenValid(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      const exp = decoded.exp * 1000; // Convertir a ms
      return exp > Date.now();
    } catch {
      return false;
    }
  }

  /**
   * Maneja errores HTTP
   */
  private handleError(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      return error.error.message;
    } else {
      // Server-side error
      return error.error?.message || error.error?.error || 'Algo salió mal';
    }
  }

  userFullName = computed(() => {
    const user = this.currentUser() as any; // Cast temporal a 'any' si no quieres modificar la interfaz User
    return user?.name || '';
  });

  /**
   * Signal derivado que expone si el usuario tiene rol de administrador
   */
  isAdmin = computed(() => {
    const user = this.currentUser() as any;
    return user?.role === 'admin';
  });

  /**
   * Mantiene compatibilidad con tu método anterior si lo necesitas como función
   */
  isAdminUser(): boolean {
    return this.isAdmin();
  }

  /**
   * ACTUALIZAR PERFIL - Envía los cambios del usuario al servidor
   */
  updateProfile(data: Partial<User>): Observable<any> {
    this.isLoading.set(true);
    return this.http.patch<User>(`${this.apiUrl}/profile`, data).pipe(
      tap((updatedUser) => {
        // Actualizamos el estado del signal con los nuevos datos combinados
        const current = this.currentUser();
        if (current) {
          this.currentUser.set({ ...current, ...updatedUser });
        }
        this.isLoading.set(false);
      }),
      catchError((error) => {
        this.error.set(this.handleError(error));
        this.isLoading.set(false);
        return throwError(() => error);
      }),
    );
  }
}
