import {
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

/**
 * Auth Guard
 * Protege rutas que requieren autenticación.
 * Redirige a login si el usuario no está autenticado.
 *
 * Uso en rutas:
 * {
 *   path: 'dashboard',
 *   canActivate: [authGuard],
 *   component: DashboardComponent
 * }
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si el usuario está autenticado
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.currentUser();

  if (isAuthenticated && currentUser) {
    // Usuario autenticado, permitir acceso
    console.log(`✅ Acceso concedido a ${currentUser.name}`);
    return true;
  }

  // No autenticado, redirigir a login
  console.warn('❌ Usuario no autenticado. Redirigiendo a login...');
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url },
  });
  return false;
};
