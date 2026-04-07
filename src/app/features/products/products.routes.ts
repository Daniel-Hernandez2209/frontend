import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/auth.guard';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    // loadComponent: () => import('./pages/products-list/products-list.component').then(m => m.ProductsListComponent),
    component: { template: '<p>Products List Coming Soon</p>' } as any
  },
  {
    path: 'create',
    // loadComponent: () => import('./pages/product-form/product-form.component').then(m => m.ProductFormComponent),
    component: { template: '<p>Create Product Coming Soon</p>' } as any
  },
  {
    path: ':id/edit',
    // loadComponent: () => import('./pages/product-form/product-form.component').then(m => m.ProductFormComponent),
    component: { template: '<p>Edit Product Coming Soon</p>' } as any
  },
  {
    path: ':id',
    // loadComponent: () => import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
    component: { template: '<p>Product Detail Coming Soon</p>' } as any
  }
];
