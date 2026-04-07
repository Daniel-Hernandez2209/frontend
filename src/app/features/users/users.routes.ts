import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    component: { template: '<p>Users List Coming Soon</p>' } as any
  },
  {
    path: ':id',
    component: { template: '<p>User Detail Coming Soon</p>' } as any
  }
];
