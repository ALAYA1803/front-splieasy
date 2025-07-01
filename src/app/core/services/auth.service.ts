import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.urlBackend}/users`; // si usas json-server

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(users => {
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
          const token = btoa(`${user.email}:${user.password}`); // falso token
          localStorage.setItem('accessToken', token);
          localStorage.setItem('userRole', user.role);
          localStorage.setItem('currentUser', JSON.stringify(user));
          return user;
        } else {
          throw new Error('Credenciales inválidas');
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  getUserRole(): string | null {
    return localStorage.getItem('userRole');
  }
}
