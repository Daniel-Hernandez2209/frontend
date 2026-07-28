import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-lg shadow-xl p-8">
          <!-- Header -->
          <div class="mb-8 text-center">
            <h1 class="text-3xl font-bold text-gray-900">ATHENA BRAND</h1>
            <p class="text-gray-600 mt-2">Recuperar contraseña</p>
          </div>

          @if (!sent()) {
            <!-- Formulario -->
            <p class="text-gray-600 text-sm mb-6 text-center">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  formControlName="email"
                  placeholder="tu@email.com"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  [class.border-red-500]="isEmailInvalid()"
                />
                @if (isEmailInvalid()) {
                  <p class="text-red-500 text-xs mt-1">Ingresa un email válido</p>
                }
              </div>

              @if (auth.error()) {
                <div class="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  ⚠️ {{ auth.error() }}
                </div>
              }

              <button
                type="submit"
                [disabled]="form.invalid || auth.isLoading()"
                class="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (auth.isLoading()) {
                  <span>Enviando...</span>
                } @else {
                  <span>Enviar enlace de recuperación</span>
                }
              </button>
            </form>
          } @else {
            <!-- Éxito -->
            <div class="text-center py-4">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">¡Correo enviado!</h3>
              <p class="text-gray-600 text-sm">
                Si existe una cuenta con el correo <strong>{{ form.value.email }}</strong>,
                recibirás un enlace para restablecer tu contraseña en los próximos minutos.
              </p>
              <p class="text-gray-500 text-xs mt-3">Revisa también tu carpeta de spam.</p>
            </div>
          }

          <!-- Footer -->
          <div class="mt-6 text-center">
            <a routerLink="/login" class="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              ← Volver al inicio de sesión
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  protected auth = inject(AuthService);
  protected sent = signal(false);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit() {
    if (this.form.invalid) return;

    this.auth.forgotPassword(this.form.getRawValue().email).subscribe({
      next: () => this.sent.set(true),
      error: () => {},
    });
  }

  isEmailInvalid(): boolean {
    const control = this.form.get('email');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
