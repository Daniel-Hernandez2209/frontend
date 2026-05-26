import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      <div class="w-full max-w-md">
        <!-- Card -->
        <div class="bg-white rounded-lg shadow-xl p-8">
          <!-- Logo -->
          <div class="mb-8 text-center">
            <h1 class="text-3xl font-bold text-gray-900">ATHENA BRAND</h1>
            <p class="text-gray-600 mt-2">Admin Panel</p>
          </div>

          <!-- Form -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                formControlName="email"
                placeholder="tu@email.com"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                [class.border-red-500]="isFieldInvalid('email')"
              />
              @if (isFieldInvalid('email')) {
                <p class="text-red-500 text-sm mt-1">
                  {{ getFieldError('email') }}
                </p>
              }
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> Contraseña </label>
              <input
                type="password"
                formControlName="password"
                placeholder="••••••••"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                [class.border-red-500]="isFieldInvalid('password')"
              />
              @if (isFieldInvalid('password')) {
                <p class="text-red-500 text-sm mt-1">
                  {{ getFieldError('password') }}
                </p>
              }
            </div>

            <!-- Global Error -->
            @if (auth.error()) {
              <div class="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                ⚠️ {{ auth.error() }}
              </div>
            }

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="!form.valid || auth.isLoading()"
              class="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (auth.isLoading()) {
                <span>Ingresando...</span>
              } @else {
                <span>Ingresar</span>
              }
            </button>
          </form>

          <!-- Footer Links -->
          <div class="mt-6 space-y-2 text-center">
            <a
              routerLink="/auth/forgot-password"
              class="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              ¿Olvidaste tu contraseña?
            </a>
            <p class="text-gray-600 text-sm">
              ¿No tienes cuenta?
              <a
                routerLink="/auth/register"
                class="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Regístrate aquí
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  protected auth = inject(AuthService);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.form.valid) {
      this.auth.login(this.form.getRawValue()).subscribe({
        error: (err) => console.error('Login error:', err),
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field?.errors) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['email']) return 'Email inválido';
    if (field.errors['minlength'])
      return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;

    return 'Error en el campo';
  }
}
