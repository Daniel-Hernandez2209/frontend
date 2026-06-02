import { Routes } from '@angular/router';
import { ShopCatalogComponent } from './components/shop-catalog/shop-catalog.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CartComponent } from './components/cart/cart.component';

export const SHOP_ROUTES: Routes = [
  {
    path: '',
    component: ShopCatalogComponent,
  },
  {
    path: 'product/:id',
    component: ProductDetailComponent,
  },
  {
    path: 'cart',
    component: CartComponent,
  },
];
