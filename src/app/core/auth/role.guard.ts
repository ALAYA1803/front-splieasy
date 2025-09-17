import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { JwtService } from './jwt.service';


@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private jwt: JwtService, private router: Router) {}


  canActivate(route: ActivatedRouteSnapshot): boolean {
    const allowed = route.data['roles'] as string[] | undefined;
    const roles = this.jwt.getRoles();


    if (!allowed || allowed.length === 0) return true;


    const ok = roles.some(r => allowed.includes(r));
    if (!ok) {
      if (roles.includes('ROLE_REPRESENTANTE')) {
        this.router.navigateByUrl('/representative/home');
      } else {
        this.router.navigateByUrl('/autenticacion/login');
      }
    }
    return ok;
  }
}
