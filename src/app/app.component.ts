import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent],
  template: `
    <app-toast />

    @if (auth.isAuthenticated()) {
      <nav class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 class="text-xl font-bold">ATHENA Admin</h1>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <p class="font-semibold">{{ auth.displayName() }}</p>
              <p class="text-xs text-gray-600">{{ auth.userRole() }}</p>
            </div>
            <button
              (click)="onLogout()"
              class="px-4 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
    }
    <main>
      <router-outlet />
    </main>
  `,
})
export class AppComponent {
  auth = inject(AuthService);

  onLogout() {
    if (confirm('¿Estás seguro?')) {
      this.auth.logout();
    }
  }
}
