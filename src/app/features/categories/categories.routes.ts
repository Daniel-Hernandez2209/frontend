import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/auth.guard';
import { CategoriesListComponent } from './pages/categories-list/categories-list.component';
import { CategoryFormComponent } from './pages/category-form/category-form.component';

export const CATEGORIES_ROUTES: Routes = [
  {
    path: '',
    component: CategoriesListComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'create',
    component: CategoryFormComponent,
    canActivate: [adminGuard]
  },
  {
    path: ':id/edit',
    component: CategoryFormComponent,
    canActivate: [adminGuard]
  }
];
