import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { map, Observable, switchMap, tap } from 'rxjs';
import { AuthResponse, SignInRequest, SignUpRequest, User } from '../interfaces/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private authUrl = `${environment.urlBackend}/authentication`;
  private usersUrl = `${environment.urlBackend}/users`;

  constructor(private http: HttpClient, private router: Router) { }

  signUp(payload: SignUpRequest): Observable<User> {
    return this.http.post<User>(`${this.authUrl}/sign-up`, payload).pipe(
      tap(user => {
        console.log('Usuario registrado correctamente:', user);
      })
    );
  }

  signIn(payload: SignInRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${this.authUrl}/sign-in`, payload).pipe(
      tap(res => {
        localStorage.setItem('accessToken', res.token);
        localStorage.setItem('userId', res.id.toString());
      }),
      // Esperamos la respuesta del usuario para guardar su rol
      switchMap(res => this.getUserById(res.id).pipe(
        tap(user => {
          localStorage.setItem('currentUser', JSON.stringify(user));

          // Guarda el primer rol explícitamente
          if (user.roles && user.roles.length > 0) {
            localStorage.setItem('userRole', user.roles[0]);
          } else {
            localStorage.setItem('userRole', '');
          }
        })
      ))
    );
  }

  getUserById(id: number): Observable<User> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<User>(`${this.usersUrl}/${id}`, { headers });
  }

  getAllUsers(): Observable<User[]> {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<User[]>(`${this.usersUrl}`, { headers });
  }

  // 📛 Obtiene el rol actual del usuario
  getCurrentRole(): string {
    return localStorage.getItem('userRole') || '';
  }


  // 🧹 Limpia el localStorage (útil para logout)
  clearSession() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
  }
}
