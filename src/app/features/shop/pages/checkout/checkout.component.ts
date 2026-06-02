import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../../shared/services/cart.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-base-200 p-6">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-base-900">🛒 Checkout</h1>
          <p class="text-base-600 mt-2">Complete your purchase</p>
        </div>

        <!-- Empty Cart -->
        <div *ngIf="cartService.isEmpty()" class="alert alert-warning">
          <p>Your cart is empty. <a routerLink="/store" class="link">Continue shopping</a></p>
        </div>

        <!-- Checkout Form -->
        <div *ngIf="!cartService.isEmpty()" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Form Section -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Shipping Information -->
            <div class="card bg-base-100 shadow-sm">
              <div class="card-body">
                <h2 class="text-2xl font-bold text-base-900 mb-6">Shipping Information</h2>

                <div class="grid grid-cols-2 gap-4">
                  <!-- First Name -->
                  <div class="form-control w-full">
                    <label class="label">
                      <span class="label-text font-semibold">First Name</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.firstName"
                      placeholder="John"
                      class="input input-bordered w-full"
                    />
                  </div>

                  <!-- Last Name -->
                  <div class="form-control w-full">
                    <label class="label">
                      <span class="label-text font-semibold">Last Name</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.lastName"
                      placeholder="Doe"
                      class="input input-bordered w-full"
                    />
                  </div>
                </div>

                <!-- Email -->
                <div class="form-control w-full mt-4">
                  <label class="label">
                    <span class="label-text font-semibold">Email</span>
                  </label>
                  <input
                    type="email"
                    [(ngModel)]="formData.email"
                    placeholder="john@example.com"
                    class="input input-bordered w-full"
                  />
                </div>

                <!-- Phone -->
                <div class="form-control w-full mt-4">
                  <label class="label">
                    <span class="label-text font-semibold">Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    [(ngModel)]="formData.phone"
                    placeholder="+1 (555) 000-0000"
                    class="input input-bordered w-full"
                  />
                </div>

                <!-- Address -->
                <div class="form-control w-full mt-4">
                  <label class="label">
                    <span class="label-text font-semibold">Street Address</span>
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="formData.address"
                    placeholder="123 Main St"
                    class="input input-bordered w-full"
                  />
                </div>

                <div class="grid grid-cols-2 gap-4 mt-4">
                  <!-- City -->
                  <div class="form-control w-full">
                    <label class="label">
                      <span class="label-text font-semibold">City</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.city"
                      placeholder="San Pedro"
                      class="input input-bordered w-full"
                    />
                  </div>

                  <!-- Postal Code -->
                  <div class="form-control w-full">
                    <label class="label">
                      <span class="label-text font-semibold">Postal Code</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.postalCode"
                      placeholder="12345"
                      class="input input-bordered w-full"
                    />
                  </div>
                </div>

                <!-- Country -->
                <div class="form-control w-full mt-4">
                  <label class="label">
                    <span class="label-text font-semibold">Country</span>
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="formData.country"
                    placeholder="Colombia"
                    class="input input-bordered w-full"
                  />
                </div>
              </div>
            </div>

            <!-- Payment Method -->
            <div class="card bg-base-100 shadow-sm">
              <div class="card-body">
                <h2 class="text-2xl font-bold text-base-900 mb-6">Payment Method</h2>

                <div class="space-y-3">
                  <label class="label cursor-pointer">
                    <span class="label-text">Bank Transfer</span>
                    <input
                      type="radio"
                      name="payment"
                      value="transfer"
                      [(ngModel)]="formData.paymentMethod"
                      class="radio"
                    />
                  </label>

                  <label class="label cursor-pointer">
                    <span class="label-text">Credit Card (Stripe)</span>
                    <input
                      type="radio"
                      name="payment"
                      value="stripe"
                      [(ngModel)]="formData.paymentMethod"
                      class="radio"
                    />
                  </label>

                  <label class="label cursor-pointer">
                    <span class="label-text">Cash on Delivery</span>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      [(ngModel)]="formData.paymentMethod"
                      class="radio"
                    />
                  </label>
                </div>

                <p class="text-xs text-base-600 mt-4">
                  ✓ Secure payment processing<br />
                  ✓ Your information is encrypted<br />
                  ✓ We don't store card details
                </p>
              </div>
            </div>
          </div>

          <!-- Summary Section -->
          <div class="lg:col-span-1">
            <div class="card bg-base-100 shadow-sm sticky top-6">
              <div class="card-body">
                <h2 class="text-2xl font-bold text-base-900 mb-4">Order Summary</h2>

                <!-- Items -->
                <div class="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  <div *ngFor="let item of cartService.getItems()" class="flex justify-between text-sm">
                    <span class="text-base-600">
                      {{ item.productName }}
                      <span class="text-xs">x{{ item.quantity }}</span>
                    </span>
                    <span class="font-semibold">{{ (item.price * item.quantity) | currency }}</span>
                  </div>
                </div>

                <div class="divider"></div>

                <!-- Subtotal -->
                <div class="flex justify-between mb-2">
                  <span class="text-base-600">Subtotal</span>
                  <span class="font-semibold">{{ cartService.subtotal() | currency }}</span>
                </div>

                <!-- Shipping -->
                <div class="flex justify-between mb-2">
                  <span class="text-base-600">Shipping</span>
                  <span class="font-semibold">{{ shippingCost() | currency }}</span>
                </div>

                <!-- Tax -->
                <div class="flex justify-between mb-2">
                  <span class="text-base-600">Tax (10%)</span>
                  <span class="font-semibold">{{ cartService.tax() | currency }}</span>
                </div>

                <div class="divider"></div>

                <!-- Total -->
                <div class="flex justify-between text-lg mb-6">
                  <span class="font-bold text-base-900">Total</span>
                  <span class="text-2xl font-bold text-primary">{{ finalTotal() | currency }}</span>
                </div>

                <!-- Place Order Button -->
                <button
                  (click)="placeOrder()"
                  [disabled]="isProcessing() || !isFormValid()"
                  class="btn btn-primary w-full mb-3"
                >
                  <span *ngIf="isProcessing()" class="loading loading-spinner loading-sm"></span>
                  {{ isProcessing() ? 'Processing...' : 'Place Order' }}
                </button>

                <!-- Back Button -->
                <a routerLink="/store/cart" class="btn btn-outline w-full">
                  Back to Cart
                </a>

                <!-- Trust Badges -->
                <div class="mt-4 p-3 bg-base-200 rounded text-xs text-base-600 text-center">
                  🔒 Secure Checkout | ✓ 30-day Returns
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class CheckoutComponent {
  cartService = inject(CartService);
  apiService = inject(ApiService);
  router = inject(Router);

  // Estado del formulario
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

  isProcessing = signal(false);
  shippingCost = signal(5); // $5 flat rate

  // Computed - Total final
  finalTotal = computed(() => {
    return (
      this.cartService.subtotal() +
      this.cartService.tax() +
      this.shippingCost()
    );
  });

  // Validar si el formulario está completo
  isFormValid = computed(() => {
    return (
      this.formData.firstName.trim() !== '' &&
      this.formData.lastName.trim() !== '' &&
      this.formData.email.trim() !== '' &&
      this.formData.phone.trim() !== '' &&
      this.formData.address.trim() !== '' &&
      this.formData.city.trim() !== '' &&
      this.formData.postalCode.trim() !== '' &&
      this.formData.country.trim() !== '' &&
      this.formData.paymentMethod !== ''
    );
  });

  async placeOrder(): Promise<void> {
    if (!this.isFormValid()) {
      alert('Please fill in all fields');
      return;
    }

    this.isProcessing.set(true);

    try {
      const orderData = {
        customer: {
          name: `${this.formData.firstName} ${this.formData.lastName}`,
          email: this.formData.email,
          phone: this.formData.phone,
          address: {
            street: this.formData.address,
            city: this.formData.city,
            postalCode: this.formData.postalCode,
            country: this.formData.country,
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

      // Enviar orden al backend
      const response = await this.apiService.post('/orders', orderData);
      
      // Limpiar carrito
      this.cartService.clearCart();

      // Mostrar confirmación
      alert(
        `Order placed successfully!\nOrder ID: ${response._id}\n\nYou will receive an email confirmation shortly.`,
      );

      // Redirigir al dashboard o home
      this.router.navigate(['/admin/orders']);
    } catch (error: any) {
      alert(`Error placing order: ${error.message || 'Please try again'}`);
    } finally {
      this.isProcessing.set(false);
    }
  }
}
