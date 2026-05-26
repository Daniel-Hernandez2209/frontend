import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Product,
  Category,
  Order,
  OrderCreateRequest,
  PaginatedResponse,
  ApiResponse,
  ProductCreateRequest,
} from '../../shared/types/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ============= PRODUCTS =============

  /**
   * Obtiene lista de productos con paginación
   */
  getProducts(
    page: number = 1,
    limit: number = 12,
    filters?: any,
  ): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (filters?.category) {
      params = params.set('category', filters.category);
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<PaginatedResponse<Product>>(`${this.baseUrl}/products`, { params });
  }

  /**
   * Obtiene un producto por ID
   */
  getProduct(id: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.baseUrl}/products/${id}`);
  }

  /**
   * Busca productos
   */
  searchProducts(query: string, page: number = 1): Observable<PaginatedResponse<Product>> {
    const params = new HttpParams().set('q', query).set('page', page.toString());

    return this.http.get<PaginatedResponse<Product>>(`${this.baseUrl}/products/search`, { params });
  }

  // ============= CATEGORIES =============

  /**
   * Obtiene todas las categorías
   */
  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.baseUrl}/categories`);
  }

  /**
   * Obtiene una categoría por slug
   */
  getCategory(slug: string): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.baseUrl}/categories/${slug}`);
  }

  // ============= ORDERS =============

  /**
   * Crea una nueva orden
   */
  createOrder(orderData: OrderCreateRequest): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(`${this.baseUrl}/orders`, orderData);
  }

  /**
   * Obtiene órdenes del usuario actual
   */
  getMyOrders(page: number = 1): Observable<PaginatedResponse<Order>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<PaginatedResponse<Order>>(`${this.baseUrl}/orders`, { params });
  }

  /**
   * Obtiene una orden específica
   */
  getOrder(id: string): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.baseUrl}/orders/${id}`);
  }

  /**
   * Cancela una orden
   */
  cancelOrder(id: string): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(`${this.baseUrl}/orders/${id}/cancel`, {});
  }

  // ============= ADMIN - PRODUCTS =============

  /**
   * Crea un nuevo producto (admin)
   */
  createProduct(formData: FormData): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${this.baseUrl}/admin/products`, formData);
  }

  /**
   * Actualiza un producto (admin)
   */
  updateProduct(id: string, formData: FormData): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.baseUrl}/admin/products/${id}`, formData);
  }

  /**
   * Elimina un producto (admin)
   */
  deleteProduct(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(
      `${this.baseUrl}/admin/products/${id}`,
    );
  }

  // ============= ADMIN - ORDERS =============

  /**
   * Obtiene todas las órdenes (admin)
   */
  getAllOrders(page: number = 1, limit: number = 20): Observable<PaginatedResponse<Order>> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<PaginatedResponse<Order>>(`${this.baseUrl}/admin/orders`, { params });
  }

  /**
   * Actualiza estado de una orden (admin)
   */
  updateOrderStatus(id: string, status: string): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(`${this.baseUrl}/admin/orders/${id}/status`, {
      status,
    });
  }

  // ============= ADMIN - CATEGORIES =============

  /**
   * Crea una categoría (admin)
   */
  createCategory(data: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(`${this.baseUrl}/admin/categories`, data);
  }

  /**
   * Actualiza una categoría (admin)
   */
  updateCategory(id: string, data: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.baseUrl}/admin/categories/${id}`, data);
  }

  /**
   * Elimina una categoría (admin)
   */
  deleteCategory(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(
      `${this.baseUrl}/admin/categories/${id}`,
    );
  }
}
