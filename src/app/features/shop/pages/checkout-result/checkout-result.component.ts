import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';
import { CartService } from '../../../../shared/services/cart.service';
import { firstValueFrom } from 'rxjs';

interface TransactionResult {
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING' | null;
  reference: string | null;
  amountInCents: number | null;
  paymentMethod: string | null;
}

@Component({
  selector: 'app-checkout-result',
  standalone: true,
  imports: [RouterModule, CurrencyPipe],
  template: `
    <header class="bg-white border-b border-neutral-100 px-6 py-3 flex items-center justify-between">
      <a routerLink="/store" class="flex items-center gap-2 font-extrabold text-lg tracking-tight">
        <div class="w-7 h-7 bg-black rounded-md flex items-center justify-center">
          <span class="text-white font-bold text-xs">AB</span>
        </div>
        ATHENA BRAND
      </a>
    </header>

    <main class="min-h-[calc(100vh-57px)] bg-neutral-50 flex items-center justify-center p-6">
      <div class="max-w-md w-full">

        @if (loading()) {
          <div class="text-center py-16">
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <p class="mt-4 text-neutral-500 text-sm">Verificando tu pago…</p>
          </div>
        }

        @if (!loading() && result()) {

          <!-- ✅ APROBADO -->
          @if (result()!.status === 'APPROVED') {
            <div class="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8 text-center flex flex-col items-center gap-5">
              <div class="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
                <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div>
                <h1 class="text-2xl font-black text-black">¡Pago exitoso!</h1>
                <p class="text-neutral-500 text-sm mt-1">Tu pedido ha sido confirmado.</p>
              </div>
              @if (result()!.reference) {
                <div class="w-full bg-neutral-50 rounded-2xl p-4 flex flex-col gap-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-neutral-400">Pedido</span>
                    <span class="font-bold font-mono text-black">{{ result()!.reference }}</span>
                  </div>
                  @if (result()!.amountInCents) {
                    <div class="flex justify-between">
                      <span class="text-neutral-400">Total pagado</span>
                      <span class="font-semibold">{{ (result()!.amountInCents! / 100) | currency:'COP':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                  @if (result()!.paymentMethod) {
                    <div class="flex justify-between">
                      <span class="text-neutral-400">Método</span>
                      <span class="capitalize">{{ result()!.paymentMethod }}</span>
                    </div>
                  }
                </div>
              }
              <p class="text-xs text-neutral-400">Recibirás un email de confirmación con los detalles de tu pedido.</p>
              <a routerLink="/store" class="btn btn-primary w-full rounded-2xl">
                Seguir comprando
              </a>
            </div>
          }

          <!-- ❌ RECHAZADO / ERROR -->
          @if (result()!.status === 'DECLINED' || result()!.status === 'VOIDED' || result()!.status === 'ERROR') {
            <div class="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8 text-center flex flex-col items-center gap-5">
              <div class="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
                <svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <div>
                <h1 class="text-2xl font-black text-black">Pago no aprobado</h1>
                <p class="text-neutral-500 text-sm mt-1">Tu pago fue rechazado. Puedes intentarlo de nuevo.</p>
              </div>
              <div class="flex flex-col gap-2 w-full">
                <a routerLink="/checkout" class="btn btn-primary w-full rounded-2xl">
                  Intentar de nuevo
                </a>
                <a routerLink="/store" class="btn btn-ghost btn-sm w-full rounded-2xl">
                  Volver a la tienda
                </a>
              </div>
            </div>
          }

          <!-- ⏳ PENDIENTE -->
          @if (result()!.status === 'PENDING' || result()!.status === null) {
            <div class="bg-white rounded-3xl shadow-sm border border-neutral-100 p-8 text-center flex flex-col items-center gap-5">
              <div class="w-20 h-20 rounded-full bg-yellow-50 flex items-center justify-center">
                <svg class="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <h1 class="text-2xl font-black text-black">Pago en proceso</h1>
                <p class="text-neutral-500 text-sm mt-1">Tu pago está siendo procesado. Te notificaremos por email cuando se confirme.</p>
              </div>
              @if (result()!.reference) {
                <div class="w-full bg-neutral-50 rounded-2xl p-4 text-sm">
                  <div class="flex justify-between">
                    <span class="text-neutral-400">Pedido</span>
                    <span class="font-bold font-mono">{{ result()!.reference }}</span>
                  </div>
                </div>
              }
              <a routerLink="/store" class="btn btn-primary w-full rounded-2xl">
                Volver a la tienda
              </a>
            </div>
          }

        }

      </div>
    </main>
  `,
})
export class CheckoutResultComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private api    = inject(ApiService);
  private cart   = inject(CartService);

  loading = signal(true);
  result  = signal<TransactionResult | null>(null);

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParams;

    // Wompi redirige con ?id=<transaction_id>&...
    const transactionId = params['id'];

    if (!transactionId) {
      // No hay transacción — mostrar estado pendiente con referencia del sessionStorage
      const reference = sessionStorage.getItem('wompi_order');
      this.result.set({ status: null, reference, amountInCents: null, paymentMethod: null });
      this.loading.set(false);
      return;
    }

    try {
      const res = await firstValueFrom(
        this.api.get<{ success: boolean; data: TransactionResult }>(`/payments/wompi/transaction/${transactionId}`),
      );

      this.result.set(res.data);

      if (res.data.status === 'APPROVED') {
        this.cart.clearCart();
        sessionStorage.removeItem('wompi_order');
      }
    } catch {
      // Si falla la consulta, mostrar estado desde los params de Wompi
      const status = params['payment_status'] as TransactionResult['status'] ?? null;
      const reference = params['reference'] ?? sessionStorage.getItem('wompi_order');
      this.result.set({ status, reference, amountInCents: null, paymentMethod: null });
    } finally {
      this.loading.set(false);
    }
  }
}
