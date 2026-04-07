import { Routes } from '@angular/router';

export const CATEGORIES_ROUTES: Routes = [
  {
    path: '',
    component: { template: '<p>Categories List Coming Soon</p>' } as any
  },
  {
    path: 'create',
    component: { template: '<p>Create Category Coming Soon</p>' } as any
  },
  {
    path: ':slug/edit',
    component: { template: '<p>Edit Category Coming Soon</p>' } as any
  }
];
