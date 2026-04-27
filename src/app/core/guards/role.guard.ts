import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRoles: string[] = route.data['roles'] || [];
  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }
  if (requiredRoles.length === 0) return true;
  const userRole = authService.currentUser?.role || '';
  if (requiredRoles.includes(userRole)) {
    return true;
  }
  return router.createUrlTree(['/dashboard']);
};
