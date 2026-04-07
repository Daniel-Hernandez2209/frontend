import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/auth.guard';
import { OrdersListComponent } from './pages/orders-list/orders-list.component';
import { OrderDetailComponent } from './pages/order-detail/order-detail.component';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    component: OrdersListComponent,
    canActivate: [adminGuard]
  },
  {
    path: ':id',
    component: OrderDetailComponent,
    canActivate: [adminGuard]
  }
];
