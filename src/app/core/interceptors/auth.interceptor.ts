import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      (() => {
        try {
          const cu = JSON.parse(localStorage.getItem('currentUser') || 'null');
          return cu?.accessToken || cu?.token || null;
        } catch { return null; }
      })();

    const isAbsolute = /^https?:\/\//i.test(req.url);
    const isBackendUrl =
      (isAbsolute && req.url.startsWith(environment.urlBackend)) ||
      (!isAbsolute && req.url.startsWith('/api/')); // por si usas paths relativos

    const path = isAbsolute ? new URL(req.url).pathname : req.url;
    const isPublic = ['/api/v1/authentication/sign-up', '/api/v1/authentication/sign-in'].includes(path);

    console.log(' Interceptando:', path);
    console.log(' Es backend URL:', isBackendUrl, ' | Pública:', isPublic);
    console.log(' Token disponible:', !!token);

    if (isBackendUrl && !isPublic && token) {
      const authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
      console.log(' Token agregado:', (authReq.headers.get('Authorization') || '').slice(0, 25) + '...');
      return next.handle(authReq);
    }

    console.log(' Sin token (no backend o pública)');
    return next.handle(req);
  }
}
