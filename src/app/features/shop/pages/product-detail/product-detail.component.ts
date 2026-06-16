import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ShopService, Product } from '../../services/shop.service';
import { CartService } from '../../../../shared/services/cart.service';
import { LangService } from '../../../../core/services/lang.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  shopService = inject(ShopService);
  cartService = inject(CartService);
  lang = inject(LangService);

  // ── Estado con Signals ──────────────────────────────────────────────
  product = signal<Product | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  imageIndex = signal(0);
  selectedSize = signal<string | null>(null);
  quantity = signal(1);
  isAddingToCart = signal(false);
  lightboxOpen = signal(false);

  // ── Computed ────────────────────────────────────────────────────────
  /**
   * Imagen actual seleccionada
   */
  currentImage = computed(() => {
    const p = this.product();
    const img = p?.images?.[this.imageIndex()];
    return img?.url ?? null;
  });

  /**
   * Cantidad máxima disponible para la talla seleccionada
   */
  maxQuantity = computed(() => {
    const size = this.selectedSize();
    if (!size) return 1;
    const sizeStock = this.product()?.sizes.find((s) => s.size === size)?.stock || 0;
    return Math.max(1, sizeStock);
  });

  /**
   * Precio total basado en cantidad
   */
  totalPrice = computed(() => {
    const product = this.product();
    if (!product) return 0;
    return this.shopService.getDisplayPrice(product) * this.quantity();
  });

  /**
   * Verificar si el producto tiene stock
   */
  hasStock = computed(() => {
    const product = this.product();
    return product ? this.shopService.hasStock(product) : false;
  });

  /**
   * Verificar si se puede agregar al carrito
   */
  canAddToCart = computed(() => {
    return this.hasStock() && this.selectedSize() !== null && !this.isAddingToCart();
  });

  ngOnInit(): void {
    this.loadProduct();
  }

  /**
   * Cargar detalles del producto
   */
  private async loadProduct(): Promise<void> {
    try {
      const slug = this.route.snapshot.paramMap.get('id');
      if (!slug) {
        this.error.set('Producto no encontrado');
        return;
      }

      const product = await this.shopService.getProductDetail(slug);
      this.product.set(product);

      // Auto-seleccionar primera talla disponible
      const firstAvailableSize = (product.sizes ?? []).find((s) => s.stock > 0);
      if (firstAvailableSize) {
        this.selectedSize.set(firstAvailableSize.size);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to load product';
      this.error.set(`❌ ${errorMessage}`);
      console.error('Error loading product:', err);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Seleccionar una imagen de la galería
   */
  selectImage(index: number): void {
    this.imageIndex.set(index);
  }

  /**
   * Seleccionar una talla
   */
  selectSize(size: string): void {
    this.selectedSize.set(size);
    this.quantity.set(1); // Reset cantidad al cambiar talla
  }

  /**
   * Aumentar cantidad
   */
  increaseQuantity(): void {
    const max = this.maxQuantity();
    if (this.quantity() < max) {
      this.quantity.update((q) => q + 1);
    }
  }

  /**
   * Disminuir cantidad
   */
  decreaseQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update((q) => q - 1);
    }
  }

  /**
   * Actualizar cantidad manualmente
   */
  updateQuantity(event: any): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    if (value > 0 && value <= this.maxQuantity()) {
      this.quantity.set(value);
    }
  }

  /**
   * Limpiar mensaje de error
   */
  readonly fallbackImg = 'https://placehold.co/600x800/f5f5f5/a3a3a3?text=ATHENA';

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = this.fallbackImg;
  }

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
   * Agregar producto al carrito
   */
  async addToCart(): Promise<void> {
    const product = this.product();
    const size = this.selectedSize();
    const qty = this.quantity();

    // Validar
    if (!product) {
      this.error.set('❌ Product not found');
      return;
    }

    if (!size) {
      this.error.set('❌ Please select a size');
      return;
    }

    if (qty <= 0) {
      this.error.set('❌ Invalid quantity');
      return;
    }

    this.isAddingToCart.set(true);
    this.error.set(null);

    try {
      // Agregar al carrito
      const primaryImage = product.images?.[0]?.url;
      const sizeData = product.sizes?.find((s) => s.size === size);

      this.cartService.addItem(
        {
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          price: this.shopService.getDisplayPrice(product),
          image: primaryImage,
          size,
          category: product.category,
          maxStock: sizeData?.stock ?? 10,
        },
        qty,
      );

      // Mostrar éxito
      this.success.set(`✅ ${qty} x ${product.name} (Size: ${size}) added to cart!`);

      // Reset cantidad después de agregar
      this.quantity.set(1);

      // Auto-limpiar mensaje después de 3 segundos
      setTimeout(() => {
        this.clearSuccess();
      }, 3000);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to add to cart';
      this.error.set(`❌ ${errorMessage}`);
      console.error('Error adding to cart:', err);
    } finally {
      this.isAddingToCart.set(false);
    }
  }

  /**
   * Ir directamente al carrito
   */
  goToCart(): void {
    this.router.navigate(['/store/cart']);
  }

  /**
   * Obtener stock disponible para una talla específica
   */
  getSizeStock(size: string): number {
    return this.product()?.sizes.find((s) => s.size === size)?.stock || 0;
  }

  starsArray(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  }
}
