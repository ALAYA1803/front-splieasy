import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    if (req.method === 'OPTIONS') {
      return next.handle(req);
    }

    const token =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      (() => {
        try {
          const cu = JSON.parse(localStorage.getItem('currentUser') || 'null');
          return cu?.accessToken || cu?.token || null;
        } catch {
          return null;
        }
      })();

    const isAbsolute = /^https?:\/\//i.test(req.url);
    const backendBase = (environment.urlBackend || '').replace(/\/+$/, '');

    const path = isAbsolute ? new URL(req.url).pathname
      : (req.url.startsWith('/') ? req.url : `/${req.url}`);

    const isBackendUrl = isAbsolute
      ? (backendBase && req.url.startsWith(backendBase))
      : (path.startsWith('/api/v1') || path.startsWith('/api/'));

    const publicPaths = new Set<string>([
      '/api/v1/authentication/sign-in',
      '/api/v1/authentication/sign-up'
    ]);
    const isPublic = publicPaths.has(path);

    const isFormData = req.body instanceof FormData;
    let headers = req.headers.set('Accept', 'application/json');

    if (isBackendUrl && !isPublic && token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    if (!isFormData && !headers.has('Content-Type')) {
      headers = headers.set('Content-Type', 'application/json');
    }

    const authReq = req.clone({ headers });

    const debug = (environment as any)?.production !== true;
    if (debug) {
      console.log(
        'Interceptando:', path,
        '| Backend:', isBackendUrl,
        '| Pública:', isPublic,
        '| Token:', !!token,
        '| FormData:', isFormData
      );
    }

    return next.handle(authReq);
  }
}
