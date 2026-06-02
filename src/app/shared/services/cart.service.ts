import { Injectable, signal, computed, effect } from '@angular/core';

export interface CartItem {
  _id: string;
  productId: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  category?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  subtotal: number;
  itemCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  // ── Estado ──────────────────────────────────────────────────────────
  private cartItems = signal<CartItem[]>(this.loadFromLocalStorage());

  // ── Computed (valores derivados) ─────────────────────────────────────
  itemCount = computed(() => this.cartItems().length);

  totalQuantity = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0),
  );

  subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  // Impuesto (10% por defecto, puede cambiar según región)
  tax = computed(() => this.subtotal() * 0.1);

  // Total con impuestos
  total = computed(() => this.subtotal() + this.tax());

  // Carrito completo para readonly access
  cart = computed<Cart>(() => ({
    items: this.cartItems(),
    total: this.total(),
    subtotal: this.subtotal(),
    itemCount: this.itemCount(),
  }));

  constructor() {
    // ── Efecto: Guardar en localStorage cuando cambie el carrito ─────
    effect(() => {
      const items = this.cartItems();
      localStorage.setItem('athena_cart', JSON.stringify(items));
    });
  }

  // ── MÉTODOS PÚBLICOS ────────────────────────────────────────────────

  /**
   * Agregar producto al carrito
   * Si ya existe, incrementa la cantidad
   */
  addToCart(product: Partial<CartItem>, quantity: number = 1): void {
    const items = this.cartItems();
    const existingItem = items.find(
      (item) =>
        item.productId === product.productId &&
        item.size === product.size,
    );

    if (existingItem) {
      // Incrementar cantidad
      existingItem.quantity += quantity;
    } else {
      // Agregar nuevo item
      const newItem: CartItem = {
        _id: product._id || '',
        productId: product.productId || '',
        productName: product.productName || '',
        sku: product.sku || '',
        price: product.price || 0,
        quantity,
        image: product.image,
        size: product.size,
        category: product.category,
      };
      items.push(newItem);
    }

    this.cartItems.set([...items]);
  }

  /**
   * Remover producto del carrito
   */
  removeFromCart(productId: string, size?: string): void {
    const items = this.cartItems().filter(
      (item) =>
        !(item.productId === productId && item.size === size),
    );
    this.cartItems.set(items);
  }

  /**
   * Actualizar cantidad de un producto
   */
  updateQuantity(productId: string, quantity: number, size?: string): void {
    const items = this.cartItems();
    const item = items.find(
      (i) => i.productId === productId && i.size === size,
    );

    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId, size);
      } else {
        item.quantity = quantity;
        this.cartItems.set([...items]);
      }
    }
  }

  /**
   * Obtener item específico
   */
  getItem(productId: string, size?: string): CartItem | undefined {
    return this.cartItems().find(
      (item) => item.productId === productId && item.size === size,
    );
  }

  /**
   * Obtener todos los items
   */
  getItems(): CartItem[] {
    return this.cartItems();
  }

  /**
   * Limpiar el carrito
   */
  clearCart(): void {
    this.cartItems.set([]);
    localStorage.removeItem('athena_cart');
  }

  /**
   * Verificar si carrito está vacío
   */
  isEmpty(): boolean {
    return this.cartItems().length === 0;
  }

  /**
   * Obtener el estado del carrito
   */
  getCart(): Cart {
    return this.cart();
  }

  // ── MÉTODOS PRIVADOS ────────────────────────────────────────────────

  /**
   * Cargar carrito desde localStorage
   */
  private loadFromLocalStorage(): CartItem[] {
    try {
      const saved = localStorage.getItem('athena_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }
}
