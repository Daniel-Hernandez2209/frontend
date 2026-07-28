import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ShopService } from '../../services/shop.service';
import type { Product } from '../../../../shared/types/interfaces';
import { LangService } from '../../../../core/services/lang.service';
import { ShopNavbarComponent } from '../../components/shop-navbar/shop-navbar.component';

const WHATSAPP_NUMBER = '573146583690';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterModule, ShopNavbarComponent],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  shopService = inject(ShopService);
  lang = inject(LangService);

  product = signal<Product | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  imageIndex = signal(0);
  selectedSize = signal<string | null>(null);
  quantity = signal(1);
  lightboxOpen = signal(false);

  currentImage = computed(() => {
    const p = this.product();
    const img = p?.images?.[this.imageIndex()];
    return img?.url ?? null;
  });

  maxQuantity = computed(() => {
    const size = this.selectedSize();
    if (!size) return 1;
    return Math.max(1, this.product()?.sizes.find((s) => s.size === size)?.stock || 0);
  });

  totalPrice = computed(() => {
    const product = this.product();
    if (!product) return 0;
    return this.shopService.getDisplayPrice(product) * this.quantity();
  });

  productTitle = computed(() => {
    const product = this.product();
    if (!product) return '';
    return this.lang.lang() === 'es' ? product.name : product.nameEn || product.name;
  });

  productDescription = computed(() => {
    const product = this.product();
    if (!product) return '';
    return this.lang.lang() === 'es' ? product.description : product.descriptionEn || product.description;
  });

  hasStock = computed(() => {
    const product = this.product();
    return product ? this.shopService.hasStock(product) : false;
  });

  ngOnInit(): void {
    this.loadProduct();
  }

  private async loadProduct(): Promise<void> {
    try {
      const slug = this.route.snapshot.paramMap.get('id');
      if (!slug) { this.error.set('Producto no encontrado'); return; }

      const product = await this.shopService.getProductDetail(slug);
      this.product.set(product);

      const firstAvailableSize = (product.sizes ?? []).find((s) => s.stock > 0);
      if (firstAvailableSize) this.selectedSize.set(firstAvailableSize.size);
    } catch (err: any) {
      this.error.set(`❌ ${err?.message || 'Failed to load product'}`);
    } finally {
      this.loading.set(false);
    }
  }

  selectImage(index: number): void { this.imageIndex.set(index); }

  selectSize(size: string): void {
    this.selectedSize.set(size);
    this.quantity.set(1);
  }

  increaseQuantity(): void {
    if (this.quantity() < this.maxQuantity()) this.quantity.update((q) => q + 1);
  }

  decreaseQuantity(): void {
    if (this.quantity() > 1) this.quantity.update((q) => q - 1);
  }

  openWhatsApp(): void {
    const product = this.product();
    if (!product) return;
    const size = this.selectedSize();
    const qty = this.quantity();
    const sizeInfo = size ? ` — ${this.lang.lang() === 'es' ? 'Talla' : 'Size'} ${size}` : '';
    const qtyInfo = qty > 1 ? ` x${qty}` : '';
    const productUrl = `${window.location.origin}/store/product/${product.slug}`;
    const msg = encodeURIComponent(
      this.lang.lang() === 'es'
        ? `Hola, estoy interesado en la prenda ${product.name}${sizeInfo}${qtyInfo}, quiero más información\n${productUrl}`
        : `Hello, I am interested in the item ${product.nameEn || product.name}${sizeInfo}${qtyInfo}, I would like more information\n${productUrl}`,
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank', 'noopener');
  }

  getSizeStock(size: string): number {
    return this.product()?.sizes.find((s) => s.size === size)?.stock || 0;
  }

  starsArray(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  }

  readonly fallbackImg = 'https://placehold.co/600x800/f5f5f5/a3a3a3?text=ATHENA';

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = this.fallbackImg;
  }
}
