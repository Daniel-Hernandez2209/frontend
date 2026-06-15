import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
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
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div class="w-full max-w-lg">
        <div class="bg-white rounded-lg shadow-xl p-8">
          <!-- Header -->
          <div class="mb-8 text-center">
            <h1 class="text-3xl font-bold text-gray-900">ATHENA BRAND</h1>
            <p class="text-gray-600 mt-2">Crear cuenta de administrador</p>
          </div>

          @if (registered()) {
            <!-- Éxito -->
            <div class="text-center py-4">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">¡Cuenta creada exitosamente!</h3>
              <p class="text-gray-600 text-sm">
                Tu cuenta ha sido creada. Revisa tu correo para verificarla y luego inicia sesión.
              </p>
              <a
                routerLink="/login"
                class="mt-4 inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Ir al inicio de sesión
              </a>
            </div>
          } @else {

          <!-- Form -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
            <!-- Nombre y Apellido -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  formControlName="firstName"
                  placeholder="Juan"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  [class.border-red-500]="isFieldInvalid('firstName')"
                />
                @if (isFieldInvalid('firstName')) {
                  <p class="text-red-500 text-xs mt-1">{{ getFieldError('firstName') }}</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <input
                  type="text"
                  formControlName="lastName"
                  placeholder="Pérez"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  [class.border-red-500]="isFieldInvalid('lastName')"
                />
                @if (isFieldInvalid('lastName')) {
                  <p class="text-red-500 text-xs mt-1">{{ getFieldError('lastName') }}</p>
                }
              </div>
            </div>

            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                formControlName="email"
                placeholder="tu@email.com"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                [class.border-red-500]="isFieldInvalid('email')"
              />
              @if (isFieldInvalid('email')) {
                <p class="text-red-500 text-xs mt-1">{{ getFieldError('email') }}</p>
              }
            </div>

            <!-- Teléfono (opcional) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Teléfono <span class="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="tel"
                formControlName="phone"
                placeholder="+57 300 000 0000"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                [class.border-red-500]="isFieldInvalid('phone')"
              />
              @if (isFieldInvalid('phone')) {
                <p class="text-red-500 text-xs mt-1">Formato de teléfono inválido</p>
              }
            </div>

            <!-- Contraseña -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                formControlName="password"
                placeholder="••••••••"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                [class.border-red-500]="isFieldInvalid('password')"
              />
              @if (isFieldInvalid('password')) {
                <p class="text-red-500 text-xs mt-1">{{ getFieldError('password') }}</p>
              }
              <p class="text-gray-400 text-xs mt-1">
                Mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)
              </p>
            </div>

            <!-- Confirmar Contraseña -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
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

            <!-- Error global -->
            @if (auth.error()) {
              <div class="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                ⚠️ {{ auth.error() }}
              </div>
            }

            <!-- Submit -->
            <button
              type="submit"
              [disabled]="!form.valid || auth.isLoading()"
              class="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (auth.isLoading()) {
                <span>Creando cuenta...</span>
              } @else {
                <span>Crear Cuenta</span>
              }
            </button>
          </form>

          <!-- Footer -->
          @if (!registered()) {
          <div class="mt-6 text-center">
            <p class="text-gray-600 text-sm">
              ¿Ya tienes cuenta?
              <a routerLink="/login" class="text-indigo-600 hover:text-indigo-700 font-medium">
                Inicia sesión aquí
              </a>
            </p>
          </div>
          }
          }
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  protected auth = inject(AuthService);
  protected registered = signal(false);

  form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', []],
    password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
    confirmPassword: ['', [Validators.required, matchPasswordValidator]],
  });

  onSubmit() {
    if (this.form.invalid) return;

    const { confirmPassword, ...data } = this.form.getRawValue();
    const payload = data.phone ? data : { ...data, phone: undefined };

    this.auth.register(payload).subscribe({
      next: () => this.router.navigate(['/store']),
      error: () => {},
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors) return '';
    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['email']) return 'Email inválido';
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['passwordStrength'])
      return 'Debe tener mayúscula, minúscula, número y carácter especial';
    if (control.errors['passwordMismatch']) return 'Las contraseñas no coinciden';
    return 'Campo inválido';
  }
}
