import { Component, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../../../shared/services/cart.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiService } from '../../../../core/services/api.service';
import { firstValueFrom } from 'rxjs';

// ── Tipos alineados con el backend ───────────────────────────────────────────

interface CreateOrderPayload {
  items: { product: string; size: string; quantity: number }[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    department: string;
    zipCode: string;
    country: string;
  };
  payment: { method: 'pse' | 'cash_on_delivery' | 'bank_transfer' };
  guestInfo?: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

interface OrderCreatedData {
  orderNumber: string;
  total: number;
  status: string;
  estimatedDelivery?: string;
  guestToken?: string;
}

interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: OrderCreatedData;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const COLOMBIAN_DEPARTMENTS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
  'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
  'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
  'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
  'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
  'Vaupés', 'Vichada',
];

// ── Componente ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, RouterModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutComponent {
  private fb      = inject(FormBuilder);
  private api     = inject(ApiService);
  private router  = inject(Router);

  protected cart  = inject(CartService);
  protected auth  = inject(AuthService);

  readonly departments = COLOMBIAN_DEPARTMENTS;

  // ── Estado ──────────────────────────────────────────────────────────────────
  isProcessing  = signal(false);
  serverError   = signal<string | null>(null);
  placedOrder   = signal<OrderCreatedData | null>(null);

  // ── Formulario ───────────────────────────────────────────────────────────────
  form = this.fb.nonNullable.group({
    // Datos de envío
    firstName:  ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName:   ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    street:     ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
    city:       ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    department: ['', [Validators.required]],
    zipCode:    [''],   // opcional en Colombia
    country:    ['Colombia'],

    // Contacto — solo requerido si el usuario no está autenticado
    email: ['', [Validators.email]],
    phone: [''],

    // Método de pago
    paymentMethod: ['pse' as 'pse' | 'cash_on_delivery' | 'bank_transfer', Validators.required],
  });

  // Añadir validadores extra de contacto si no está autenticado
  constructor() {
    if (!this.auth.isAuthenticated()) {
      this.form.controls.email.addValidators([Validators.required]);
      this.form.controls.phone.addValidators([Validators.required]);
      this.form.controls.email.updateValueAndValidity();
      this.form.controls.phone.updateValueAndValidity();
    }

    // Prefill si está autenticado
    const user = this.auth.currentUser();
    if (user) {
      this.form.patchValue({
        firstName: user.firstName,
        lastName:  user.lastName,
        email:     user.email,
      });
    }
  }

  // ── Computed ─────────────────────────────────────────────────────────────────
  isGuest      = computed(() => !this.auth.isAuthenticated());
  canSubmit    = computed(() => !this.isProcessing() && !this.cart.isEmpty());

  // ── Helpers de validación ────────────────────────────────────────────────────
  field(name: keyof typeof this.form.controls): AbstractControl {
    return this.form.controls[name];
  }

  isInvalid(name: keyof typeof this.form.controls): boolean {
    const c = this.field(name);
    return c.invalid && (c.dirty || c.touched);
  }

  fieldError(name: keyof typeof this.form.controls): string {
    const errors = this.field(name).errors;
    if (!errors) return '';
    if (errors['required'])   return 'Campo requerido';
    if (errors['email'])      return 'Email inválido';
    if (errors['minlength'])  return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength'])  return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    return 'Valor inválido';
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    this.serverError.set(null);

    if (this.form.invalid) return;
    if (this.cart.isEmpty()) {
      this.serverError.set('Tu carrito está vacío');
      return;
    }

    this.isProcessing.set(true);

    try {
      const v = this.form.getRawValue();

      const payload: CreateOrderPayload = {
        items: this.cart.toOrderItems(),
        shippingAddress: {
          firstName:  v.firstName.trim(),
          lastName:   v.lastName.trim(),
          street:     v.street.trim(),
          city:       v.city.trim(),
          department: v.department.trim(),
          zipCode:    v.zipCode.trim(),
          country:    v.country.trim(),
        },
        payment: { method: v.paymentMethod },
      };

      // Incluir guestInfo solo para usuarios no autenticados
      if (!this.auth.isAuthenticated()) {
        payload.guestInfo = {
          email:     v.email.trim(),
          firstName: v.firstName.trim(),
          lastName:  v.lastName.trim(),
          phone:     v.phone.trim(),
        };
      }

      const response = await firstValueFrom(
        this.api.post<CreateOrderResponse>('/orders', payload),
      );

      if (!response.success || !response.data?.orderNumber) {
        throw new Error(response.message || 'Respuesta inesperada del servidor');
      }

      // Limpiar carrito y mostrar confirmación
      this.cart.clearCart();
      this.placedOrder.set(response.data);

    } catch (err: any) {
      const msg = err?.error?.message ?? err?.message ?? 'Error al procesar el pedido';
      this.serverError.set(msg);
    } finally {
      this.isProcessing.set(false);
    }
  }

  goToStore(): void {
    this.router.navigate(['/store']);
  }
}
