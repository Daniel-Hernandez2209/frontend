import {
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

/**
 * Public Guard
 * Evita que usuarios autenticados accedan a rutas públicas como login y registro.
 * Redirige a dashboard si ya está autenticado.
 *
 * Uso en rutas:
 * {
 *   path: 'auth',
 *   canActivate: [publicGuard],
 *   children: [
 *     { path: 'login', component: LoginComponent },
 *     { path: 'register', component: RegisterComponent }
 *   ]
 * }
 */
export const publicGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.currentUser();

  if (isAuthenticated && currentUser) {
    // Ya está autenticado, redirigir al dashboard
    console.info(`ℹ️ Usuario ${currentUser.firstName} ${currentUser.lastName} ya autenticado. Redirigiendo al dashboard...`);
    router.navigate(['/dashboard']);
    return false;
  }

  // No autenticado, permitir acceso a ruta pública
  return true;
};
