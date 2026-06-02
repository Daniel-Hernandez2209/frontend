// src/app/shared/components/toast/toast.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          [ngClass]="getToastClasses(toast.type)"
          class="px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slideIn pointer-events-auto max-w-sm"
        >
          <!-- Icon -->
          <span [ngClass]="getIconClass(toast.type)" class="text-lg font-bold flex-shrink-0">
            {{ getIcon(toast.type) }}
          </span>

          <!-- Message -->
          <span class="flex-1">{{ toast.message }}</span>

          <!-- Close Button -->
          <button
            (click)="toastService.remove(toast.id)"
            class="ml-2 text-lg font-bold hover:opacity-70 flex-shrink-0"
          >
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .animate-slideIn {
        animation: slideIn 0.3s ease;
      }
    `,
  ],
})
export class ToastComponent {
  toastService = inject(ToastService);

  getToastClasses(type: string): string {
    const classes: Record<string, string> = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      info: 'bg-blue-500 text-white',
      warning: 'bg-yellow-500 text-white',
    };
    return classes[type] || classes['info'];
  }

  getIconClass(type: string): string {
    const classes: Record<string, string> = {
      success: 'text-green-100',
      error: 'text-red-100',
      info: 'text-blue-100',
      warning: 'text-yellow-100',
    };
    return classes[type] || '';
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      success: '✓',
      error: '✕',
      info: 'ⓘ',
      warning: '⚠',
    };
    return icons[type] || '';
  }
}
