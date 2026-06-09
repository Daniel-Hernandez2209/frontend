import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api` || 'http://localhost:3000/api';

  get<T>(endpoint: string, options?: any): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, options) as any;
  }

  post<T>(endpoint: string, data: any, options?: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data, options) as any;
  }

  patch<T>(endpoint: string, data: any, options?: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, data, options) as any;
  }

  delete<T>(endpoint: string, options?: any): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, options) as any;
  }

  put<T>(endpoint: string, data: any, options?: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data, options) as any;
  }
}
