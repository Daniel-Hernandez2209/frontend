import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Generic GET request
   */
  get<T = any>(
    endpoint: string,
    params?: HttpParams | { [param: string]: string | string[] },
    options?: any
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.http.get<T>(url, { ...options, params, reportProgress: false }).pipe(
      catchError(this.handleError)
    ) as Observable<T>;
  }

  /**
   * Generic POST request
   */
  post<T = any>(
    endpoint: string,
    body?: any,
    options?: any
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.http.post<T>(url, body || {}, { ...options, reportProgress: false }).pipe(
      catchError(this.handleError)
    ) as Observable<T>;
  }

  /**
   * Generic PUT request
   */
  put<T = any>(
    endpoint: string,
    body?: any,
    options?: any
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.http.put<T>(url, body || {}, { ...options, reportProgress: false }).pipe(
      catchError(this.handleError)
    ) as Observable<T>;
  }

  /**
   * Generic PATCH request
   */
  patch<T = any>(
    endpoint: string,
    body?: any,
    options?: any
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.http.patch<T>(url, body || {}, { ...options, reportProgress: false }).pipe(
      catchError(this.handleError)
    ) as Observable<T>;
  }

  /**
   * Generic DELETE request
   */
  delete<T = any>(
    endpoint: string,
    options?: any
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.http.delete<T>(url, { ...options, reportProgress: false }).pipe(
      catchError(this.handleError)
    ) as Observable<T>;
  }

  /**
   * File upload
   */
  uploadFile<T = any>(
    endpoint: string,
    file: File,
    fieldName: string = 'file',
    additionalData?: Record<string, string>
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.http.post<T>(url, formData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Multiple file upload
   */
  uploadFiles<T = any>(
    endpoint: string,
    files: File[],
    fieldName: string = 'files',
    additionalData?: Record<string, string>
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    const formData = new FormData();

    files.forEach((file, index) => {
      formData.append(`${fieldName}[${index}]`, file);
    });

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.http.post<T>(url, formData).pipe(
      catchError(this.handleError)
    );
  }

  private buildUrl(endpoint: string): string {
    return endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'Unable to connect to server. Check your connection.';
      } else {
        errorMessage = error.error?.message || `Error ${error.status}: ${error.message}`;
      }
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
