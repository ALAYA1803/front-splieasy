import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

function getToken(): string | null {
  const direct =
    localStorage.getItem('accessToken') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token');

  if (direct) return direct;

  try {
    const cu = localStorage.getItem('currentUser');
    if (cu) {
      const obj = JSON.parse(cu);
      return obj?.accessToken || obj?.token || null;
    }
  } catch {}
  return null;
}

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = getToken();
    const authReq = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          console.warn(' 401 capturado por interceptor', err.url);
        }
        return throwError(() => err);
      })
    );
  }
}
