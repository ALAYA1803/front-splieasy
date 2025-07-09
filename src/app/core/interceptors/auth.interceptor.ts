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

    const publicApiRoutes = [
      '/api/v1/authentication/sign-up',
      '/api/v1/authentication/sign-in'
    ];

    // --- INICIO DE LA CORRECCIÓN ---
    // Verificamos si la URL es una llamada a la API o un recurso local (como /assets)
    const isApiRoute = req.url.startsWith('http');

    // Solo intentamos extraer el path si es una ruta de la API
    const path = isApiRoute ? new URL(req.url).pathname : req.url;

    // Una ruta es pública si es una ruta de la API y está en nuestra lista de rutas públicas.
    const isPublicRoute = publicApiRoutes.includes(path);
    // --- FIN DE LA CORRECCIÓN ---


    // Tus logs siguen siendo útiles para depurar
    console.log('🌐 Interceptando:', path);
    console.log('🔐 Es ruta de API pública:', isPublicRoute);
    console.log('🎫 Token disponible:', !!token);


    // La lógica para añadir el token ahora solo aplica a rutas de API no públicas
    if (isApiRoute && !isPublicRoute && token) {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('✅ Token agregado a la petición de API');
      return next.handle(authReq);
    }

    // Para las rutas públicas y las peticiones locales (traducciones), la petición pasa sin modificarse.
    console.log('🚫 Petición local o pública, se envía sin token.');
    return next.handle(req);
  }
}
