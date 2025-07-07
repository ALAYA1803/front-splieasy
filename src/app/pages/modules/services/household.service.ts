import { Injectable } from '@angular/core';
import { environment } from '../../../core/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Household } from '../interfaces/household';

@Injectable({
  providedIn: 'root'
})
export class HouseholdService {

  private householdUrl = `${environment.urlBackend}/households`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Obtener todos los households y filtrar por representante en el frontend
  getHouseholdByRepresentante(representanteId: number): Observable<Household[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Household[]>(this.householdUrl, { headers })
      .pipe(
        map(households => households.filter(household => household.representanteId === representanteId))
      );
  }

  // Obtener household por ID (este ya funciona)
  getHouseholdById(id: number): Observable<Household> {
    const headers = this.getAuthHeaders();
    const url = `${this.householdUrl}/${id}`;
    return this.http.get<Household>(url, { headers });
  }

  // Método adicional para obtener todos los households
  getAllHouseholds(): Observable<Household[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Household[]>(this.householdUrl, { headers });
  }
}
