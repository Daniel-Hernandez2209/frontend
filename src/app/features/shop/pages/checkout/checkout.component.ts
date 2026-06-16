import { Component, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../../../shared/services/cart.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiService } from '../../../../core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';

// ── Tipos ─────────────────────────────────────────────────────────────────────

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
  payment: { method: 'wompi' | 'pse' | 'cash_on_delivery' | 'bank_transfer' };
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

interface IntegrityResponse {
  success: boolean;
  data: {
    integrity: string;
    publicKey: string;
    reference: string;
    amountInCents: number;
    currency: string;
  };
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

  readonly paymentMethods = [
    {
      value: 'wompi',
      label: 'Tarjeta, PSE, Nequi o Daviplata',
      desc: 'Paga con cualquier método digital vía Wompi (Bancolombia)',
      icon: '💳',
      bg: '#FFF7ED',
      info: 'Serás redirigido a la pasarela segura de Wompi donde podrás elegir entre tarjeta débito/crédito, PSE, Nequi, Daviplata y más.',
      badge: 'Recomendado',
    },
    {
      value: 'bank_transfer',
      label: 'Transferencia bancaria',
      desc: 'Recibirás los datos de la cuenta por email',
      icon: '💸',
      bg: '#F0FDF4',
      info: 'Te enviaremos los datos de nuestra cuenta Bancolombia al correo registrado. Tu pedido se procesa al confirmar el pago (1-2 días hábiles).',
      badge: null,
    },
    {
      value: 'cash_on_delivery',
      label: 'Pago contra entrega',
      desc: 'Paga en efectivo al recibir tu pedido',
      icon: '📦',
      bg: '#FFFBEB',
      info: 'Disponible solo para ciudades con cobertura de nuestro servicio de mensajería. Ten el valor exacto listo al recibir.',
      badge: null,
    },
  ] as const;

  // ── Estado ──────────────────────────────────────────────────────────────────
  isProcessing  = signal(false);
  serverError   = signal<string | null>(null);
  placedOrder   = signal<OrderCreatedData | null>(null);

  // ── Formulario ───────────────────────────────────────────────────────────────
  form = this.fb.nonNullable.group({
    firstName:  ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName:   ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    street:     ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
    city:       ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    department: ['', [Validators.required]],
    zipCode:    [''],
    country:    ['Colombia'],
    email:      ['', [Validators.email]],
    phone:      [''],
    paymentMethod: ['wompi' as 'wompi' | 'pse' | 'cash_on_delivery' | 'bank_transfer', Validators.required],
  });

  constructor() {
    if (!this.auth.isAuthenticated()) {
      this.form.controls.email.addValidators([Validators.required]);
      this.form.controls.phone.addValidators([Validators.required]);
      this.form.controls.email.updateValueAndValidity();
      this.form.controls.phone.updateValueAndValidity();
    }

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

  isWompi(): boolean {
    return this.form.controls['paymentMethod'].value === 'wompi';
  }

  // ── Validación ────────────────────────────────────────────────────────────────
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

      const order = response.data;

      // Wompi: redirigir a la pasarela
      if (v.paymentMethod === 'wompi') {
        await this.redirectToWompi(order);
        return; // no limpiar carrito aquí — se limpia en la página de resultado
      }

      // Otros métodos: mostrar confirmación directa
      this.cart.clearCart();
      this.placedOrder.set(order);

    } catch (err: any) {
      const msg = err?.error?.message ?? err?.message ?? 'Error al procesar el pedido';
      this.serverError.set(msg);
    } finally {
      this.isProcessing.set(false);
    }
  }

  private async redirectToWompi(order: OrderCreatedData): Promise<void> {
    const amountInCents = Math.round(order.total * 100);

    const intRes = await firstValueFrom(
      this.api.post<IntegrityResponse>('/payments/wompi/integrity', {
        reference: order.orderNumber,
        amountInCents,
      }),
    );

    if (!intRes.success) throw new Error('No se pudo iniciar el pago con Wompi');

    const { integrity, publicKey } = intRes.data;
    const redirectUrl = `${window.location.origin}/checkout/result`;

    const params = new URLSearchParams({
      'public-key': publicKey || environment.wompiPublicKey,
      'currency': 'COP',
      'amount-in-cents': String(amountInCents),
      'reference': order.orderNumber,
      'signature:integrity': integrity,
      'redirect-url': redirectUrl,
    });

    // Guardar número de pedido en sessionStorage para leerlo en la página de resultado
    sessionStorage.setItem('wompi_order', order.orderNumber);

    window.location.href = `https://checkout.wompi.co/p/?${params.toString()}`;
  }

  goToStore(): void {
    this.router.navigate(['/store']);
  }
}
