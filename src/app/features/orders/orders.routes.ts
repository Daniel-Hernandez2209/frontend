import { Routes } from '@angular/router';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    component: { template: '<p>Orders List Coming Soon</p>' } as any
  },
  {
    path: ':id',
    component: { template: '<p>Order Detail Coming Soon</p>' } as any
  }
];
