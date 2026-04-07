import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/auth.guard';
import { ProductsListComponent } from './pages/products-list/products-list.component';
import { ProductFormComponent } from './pages/product-form/product-form.component';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    component: ProductsListComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'create',
    component: ProductFormComponent,
    canActivate: [adminGuard]
  },
  {
    path: ':id/edit',
    component: ProductFormComponent,
    canActivate: [adminGuard]
  }
];
