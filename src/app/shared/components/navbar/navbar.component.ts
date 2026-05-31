import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar bg-base-100 border-b border-base-300 shadow-sm">
      <div class="flex-1">
        <!-- Logo -->
        <a routerLink="/admin/dashboard" class="btn btn-ghost normal-case text-xl gap-2">
          <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">AB</span>
          </div>
          <span class="font-bold text-lg">ATHENA</span>
        </a>
      </div>

      <!-- Right Section -->
      <div class="flex-none">
        <!-- User Menu Dropdown -->
        <div class="dropdown dropdown-end">
          <button tabindex="0" class="btn btn-ghost btn-circle avatar">
            <div
              class="w-10 rounded-full bg-secondary text-secondary-content flex items-center justify-center font-semibold"
            >
              {{ getInitials() }}
            </div>
          </button>
          <ul
            tabindex="0"
            class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li><a routerLink="/admin/profile">My Profile</a></li>
            <li><a (click)="onLogout()">Logout</a></li>
          </ul>
        </div>
      </div>
    </nav>
  `,
  styles: [],
})
export class NavbarComponent {
  protected authService = inject(AuthService);
  private router = inject(Router);

  getInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return 'U';
    const initials =
      user.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'U';
    return initials.substring(0, 2);
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      complete: () => {
        this.router.navigate(['/login']);
      },
    });
  }
}
