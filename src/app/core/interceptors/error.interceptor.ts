// src/app/core/interceptors/error.interceptor.ts
import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { ToastService } from '../services/toast.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private auth = inject(AuthService);
  private logger = inject(LoggerService);
  private toast = inject(ToastService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Log del error
        this.logger.logError(`HTTP ${error.status}: ${error.message}`, 'ErrorInterceptor', {
          url: req.url,
          method: req.method,
          status: error.status,
          statusText: error.statusText,
        });

        // Manejo específico por código de error
        if (error.status === 401) {
          // Unauthorized - Intenta refresh automático
          console.log('🔐 Token expirado, intentando refresh...');
          this.handleUnauthorized();
        } else if (error.status === 403) {
          this.toast.error('❌ No tienes permiso para esta acción');
        } else if (error.status === 404) {
          this.toast.error('❌ Recurso no encontrado');
        } else if (error.status === 500) {
          this.toast.error('❌ Error del servidor. Intenta más tarde');
        } else if (error.status === 0) {
          this.toast.error('❌ Error de conexión. Verifica tu internet');
        } else {
          // Generic error
          const message = error.error?.message || error.message || 'Error desconocido';
          this.toast.error(`❌ ${message}`);
        }

        return throwError(() => error);
      }),
    );
  }

  private handleUnauthorized(): void {
    this.auth.refreshToken().then((success) => {
      if (success) {
        this.toast.info('✅ Sesión renovada');
      } else {
        this.toast.error('❌ Sesión expirada. Por favor inicia sesión de nuevo');
        this.auth.logout();
      }
    });
  }
}
