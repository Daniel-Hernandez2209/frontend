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

        // Requests marcadas como silenciosas no muestran toast
        const silent = req.headers.has('X-Silent');

        if (error.status === 401) {
          const msg: string = error.error?.message || '';
          // Only refresh if the token is genuinely expired, not for permission errors
          const isTokenExpired = msg.toLowerCase().includes('expirado') || msg.toLowerCase().includes('expired');
          const isAuthRequired = msg.toLowerCase().includes('autenticación requerida') || msg.toLowerCase().includes('no proporcionado');
          if (isTokenExpired) {
            console.log('🔐 Token expirado, intentando refresh...');
            this.handleUnauthorized();
          } else if (!isAuthRequired) {
            // Unknown 401 — try refresh as fallback
            console.log('🔐 401 desconocido, intentando refresh...');
            this.handleUnauthorized();
          }
          // If "Autenticación requerida" — this is a middleware bug, don't logout
        } else if (!silent) {
          if (error.status === 403) {
            this.toast.error('No tienes permiso para esta acción');
          } else if (error.status === 404) {
            // Solo mostrar toast para acciones explícitas del usuario, no para
            // background loads (GET de datos que ya manejan su propio estado de error)
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
              this.toast.error('Recurso no encontrado');
            }
          } else if (error.status === 500) {
            this.toast.error('Error del servidor. Intenta más tarde');
          } else if (error.status === 0) {
            this.toast.error('Error de conexión. Verifica tu internet');
          } else if (error.status >= 400) {
            const message = error.error?.message || error.message || 'Error desconocido';
            this.toast.error(message);
          }
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
