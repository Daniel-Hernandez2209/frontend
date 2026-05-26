import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User } from '../../../../shared/types/interfaces';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './users-list.component.html'
})
export class UsersListComponent implements OnInit {

  // ── Filtros locales (binding ngModel) ──────────────────────────────────
  searchQuery     = '';
  selectedRole:       'user' | 'admin' | null = null;
  selectedStatus:     boolean | null = null;
  selectedVerified:   boolean | null = null;

  // ── Opciones de filtros ────────────────────────────────────────────────
  roleOptions = [
    { label: 'Todos los roles', value: null },
    { label: 'Administrador',   value: 'admin' },
    { label: 'Usuario',         value: 'user'  }
  ];

  statusOptions = [
    { label: 'Todos',    value: null  },
    { label: 'Activo',   value: true  },
    { label: 'Inactivo', value: false }
  ];

  verifiedOptions = [
    { label: 'Todos',          value: null  },
    { label: 'Verificados',    value: true  },
    { label: 'Sin verificar',  value: false }
  ];

  // ── Modal de confirmación ──────────────────────────────────────────────
  showDeleteModal  = signal(false);
  userToDelete     = signal<User | null>(null);

  // ── Modal cambio de rol ────────────────────────────────────────────────
  showRoleModal    = signal(false);
  userToChangeRole = signal<User | null>(null);
  newRole          = signal<'user' | 'admin'>('user');

  // ── Getters signals del servicio ───────────────────────────────────────
  get paginatedUsers()  { return this.userService.paginatedUsers; }
  get isLoading()       { return this.userService.isLoading; }
  get error()           { return this.userService.error; }
  get successMsg()      { return this.userService.successMsg; }
  get currentPage()     { return this.userService.currentPage; }
  get totalPages()      { return this.userService.totalPages; }
  get totalFiltered()   { return this.userService.totalFiltered; }
  get stats()           { return this.userService.stats; }

  constructor(
    public userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userService.loadUsers();
  }

  // ── Filtros ────────────────────────────────────────────────────────────
  onSearchChange(): void {
    this.userService.updateFilter('search', this.searchQuery);
  }

  onRoleChange(): void {
    this.userService.updateFilter('role', this.selectedRole);
  }

  onStatusChange(): void {
    this.userService.updateFilter('isActive', this.selectedStatus);
  }

  onVerifiedChange(): void {
    this.userService.updateFilter('isVerified', this.selectedVerified);
  }

  resetFilters(): void {
    this.searchQuery     = '';
    this.selectedRole    = null;
    this.selectedStatus  = null;
    this.selectedVerified = null;
    this.userService.resetFilters();
  }

  // ── Navegación ─────────────────────────────────────────────────────────
  createUser(): void {
    this.router.navigate(['/admin/users/create']);
  }

  editUser(id: string): void {
    this.router.navigate(['/admin/users', id, 'edit']);
  }

  viewUser(id: string): void {
    this.router.navigate(['/admin/users', id]);
  }

  // ── Acciones rápidas ───────────────────────────────────────────────────
  async toggleStatus(user: User, event: Event): Promise<void> {
    event.stopPropagation();
    try {
      await this.userService.toggleStatus(user._id, !user.isActive);
    } catch (err: any) {
      // error ya gestionado por el servicio
    }
  }

  openRoleModal(user: User, event: Event): void {
    event.stopPropagation();
    this.userToChangeRole.set(user);
    this.newRole.set(user.role === 'admin' ? 'user' : 'admin');
    this.showRoleModal.set(true);
  }

  async confirmRoleChange(): Promise<void> {
    const user = this.userToChangeRole();
    if (!user) return;
    try {
      await this.userService.changeRole(user._id, this.newRole());
      this.closeRoleModal();
    } catch { /* manejado por el servicio */ }
  }

  closeRoleModal(): void {
    this.showRoleModal.set(false);
    this.userToChangeRole.set(null);
  }

  // ── Eliminar ───────────────────────────────────────────────────────────
  openDeleteModal(user: User, event: Event): void {
    event.stopPropagation();
    this.userToDelete.set(user);
    this.showDeleteModal.set(true);
  }

  async confirmDelete(): Promise<void> {
    const user = this.userToDelete();
    if (!user) return;
    try {
      await this.userService.delete(user._id);
      this.closeDeleteModal();
    } catch { /* manejado por el servicio */ }
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.userToDelete.set(null);
  }

  // ── Paginación ─────────────────────────────────────────────────────────
  previousPage(): void {
    if (this.currentPage() > 1) this.userService.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) this.userService.goToPage(this.currentPage() + 1);
  }

  goToPage(page: number): void {
    this.userService.goToPage(page);
  }

  getPageNumbers(): number[] {
    return this.userService.getPageNumbers();
  }

  // ── Helpers UI ─────────────────────────────────────────────────────────
  getRoleColor(role: string)        { return this.userService.getRoleColor(role); }
  getRoleLabel(role: string)        { return this.userService.getRoleLabel(role); }
  getStatusColor(a: boolean)        { return this.userService.getStatusColor(a); }
  getStatusLabel(a: boolean)        { return this.userService.getStatusLabel(a); }
  getVerifiedColor(v: boolean)      { return this.userService.getVerifiedColor(v); }
  getVerifiedLabel(v: boolean)      { return this.userService.getVerifiedLabel(v); }
  getInitials(user: User)           { return this.userService.getInitials(user); }
  getAvatarColor(user: User)        { return this.userService.getAvatarColor(user); }
  formatDate(d: string | Date)      { return this.userService.formatDate(d); }

  get fullName() {
    return (user: User) => `${user.firstName} ${user.lastName}`;
  }
}
