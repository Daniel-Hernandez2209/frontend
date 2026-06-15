import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value || '';
  const valid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(value);
  return valid ? null : { passwordStrength: true };
}

function matchPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.parent?.get('password')?.value;
  return control.value === password ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-lg shadow-xl p-8">
          <!-- Header -->
          <div class="mb-8 text-center">
            <h1 class="text-3xl font-bold text-gray-900">ATHENA BRAND</h1>
            <p class="text-gray-600 mt-2">Nueva contraseña</p>
          </div>

          @if (!token()) {
            <!-- Sin token -->
            <div class="text-center py-4">
              <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Enlace inválido</h3>
              <p class="text-gray-600 text-sm">Este enlace de recuperación no es válido o ha expirado.</p>
            </div>
          } @else if (!done()) {
            <!-- Formulario -->
            <p class="text-gray-600 text-sm mb-6 text-center">
              Crea una nueva contraseña segura para tu cuenta.
            </p>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                <input
                  type="password"
                  formControlName="password"
                  placeholder="••••••••"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  [class.border-red-500]="isFieldInvalid('password')"
                />
                @if (isFieldInvalid('password')) {
                  <p class="text-red-500 text-xs mt-1">{{ getPasswordError() }}</p>
                }
                <p class="text-gray-400 text-xs mt-1">
                  Mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  formControlName="confirmPassword"
                  placeholder="••••••••"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  [class.border-red-500]="isFieldInvalid('confirmPassword')"
                />
                @if (isFieldInvalid('confirmPassword')) {
                  <p class="text-red-500 text-xs mt-1">Las contraseñas no coinciden</p>
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
                  <span>Guardando...</span>
                } @else {
                  <span>Restablecer Contraseña</span>
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
              <h3 class="text-lg font-semibold text-gray-900 mb-2">¡Contraseña restablecida!</h3>
              <p class="text-gray-600 text-sm">
                Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión.
              </p>
            </div>
          }

          <!-- Footer -->
          <div class="mt-6 text-center">
            <a routerLink="/login" class="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              Ir al inicio de sesión
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  protected auth = inject(AuthService);
  protected token = signal<string | null>(null);
  protected done = signal(false);

  form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
    confirmPassword: ['', [Validators.required, matchPasswordValidator]],
  });

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    this.token.set(token);
  }

  onSubmit() {
    if (this.form.invalid || !this.token()) return;

    this.auth.resetPassword(this.token()!, this.form.getRawValue().password).subscribe({
      next: () => this.done.set(true),
      error: () => {},
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getPasswordError(): string {
    const control = this.form.get('password');
    if (!control?.errors) return '';
    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['minlength']) return 'Mínimo 8 caracteres';
    if (control.errors['passwordStrength']) return 'Debe tener mayúscula, minúscula, número y carácter especial';
    return 'Contraseña inválida';
  }
}
