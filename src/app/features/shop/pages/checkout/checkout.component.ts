import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../../../shared/services/cart.service';
import { ApiService } from '../../../../core/services/api.service';
import { firstValueFrom } from 'rxjs';

interface OrderData {
  customer: {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
  };
  items: any[];
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  paymentMethod: 'transfer' | 'stripe' | 'cod';
  status: string;
}

interface OrderResponse {
  _id: string;
  [key: string]: any;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutComponent {
  cartService = inject(CartService);
  apiService = inject(ApiService);
  router = inject(Router);

  // ── Estado del formulario ──────────────────────────────────────────
  formData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Colombia',
    paymentMethod: 'transfer' as 'transfer' | 'stripe' | 'cod',
  };

  // ── Signals ────────────────────────────────────────────────────────
  isProcessing = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  shippingCost = signal(5); // $5 flat rate

  // ── Computed ───────────────────────────────────────────────────────
  /**
   * Total final (subtotal + impuestos + envío)
   */
  finalTotal = computed(() => {
    return this.cartService.subtotal() + this.cartService.tax() + this.shippingCost();
  });

  /**
   * Verificar si el carrito está vacío
   */
  isCartEmpty = computed(() => this.cartService.isEmpty());

  /**
   * Verificar si el formulario es válido
   */
  isFormValid = computed(() => {
    const { firstName, lastName, email, phone, address, city, postalCode, country } = this.formData;

    return (
      firstName.trim() !== '' &&
      lastName.trim() !== '' &&
      email.trim() !== '' &&
      this.isValidEmail(email) &&
      phone.trim() !== '' &&
      address.trim() !== '' &&
      city.trim() !== '' &&
      postalCode.trim() !== '' &&
      country.trim() !== ''
    );
  });

  /**
   * Verificar si el botón debe estar deshabilitado
   */
  isButtonDisabled = computed(() => {
    return this.isProcessing() || !this.isFormValid() || this.isCartEmpty();
  });

  /**
   * Validar email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Limpiar mensaje de error
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Limpiar mensaje de éxito
   */
  clearSuccess(): void {
    this.success.set(null);
  }

  /**
   * Validar formulario antes de enviar
   */
  validateForm(): boolean {
    if (this.isCartEmpty()) {
      this.error.set('Your cart is empty');
      return false;
    }

    if (!this.isFormValid()) {
      this.error.set('Please fill in all fields correctly');
      return false;
    }

    return true;
  }

  /**
   * Crear objeto de datos para la orden
   */
  private createOrderData(): OrderData {
    return {
      customer: {
        name: `${this.formData.firstName.trim()} ${this.formData.lastName.trim()}`,
        email: this.formData.email.trim(),
        phone: this.formData.phone.trim(),
        address: {
          street: this.formData.address.trim(),
          city: this.formData.city.trim(),
          postalCode: this.formData.postalCode.trim(),
          country: this.formData.country.trim(),
        },
      },
      items: this.cartService.getItems(),
      totals: {
        subtotal: this.cartService.subtotal(),
        tax: this.cartService.tax(),
        shipping: this.shippingCost(),
        total: this.finalTotal(),
      },
      paymentMethod: this.formData.paymentMethod,
      status: 'pending',
    };
  }

  /**
   * Procesar la orden
   */
  async placeOrder(): Promise<void> {
    // Limpiar mensajes previos
    this.error.set(null);
    this.success.set(null);

    // Validar
    if (!this.validateForm()) {
      return;
    }

    this.isProcessing.set(true);

    try {
      const orderData = this.createOrderData();

      // 📤 Enviar orden al backend
      const response = await firstValueFrom(
        this.apiService.post<OrderResponse>('/orders', orderData),
      );

      if (!response || !response._id) {
        throw new Error('Invalid response from server');
      }

      // ✅ Éxito
      this.success.set(
        `Order placed successfully!\nOrder ID: ${response._id}\n\nYou will receive an email confirmation shortly.`,
      );

      // 🧹 Limpiar carrito después de 1 segundo
      setTimeout(() => {
        this.cartService.clearCart();
      }, 1000);

      // 🔄 Redirigir después de 2 segundos
      setTimeout(() => {
        this.router.navigate(['/admin/orders']);
      }, 2000);
    } catch (error: any) {
      const errorMessage = error?.error?.message || error?.message || 'Failed to place order';
      this.error.set(`Error: ${errorMessage}`);
      console.error('Order placement error:', error);
    } finally {
      this.isProcessing.set(false);
    }
  }

  /**
   * Obtener items del carrito
   */
  getCartItems() {
    return this.cartService.getItems();
  }
}
