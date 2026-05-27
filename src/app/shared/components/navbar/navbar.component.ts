import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <!-- Logo -->
        <a routerLink="/admin/dashboard" class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">AB</span>
          </div>
          <span class="text-lg font-bold text-gray-900">ATHENA</span>
        </a>

        <!-- Right Section -->
        <div class="flex items-center space-x-6">
          <!-- User Menu -->
          <div class="relative" (click)="showUserMenu.set(!showUserMenu())">
            <button class="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
              <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span class="text-sm font-semibold text-gray-700">
                  {{ getInitials() }}
                </span>
              </div>
              <span class="text-sm font-medium">{{ authService.currentUser()?.name }}</span>
            </button>

            <!-- Dropdown -->
            <div
              *ngIf="showUserMenu()"
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
            >
              <a
                routerLink="/admin/profile"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                (click)="showUserMenu.set(false)"
              >
                My Profile
              </a>
              <button
                (click)="onLogout()"
                class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [],
})
export class NavbarComponent {
  protected authService = inject(AuthService);
  private router = inject(Router);

  showUserMenu = signal(false);

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
