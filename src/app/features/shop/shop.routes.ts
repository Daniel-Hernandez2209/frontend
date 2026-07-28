import { Routes } from '@angular/router';

export const SHOP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/shop-layout.component').then((m) => m.ShopLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/shop-catalog/shop-catalog.component').then(
            (m) => m.ShopCatalogComponent,
          ),
      },
      {
        path: 'product/:id',
        loadComponent: () =>
          import('./pages/product-detail/product-detail.component').then(
            (m) => m.ProductDetailComponent,
          ),
      },
    ],
  },
];
