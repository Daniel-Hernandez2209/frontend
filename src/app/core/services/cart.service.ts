import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// ── Tipos públicos ────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;   // _id de MongoDB
  productName: string;
  sku: string;
  price: number;       // precio efectivo (discountPrice ?? price)
  quantity: number;    // 1 – MAX_QTY_PER_ITEM
  size: string;        // requerido por el backend
  image?: string;
  category?: string;
  maxStock: number;    // stock disponible para esta talla (guard de UI)
}

export interface AddToCartInput {
  productId: string;
  productName: string;
  sku: string;
  price: number;
  size: string;
  image?: string;
  category?: string;
  maxStock: number;
}

/** Payload que espera el backend en POST /api/orders */
export interface OrderItemPayload {
  product: string;
  size: string;
  quantity: number;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'athena_cart';
const MAX_QTY_PER_ITEM = 10;          // límite del backend (orders route validation)
const FREE_SHIPPING_THRESHOLD = 200_000; // COP — envío gratis sobre este valor
const SHIPPING_COST = 15_000;            // COP — costo fijo de envío
const TAX_RATE = 0.19;                   // IVA Colombia

// ── Servicio ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class CartService {
  private platformId = inject(PLATFORM_ID);

  // Estado privado — fuente de verdad única
  private _items = signal<CartItem[]>(this._loadFromStorage());

  // Controla visibilidad del drawer del carrito
  isOpen = signal(false);

  // ── Señales derivadas (solo lectura) ─────────────────────────────────
  items     = this._items.asReadonly();
  isEmpty   = computed(() => this._items().length === 0);
  itemCount = computed(() => this._items().length);
  totalQty  = computed(() => this._items().reduce((sum, i) => sum + i.quantity, 0));

  subtotal = computed(() =>
    this._items().reduce((sum, i) => sum + i.price * i.quantity, 0),
  );

  // Envío gratis a partir de FREE_SHIPPING_THRESHOLD — mismo criterio que el backend
  shipping = computed(() =>
    this.subtotal() >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST,
  );

  tax   = computed(() => Math.round(this.subtotal() * TAX_RATE));
  total = computed(() => this.subtotal() + this.shipping() + this.tax());

  constructor() {
    // Persistir en localStorage de forma reactiva
    effect(() => {
      const items = this._items();
      if (!isPlatformBrowser(this.platformId)) return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {
        // quota excedida — silencioso
      }
    });
  }

  // ── Mutaciones ───────────────────────────────────────────────────────

  /** Agrega un producto. Si ya existe la combinación producto+talla, incrementa cantidad. */
  addItem(input: AddToCartInput, quantity = 1): void {
    const safeQty = Math.max(1, Math.min(quantity, MAX_QTY_PER_ITEM));

    this._items.update((items) => {
      const idx = items.findIndex(
        (i) => i.productId === input.productId && i.size === input.size,
      );

      if (idx >= 0) {
        const existing = items[idx];
        const newQty = Math.min(
          existing.quantity + safeQty,
          MAX_QTY_PER_ITEM,
          existing.maxStock,
        );
        return items.map((item, i) => (i === idx ? { ...item, quantity: newQty } : item));
      }

      const newItem: CartItem = {
        ...input,
        quantity: Math.min(safeQty, input.maxStock),
      };
      return [...items, newItem];
    });
  }

  /** Elimina una línea de carrito por productId + talla. */
  removeItem(productId: string, size: string): void {
    this._items.update((items) =>
      items.filter((i) => !(i.productId === productId && i.size === size)),
    );
  }

  /** Actualiza la cantidad de una línea. Elimina si quantity <= 0. */
  updateQuantity(productId: string, size: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId, size);
      return;
    }
    this._items.update((items) =>
      items.map((item) =>
        item.productId === productId && item.size === size
          ? { ...item, quantity: Math.min(quantity, MAX_QTY_PER_ITEM, item.maxStock) }
          : item,
      ),
    );
  }

  /** Vacía el carrito y limpia el localStorage. */
  clearCart(): void {
    this._items.set([]);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  // ── Control del drawer ────────────────────────────────────────────────
  openCart(): void   { this.isOpen.set(true);           }
  closeCart(): void  { this.isOpen.set(false);          }
  toggleCart(): void { this.isOpen.update((v) => !v);   }

  // ── Consultas ─────────────────────────────────────────────────────────

  isInCart(productId: string, size: string): boolean {
    return this._items().some((i) => i.productId === productId && i.size === size);
  }

  getItemQty(productId: string, size: string): number {
    return (
      this._items().find((i) => i.productId === productId && i.size === size)?.quantity ?? 0
    );
  }

  /** Formatea los items para el payload de POST /api/orders */
  toOrderItems(): OrderItemPayload[] {
    return this._items().map((i) => ({
      product: i.productId,
      size: i.size,
      quantity: i.quantity,
    }));
  }

  // ── Privado ───────────────────────────────────────────────────────────

  private _loadFromStorage(): CartItem[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CartItem[];
      // Guard: descartar items malformados que puedan venir de versiones anteriores
      return parsed.filter(
        (i) =>
          i.productId &&
          i.size &&
          typeof i.price === 'number' &&
          typeof i.quantity === 'number',
      );
    } catch {
      return [];
    }
  }
}
