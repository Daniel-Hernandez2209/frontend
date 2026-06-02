import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div class="text-center">
        <h1 class="text-6xl font-bold text-base-900 mb-4">403</h1>
        <p class="text-2xl font-semibold text-base-700 mb-4">Access Forbidden</p>
        <p class="text-base-600 mb-8 max-w-md">
          You don't have permission to access this resource. Please contact an administrator if you
          believe this is a mistake.
        </p>
        <a routerLink="/admin/dashboard" class="btn btn-primary"> Back to Dashboard </a>
      </div>
    </div>
  `,
  styles: [],
})
export class ForbiddenComponent {}
