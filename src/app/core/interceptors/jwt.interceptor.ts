import { Injectable } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

// Token refresh subject for queuing requests while refreshing
let isRefreshing$ = new BehaviorSubject<boolean>(false);

/**
 * JWT Interceptor - Adds Bearer token to all requests
 */
export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService = inject(AuthService)
): Observable<HttpEvent<any>> => {
  const token = sessionStorage.getItem('access_token');

  // Skip token for non-API requests
  if (token && !req.url.includes('localhost') && req.url.includes('api')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token might be expired, try to refresh
        return refreshTokenAndRetry(req, next, authService);
      }
      return throwError(() => error);
    })
  );
};

/**
 * Refresh token and retry failed request
 */
function refreshTokenAndRetry(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<any>> {
  if (!isRefreshing$.value) {
    isRefreshing$.next(true);

    return authService.refreshToken().then(success => {
      isRefreshing$.next(false);

      if (success) {
        // Retry original request with new token
        const token = sessionStorage.getItem('access_token');
        return next(
          req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          })
        ).toPromise() || Promise.resolve({} as HttpEvent<any>);
      } else {
        // Refresh failed, logout
        authService.logout();
        return Promise.reject(new Error('Token refresh failed'));
      }
    }).catch(err => {
      isRefreshing$.next(false);
      authService.logout();
      return Promise.reject(err);
    }) as any;
  }

  // Wait for token refresh to complete
  return isRefreshing$.pipe(
    filter(isRefreshing => !isRefreshing),
    take(1),
    switchMap(() => {
      const token = sessionStorage.getItem('access_token');
      return next(
        req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        })
      );
    })
  );
}

/**
 * Error Interceptor - Handles common HTTP errors
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        if (error.status === 0) {
          errorMessage = 'Unable to connect to server. Please check your connection.';
        } else if (error.status === 400) {
          errorMessage = error.error?.message || 'Bad request';
        } else if (error.status === 401) {
          errorMessage = 'Unauthorized. Please login again.';
        } else if (error.status === 403) {
          errorMessage = 'Access forbidden.';
        } else if (error.status === 404) {
          errorMessage = 'Resource not found.';
        } else if (error.status === 429) {
          errorMessage = 'Too many requests. Please try again later.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
      }

      console.error('HTTP Error:', errorMessage);
      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        error: error.error
      }));
    })
  );
};
