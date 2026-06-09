import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ShopService } from '../../services/shop.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-shop-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './shop-catalog.html',
  styleUrl: './shop-catalog.css',
})
export class ShopCatalogComponent {
  shopService = inject(ShopService);
  cartService = inject(CartService);

  selectedCategory = '';
  minPrice = 0;
  maxPrice = 10000;

  // Signal para mostrar mensaje de éxito
  addedToCartMessage = signal<string>('');

  /**
   * Buscar productos por texto
   */
  onSearch(event: any): void {
    const query = (event.target as HTMLInputElement).value;
    this.shopService.setSearchQuery(query);
  }

  /**
   * Cambiar categoría seleccionada
   */
  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.shopService.setCategory(category);
  }

  /**
   * Cambiar precio mínimo
   */
  onMinPriceChange(event: any): void {
    this.minPrice = parseInt((event.target as HTMLInputElement).value, 10);
    this.shopService.setPriceRange(this.minPrice, this.maxPrice);
  }

  /**
   * Cambiar precio máximo
   */
  onMaxPriceChange(event: any): void {
    this.maxPrice = parseInt((event.target as HTMLInputElement).value, 10);
    this.shopService.setPriceRange(this.minPrice, this.maxPrice);
  }

  /**
   * Limpiar todos los filtros
   */
  resetFilters(): void {
    this.selectedCategory = '';
    this.minPrice = 0;
    this.maxPrice = 10000;
    this.shopService.resetFilters();
  }

  /**
   * Agregar producto al carrito
   */
  addToCart(product: any): void {
    const displayPrice = this.shopService.getDisplayPrice(product);

    this.cartService.addToCart({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      price: displayPrice,
      image: product.images?.[0],
      description: product.description,
    });

    // Mostrar mensaje de éxito
    this.addedToCartMessage.set(`✅ ${product.name} added to cart!`);

    // Limpiar el mensaje después de 3 segundos
    setTimeout(() => {
      this.addedToCartMessage.set('');
    }, 3000);
  }

  /**
   * Ir a página anterior
   */
  previousPage(): void {
    const current = this.shopService.currentPage();
    if (current > 1) {
      this.shopService.goToPage(current - 1);
    }
  }

  /**
   * Ir a página siguiente
   */
  nextPage(): void {
    const current = this.shopService.currentPage();
    if (current < this.shopService.totalPages()) {
      this.shopService.goToPage(current + 1);
    }
  }

  /**
   * Ir a una página específica
   */
  goToPage(page: number): void {
    this.shopService.goToPage(page);
  }

  /**
   * Limpiar mensaje de carrito
   */
  clearMessage(): void {
    this.addedToCartMessage.set('');
  }

  /**
   * Reintentar cargar productos en caso de error
   */
  retryLoad(): void {
    this.shopService.loadProducts();
  }
}
