import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('accessToken');

    const publicRoutes = [
      '/api/v1/authentication/sign-up',
      '/api/v1/authentication/sign-in'
    ];

    // ✅ EXTRAER SOLO EL PATH de la URL completa
    const path = new URL(req.url).pathname;
    const isPublicRoute = publicRoutes.includes(path);

    console.log('🌐 Interceptando:', path);
    console.log('🔐 Es ruta pública:', isPublicRoute);
    console.log('🎫 Token disponible:', !!token);

    if (!isPublicRoute && token) {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('✅ Token agregado a la petición');
      return next.handle(authReq);
    }

    console.log('🚫 Petición enviada sin token');
    return next.handle(req);
  }
}
