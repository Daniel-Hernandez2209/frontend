import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

/**
 * Interfaz para un producto en el carrito
 */
export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
  size?: string;
  description?: string;
}

/**
 * Interfaz para la respuesta del carrito desde el servidor
 */
export interface CartResponse {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  tax: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interfaz para la respuesta del cupón desde el servidor
 */
export interface CouponResponse {
  code: string;
  discountPercentage: number;
  discountAmount: number;
  subtotal: number;
  tax: number;
  discountedTotal: number;
  message?: string;
}

/**
 * Cart Service - ACTUALIZADO
 * Gestiona el carrito de compras con Signals para estado reactivo.
 * Compatible con CartComponent.
 */
@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly apiUrl = `${environment.apiUrl}/cart`;

  // Signals para estado reactivo
  private cartItems = signal<CartItem[]>([]);
  private isLoading = signal(false);
  private error = signal<string | null>(null);
  private taxRate = signal(0.1); // 10% por defecto
  private appliedCoupon = signal<CouponResponse | null>(null);

  // ==================== COMPUTED SIGNALS ====================
  // Retornan valores reactivos calculados automáticamente

  /**
   * Obtener todos los items del carrito
   */
  cart = computed(() => this.cartItems());

  /**
   * Total de items (cantidad de unidades)
   */
  itemCount = computed(() => this.cartItems().reduce((sum, item) => sum + item.quantity, 0));

  /**
   * Total de cantidad de items (alias)
   */
  totalQuantity = computed(() => this.itemCount());

  /**
   * Subtotal (sin impuestos)
   */
  subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  /**
   * Impuestos calculados
   */
  tax = computed(() => this.subtotal() * this.taxRate());

  /**
   * Total con impuestos
   */
  total = computed(() => {
    const baseTotal = this.subtotal() + this.tax();
    const coupon = this.appliedCoupon();

    // Si hay cupón aplicado, devolver el total con descuento
    if (coupon) {
      return coupon.discountedTotal;
    }

    return baseTotal;
  });

  /**
   * Estado de carga
   */
  loading = computed(() => this.isLoading());

  /**
   * Mensaje de error
   */
  cartError = computed(() => this.error());

  /**
   * Información del cupón aplicado
   */
  appliedCouponInfo = computed(() => this.appliedCoupon());

  /**
   * Monto de descuento
   */
  discountAmount = computed(() => this.appliedCoupon()?.discountAmount || 0);

  /**
   * Porcentaje de descuento
   */
  discountPercentage = computed(() => this.appliedCoupon()?.discountPercentage || 0);

  // BehaviorSubject para compatibilidad con RxJS si es necesario
  private cartChanged = new BehaviorSubject<CartItem[]>([]);
  public cartChanged$ = this.cartChanged.asObservable();

  constructor(private http: HttpClient) {
    this.loadCartFromLocalStorage();
  }

  /**
   * Cargar carrito desde localStorage (persistencia local)
   */
  private loadCartFromLocalStorage(): void {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const items = JSON.parse(savedCart) as CartItem[];
        this.cartItems.set(items);
      }
    } catch (error) {
      console.error('Error al cargar carrito desde localStorage:', error);
    }
  }

  /**
   * Guardar carrito en localStorage
   */
  private saveCartToLocalStorage(): void {
    try {
      localStorage.setItem('cart', JSON.stringify(this.cart()));
    } catch (error) {
      console.error('Error al guardar carrito en localStorage:', error);
    }
  }

  /**
   * Obtener carrito del usuario desde el servidor
   */
  getCart(): Observable<CartResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<CartResponse>(this.apiUrl).pipe(
      tap((response) => {
        this.cartItems.set(response.items);
        this.taxRate.set(response.tax / response.subtotal || 0.1);
        this.saveCartToLocalStorage();
        this.isLoading.set(false);
      }),
      catchError((err) => {
        const errorMessage = err.error?.message || 'Error al obtener el carrito';
        this.error.set(errorMessage);
        this.isLoading.set(false);
        console.error('Error fetching cart:', err);
        return throwError(() => err);
      }),
    );
  }

  /**
   * Agregar producto al carrito
   * @param product Producto a agregar
   * @param quantity Cantidad (por defecto 1)
   */
  addToCart(product: Partial<CartItem>, quantity: number = 1): void {
    this.isLoading.set(true);
    this.error.set(null);

    const existingItem = this.cartItems().find(
      (item) => item.productId === product.productId && item.size === product.size,
    );

    if (existingItem) {
      // Incrementar cantidad si ya existe
      this.updateQuantity(product.productId!, existingItem.quantity + quantity, product.size);
    } else {
      // Agregar nuevo producto
      const newItem: CartItem = {
        productId: product.productId!,
        productName: product.productName || '',
        price: product.price || 0,
        quantity,
        image: product.image,
        description: product.description,
        sku: product.sku,
        size: product.size,
      };

      const updatedCart = [...this.cartItems(), newItem];
      this.cartItems.set(updatedCart);
      this.saveCartToLocalStorage();
      this.cartChanged.next(updatedCart);
      this.isLoading.set(false);
    }
  }

  /**
   * Actualizar cantidad de un producto en el carrito
   * @param productId ID del producto
   * @param quantity Nueva cantidad
   * @param size Talla (opcional)
   */
  updateQuantity(productId: string, quantity: number, size?: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    if (quantity <= 0) {
      this.removeFromCart(productId, size);
      return;
    }

    const updatedCart = this.cartItems().map((item) =>
      item.productId === productId && item.size === size ? { ...item, quantity } : item,
    );

    this.cartItems.set(updatedCart);
    this.saveCartToLocalStorage();
    this.cartChanged.next(updatedCart);
    this.isLoading.set(false);
  }

  /**
   * Eliminar producto del carrito
   * @param productId ID del producto
   * @param size Talla (opcional)
   */
  removeFromCart(productId: string, size?: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    const updatedCart = this.cartItems().filter(
      (item) => !(item.productId === productId && item.size === size),
    );

    this.cartItems.set(updatedCart);
    this.saveCartToLocalStorage();
    this.cartChanged.next(updatedCart);
    this.isLoading.set(false);
  }

  /**
   * Vaciar el carrito completamente
   */
  clearCart(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.cartItems.set([]);
    localStorage.removeItem('cart');
    this.cartChanged.next([]);
    this.isLoading.set(false);
  }

  /**
   * Realizar checkout (procesar la compra)
   * @returns Observable con la respuesta del servidor
   */
  checkout(): Observable<any> {
    this.isLoading.set(true);
    this.error.set(null);

    const payload = {
      items: this.cartItems(),
      subtotal: this.subtotal(),
      tax: this.tax(),
      total: this.total(),
    };

    return this.http.post(`${this.apiUrl}/checkout`, payload).pipe(
      tap(() => {
        this.clearCart();
        this.isLoading.set(false);
      }),
      catchError((err) => {
        const errorMessage = err.error?.message || 'Error al procesar la compra';
        this.error.set(errorMessage);
        this.isLoading.set(false);
        console.error('Error during checkout:', err);
        return throwError(() => err);
      }),
    );
  }

  /**
   * Obtener todos los items del carrito
   */
  getItems(): CartItem[] {
    return this.cart();
  }

  /**
   * Obtener un item específico del carrito
   */
  getItem(productId: string, size?: string): CartItem | undefined {
    return this.cartItems().find((item) => item.productId === productId && item.size === size);
  }

  /**
   * Validar carrito antes de checkout
   */
  validateCart(): boolean {
    if (this.cartItems().length === 0) {
      this.error.set('El carrito está vacío');
      return false;
    }

    const allValid = this.cartItems().every(
      (item) => item.productId && item.productName && item.price > 0 && item.quantity > 0,
    );

    if (!allValid) {
      this.error.set('El carrito contiene productos inválidos');
      return false;
    }

    return true;
  }

  /**
   * Aplicar cupón descuento
   * @param couponCode Código del cupón
   */
  applyCoupon(couponCode: string): Observable<CouponResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<CouponResponse>(`${this.apiUrl}/apply-coupon`, { code: couponCode }).pipe(
      tap((response: CouponResponse) => {
        // Aplicar el cupón y actualizar el estado
        this.appliedCoupon.set(response);
        console.log(`✅ Cupón aplicado: ${response.code}`);
        console.log(`Descuento: ${response.discountPercentage}%`);
        console.log(`Monto descuento: ${response.discountAmount}`);
        console.log(`Total final: ${response.discountedTotal}`);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        const errorMessage = err.error?.message || 'Cupón inválido o expirado';
        this.error.set(errorMessage);
        console.error(`❌ Error al aplicar cupón:`, errorMessage);
        this.isLoading.set(false);
        return throwError(() => err);
      }),
    );
  }

  /**
   * Remover cupón aplicado
   */
  removeCoupon(): void {
    this.appliedCoupon.set(null);
    this.error.set(null);
    console.log('🗑️ Cupón removido');
  }

  /**
   * Obtener cupón aplicado
   */
  getCoupon(): CouponResponse | null {
    return this.appliedCoupon();
  }

  /**
   * Establecer tasa de impuesto
   * @param rate Tasa como decimal (ej: 0.1 = 10%)
   */
  setTaxRate(rate: number): void {
    if (rate >= 0 && rate <= 1) {
      this.taxRate.set(rate);
    }
  }

  /**
   * Obtener tasa de impuesto actual
   */
  getTaxRate(): number {
    return this.taxRate();
  }
}
