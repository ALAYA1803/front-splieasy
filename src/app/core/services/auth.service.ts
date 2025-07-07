import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { AuthResponse, SignInRequest, SignUpRequest, User } from '../interfaces/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private authUrl = `${environment.urlBackend}/authentication`;
  private usersUrl = `${environment.urlBackend}/users`;

  constructor(private http: HttpClient, private router: Router) { }

  signUp(payload: SignUpRequest): Observable<User> {
    // ✅ Removido la navegación automática para evitar duplicados
    return this.http.post<User>(`${this.authUrl}/sign-up`, payload).pipe(
      tap(user => {
        console.log('Usuario registrado correctamente:', user);
        // La navegación se maneja en el componente
      })
    );
  }

  signIn(payload: SignInRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/sign-in`, payload).pipe(
      tap(res => {
        localStorage.setItem('accessToken', res.token);
        localStorage.setItem('userId', res.id.toString());

        this.getUserById(res.id).subscribe(user => {
          localStorage.setItem('currentUser', JSON.stringify(user));
        });
      })
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
}
