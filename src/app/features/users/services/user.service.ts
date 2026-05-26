import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  User,
  UserFilters,
  UserStats,
  CreateUserRequest,
  UpdateUserRequest,
  ApiResponse,
  PaginatedResponse
} from '../../../shared/types/interfaces';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/users`;

  // ── Estado principal ──────────────────────────────────────────────────────
  users         = signal<User[]>([]);
  selectedUser  = signal<User | null>(null);
  isLoading     = signal(false);
  error         = signal<string | null>(null);
  successMsg    = signal<string | null>(null);

  // ── Paginación ────────────────────────────────────────────────────────────
  currentPage   = signal(1);
  pageSize      = signal(10);
  totalUsers    = signal(0);

  // ── Filtros ───────────────────────────────────────────────────────────────
  filters = signal<UserFilters>({
    search:     '',
    role:       null,
    isActive:   null,
    isVerified: null
  });

  // ── Computed ──────────────────────────────────────────────────────────────
  filteredUsers = computed(() => {
    const all = this.users();
    const { search, role, isActive, isVerified } = this.filters();

    return all.filter(u => {
      const fullName  = `${u.firstName} ${u.lastName}`.toLowerCase();
      const matchName = !search ||
        fullName.includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.phone ?? '').includes(search);

      const matchRole     = role       === null || u.role      === role;
      const matchActive   = isActive   === null || u.isActive  === isActive;
      const matchVerified = isVerified === null || u.isVerified === isVerified;

      return matchName && matchRole && matchActive && matchVerified;
    });
  });

  paginatedUsers = computed(() => {
    const filtered = this.filteredUsers();
    const start = (this.currentPage() - 1) * this.pageSize();
    return filtered.slice(start, start + this.pageSize());
  });

  totalPages = computed(() =>
    Math.ceil(this.filteredUsers().length / this.pageSize()) || 1
  );

  totalFiltered = computed(() => this.filteredUsers().length);

  // ── Stats calculados ──────────────────────────────────────────────────────
  stats = computed<UserStats>(() => {
    const all = this.users();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total:        all.length,
      active:       all.filter(u => u.isActive).length,
      inactive:     all.filter(u => !u.isActive).length,
      admins:       all.filter(u => u.role === 'admin').length,
      verified:     all.filter(u => u.isVerified).length,
      newThisMonth: all.filter(u => new Date(u.createdAt) >= startOfMonth).length
    };
  });

  constructor(private http: HttpClient) {}

  // ── CRUD ──────────────────────────────────────────────────────────────────

  /** Cargar todos los usuarios */
  async loadUsers(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      const response = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}?limit=200`)
      );

      // Soporta { data: [...] } o { data: { users: [...] } }
      const list: User[] =
        Array.isArray(response?.data)
          ? response.data
          : response?.data?.users ?? [];

      this.users.set(list);
      this.totalUsers.set(list.length);
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al cargar usuarios');
      console.error('UserService.loadUsers:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Obtener un usuario por ID */
  async getById(id: string): Promise<User | null> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      const response = await firstValueFrom(
        this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`)
      );
      this.selectedUser.set(response.data ?? null);
      return response.data ?? null;
    } catch (err: any) {
      this.error.set(err?.error?.message ?? 'Error al cargar el usuario');
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Crear usuario */
  async create(data: CreateUserRequest): Promise<User | null> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      const response = await firstValueFrom(
        this.http.post<ApiResponse<User>>(`${this.apiUrl}`, data)
      );

      if (response.data) {
        this.users.update(list => [response.data!, ...list]);
        this.totalUsers.update(n => n + 1);
        this.successMsg.set('Usuario creado exitosamente');
        this._clearSuccess();
      }
      return response.data ?? null;
    } catch (err: any) {
      const msg = err?.error?.message ?? 'Error al crear usuario';
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Actualizar usuario */
  async update(id: string, data: UpdateUserRequest): Promise<User | null> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      const response = await firstValueFrom(
        this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, data)
      );

      if (response.data) {
        this.users.update(list =>
          list.map(u => u._id === id ? response.data! : u)
        );
        if (this.selectedUser()?._id === id) {
          this.selectedUser.set(response.data);
        }
        this.successMsg.set('Usuario actualizado exitosamente');
        this._clearSuccess();
      }
      return response.data ?? null;
    } catch (err: any) {
      const msg = err?.error?.message ?? 'Error al actualizar usuario';
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Eliminar usuario */
  async delete(id: string): Promise<boolean> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      await firstValueFrom(
        this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      );

      this.users.update(list => list.filter(u => u._id !== id));
      this.totalUsers.update(n => n - 1);

      if (this.selectedUser()?._id === id) {
        this.selectedUser.set(null);
      }

      this.successMsg.set('Usuario eliminado exitosamente');
      this._clearSuccess();
      return true;
    } catch (err: any) {
      const msg = err?.error?.message ?? 'Error al eliminar usuario';
      this.error.set(msg);
      throw new Error(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Activar / desactivar usuario */
  async toggleStatus(id: string, isActive: boolean): Promise<void> {
    try {
      this.error.set(null);

      const response = await firstValueFrom(
        this.http.patch<ApiResponse<User>>(`${this.apiUrl}/${id}/status`, { isActive })
      );

      if (response.data) {
        this.users.update(list =>
          list.map(u => u._id === id ? { ...u, isActive } : u)
        );
        this.successMsg.set(isActive ? 'Usuario activado' : 'Usuario desactivado');
        this._clearSuccess();
      }
    } catch (err: any) {
      const msg = err?.error?.message ?? 'Error al cambiar estado';
      this.error.set(msg);
      throw new Error(msg);
    }
  }

  /** Cambiar rol del usuario */
  async changeRole(id: string, role: 'user' | 'admin'): Promise<void> {
    try {
      this.error.set(null);

      const response = await firstValueFrom(
        this.http.patch<ApiResponse<User>>(`${this.apiUrl}/${id}/role`, { role })
      );

      if (response.data) {
        this.users.update(list =>
          list.map(u => u._id === id ? { ...u, role } : u)
        );
        this.successMsg.set(`Rol cambiado a ${role === 'admin' ? 'Administrador' : 'Usuario'}`);
        this._clearSuccess();
      }
    } catch (err: any) {
      const msg = err?.error?.message ?? 'Error al cambiar rol';
      this.error.set(msg);
      throw new Error(msg);
    }
  }

  // ── Filtros ───────────────────────────────────────────────────────────────

  updateFilter(key: keyof UserFilters, value: any): void {
    this.filters.update(f => ({ ...f, [key]: value }));
    this.currentPage.set(1);
  }

  resetFilters(): void {
    this.filters.set({ search: '', role: null, isActive: null, isVerified: null });
    this.currentPage.set(1);
  }

  // ── Paginación ────────────────────────────────────────────────────────────

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getPageNumbers(): number[] {
    const total   = this.totalPages();
    const current = this.currentPage();
    const adj = 2;
    const pages: number[] = [];
    for (let i = Math.max(1, current - adj); i <= Math.min(total, current + adj); i++) {
      pages.push(i);
    }
    return pages;
  }

  // ── Helpers UI ────────────────────────────────────────────────────────────

  getRoleColor(role: string): string {
    return role === 'admin'
      ? 'bg-purple-100 text-purple-800 border border-purple-200'
      : 'bg-blue-100 text-blue-800 border border-blue-200';
  }

  getRoleLabel(role: string): string {
    return role === 'admin' ? 'Administrador' : 'Usuario';
  }

  getStatusColor(isActive: boolean): string {
    return isActive
      ? 'bg-green-100 text-green-800 border border-green-200'
      : 'bg-red-100 text-red-800 border border-red-200';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Activo' : 'Inactivo';
  }

  getVerifiedColor(isVerified: boolean): string {
    return isVerified
      ? 'bg-teal-100 text-teal-800'
      : 'bg-yellow-100 text-yellow-800';
  }

  getVerifiedLabel(isVerified: boolean): string {
    return isVerified ? 'Verificado' : 'Sin verificar';
  }

  getInitials(user: User): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  getAvatarColor(user: User): string {
    const colors = [
      'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
      'bg-lime-500', 'bg-green-500', 'bg-teal-500', 'bg-cyan-500',
      'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500',
      'bg-pink-500', 'bg-rose-500'
    ];
    const index = user.firstName.charCodeAt(0) % colors.length;
    return colors[index];
  }

  formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      year:   'numeric',
      month:  'short',
      day:    'numeric'
    }).format(new Date(date));
  }

  clearError(): void {
    this.error.set(null);
  }

  // ── Privados ──────────────────────────────────────────────────────────────
  private _clearSuccess(): void {
    setTimeout(() => this.successMsg.set(null), 3500);
  }
}
