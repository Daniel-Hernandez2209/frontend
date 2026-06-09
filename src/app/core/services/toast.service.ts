// src/app/core/services/toast.service.ts
import { Injectable, signal } from '@angular/core';
import { nanoid } from 'nanoid';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  success(message: string, duration = 3000): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 5000): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration = 3000): void {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration = 4000): void {
    this.show(message, 'warning', duration);
  }

  private show(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning',
    duration: number,
  ): void {
    const id = nanoid(8);
    const toast: Toast = { id, message, type, duration };

    // Agregar toast
    this.toasts.update((toasts) => [...toasts, toast]);
    console.log(`🔔 [${type.toUpperCase()}] ${message}`);

    // Auto-remover después de duration
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  remove(id: string): void {
    this.toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }
}
