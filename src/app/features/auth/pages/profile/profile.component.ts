import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-bold mb-6">My Profile</h1>

      <div *ngIf="user()" class="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-gray-600 text-sm">First Name</p>
            <p class="text-lg font-medium">{{ user()!.firstName }}</p>
          </div>
          <div>
            <p class="text-gray-600 text-sm">Last Name</p>
            <p class="text-lg font-medium">{{ user()!.lastName }}</p>
          </div>
          <div>
            <p class="text-gray-600 text-sm">Email</p>
            <p class="text-lg font-medium">{{ user()!.email }}</p>
          </div>
          <div>
            <p class="text-gray-600 text-sm">Role</p>
            <p class="text-lg font-medium capitalize">{{ user()!.role }}</p>
          </div>
        </div>

        <button
          (click)="logout()"
          class="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class ProfileComponent {
  get user() {
    return this.authService.currentUser;
  }

  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
