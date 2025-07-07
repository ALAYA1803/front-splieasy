import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AuthResponse, SignInRequest, SignUpRequest, User } from '../interfaces/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private authUrl = `${environment.urlBackend}/authentication`;
  private usersUrl = `${environment.urlBackend}/users`;

  constructor(private http: HttpClient) {}

  signUp(payload: SignUpRequest): Observable<any> {
    return this.http.post(`${this.authUrl}/sign-up`, payload);
  }

  signIn(payload: SignInRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/sign-in`, payload);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.usersUrl}/${id}`);
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.usersUrl}`);
  }
}
