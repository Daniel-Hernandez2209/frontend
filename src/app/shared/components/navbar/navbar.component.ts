import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-6 shrink-0">
      <!-- Breadcrumb / título -->
      <p class="text-neutral-500 text-sm font-medium">Panel de administración</p>

      <!-- Usuario -->
      <div class="relative group">
        <button class="flex items-center gap-2.5 hover:opacity-80 transition">
          <div class="w-8 h-8 rounded-full bg-neutral-700 text-white text-xs font-black flex items-center justify-center">
            {{ getInitials() }}
          </div>
          <span class="text-neutral-300 text-sm font-semibold hidden sm:block">
            {{ authService.displayName() }}
          </span>
          <svg class="w-3.5 h-3.5 text-neutral-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <!-- Dropdown -->
        <div class="absolute right-0 top-full mt-2 w-40 bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl
                    opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
          <button (click)="onLogout()"
                  class="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-neutral-700 transition font-semibold">
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [],
})
export class NavbarComponent {
  protected authService = inject(AuthService);
  private router = inject(Router);

  getInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return 'U';
    const first = user.firstName?.[0] ?? '';
    const last = user.lastName?.[0] ?? '';
    return (first + last).toUpperCase() || 'U';
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
