import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ShopService } from '../../services/shop.service';
import type { Product } from '../../../../shared/types/interfaces';
import { LangService } from '../../../../core/services/lang.service';
import { ShopNavbarComponent } from '../shop-navbar/shop-navbar.component';

const WHATSAPP_NUMBER = '573146583690';
const NEW_PRODUCT_DAYS = 45;

@Component({
  selector: 'app-shop-catalog',
  standalone: true,
  imports: [DecimalPipe, RouterModule, ShopNavbarComponent],
  templateUrl: './shop-catalog.html',
  styleUrl: './shop-catalog.css',
})
export class ShopCatalogComponent implements OnInit {
  shopService = inject(ShopService);
  lang = inject(LangService);
  private route = inject(ActivatedRoute);

  selectedCategory = '';
  activeFilter = '';
  private sortOption = signal<'relevance' | 'newest'>('relevance');
  catalogAnimKey = signal(0);
  private firstLoad = true;

  readonly heroImage = '/assets/portada.jpg';
  readonly fallbackImg = 'https://placehold.co/400x533/f5f5f5/a3a3a3?text=ATHENA';

  heroPills = computed(() =>
    this.lang.lang() === 'es'
      ? ['100% Prendas Premium', 'Envíos a toda Colombia', 'Atención por WhatsApp']
      : ['100% Premium Garments', 'Shipping across Colombia', 'WhatsApp Support'],
  );

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const filter = params['filter'] ?? '';
      this.activeFilter = filter;
      this.selectedCategory = '';
      this.shopService.resetFilters();

      if (filter === 'new') {
        this.sortOption.set('newest');
      } else if (filter === 'sale') {
        this.shopService.setOnlyDiscounted(true);
        this.sortOption.set('relevance');
      } else {
        this.sortOption.set('relevance');
      }

      if (!this.firstLoad || filter) {
        setTimeout(() => {
          document
            .getElementById('catalog')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }

      this.catalogAnimKey.update((k) => k + 1);
      this.firstLoad = false;
    });
  }

  sortedProducts = computed(() => {
    const products = [...this.shopService.paginatedProducts()];
    if (this.sortOption() === 'newest') {
      return products.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return products;
  });

  lookbookProducts = computed(() => this.shopService.getAllProducts().slice(0, 8));

  sectionTitle = computed(() => {
    const es = this.lang.lang() === 'es';
    if (this.activeFilter === 'new') return es ? 'NUEVOS' : 'NEW IN';
    if (this.activeFilter === 'sale') return es ? 'OFERTAS' : 'SALE';
    return this.selectedCategory || (es ? 'COLECCIÓN COMPLETA' : 'FULL COLLECTION');
  });

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.shopService.setCategory(category);
  }

  isNew(product: Product): boolean {
    const cutoff = Date.now() - NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000;
    return new Date(product.createdAt).getTime() > cutoff;
  }

  openWhatsApp(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const productUrl = `${window.location.origin}/store/product/${product.slug}`;
    const msg = encodeURIComponent(
      `Hola, estoy interesado en la prenda ${product.name}, quiero más información\n${productUrl}`,
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank', 'noopener');
  }

  previousPage(): void {
    const c = this.shopService.currentPage();
    if (c > 1) this.shopService.goToPage(c - 1);
  }

  nextPage(): void {
    const c = this.shopService.currentPage();
    if (c < this.shopService.totalPages()) this.shopService.goToPage(c + 1);
  }

  goToPage(page: number): void {
    this.shopService.goToPage(page);
  }
  retryLoad(): void {
    this.shopService.loadProducts();
  }
  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = this.fallbackImg;
  }
}
