import {
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

/**
 * Admin Guard
 * Protege rutas que requieren rol de administrador.
 * Solo usuarios con role === 'admin' pueden acceder.
 *
 * Uso en rutas:
 * {
 *   path: 'admin',
 *   canActivate: [adminGuard],
 *   children: [...]
 * }
 */
export const adminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = authService.isAdmin();
  const currentUser = authService.currentUser();

  // Verificar autenticación
  if (!isAuthenticated || !currentUser) {
    console.warn('❌ Usuario no autenticado. Redirigiendo a login...');
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  // Verificar si es administrador
  if (isAdmin) {
    console.log(`✅ Acceso concedido a ${currentUser.firstName} ${currentUser.lastName}`);
    return true;
  }

  // No es admin, redirigir a acceso denegado (403)
  console.warn(`🚫 Acceso denegado. Usuario ${currentUser.email} no es administrador.`);
  router.navigate(['/403']);
  return false;
};
