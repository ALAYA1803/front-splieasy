import { Injectable } from '@angular/core';
import { environment } from '../../../core/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Contribution, CreateContributionRequest, UpdateContributionRequest } from '../interfaces/contributions';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContributionsService {
  private contributionsUrl = `${environment.urlBackend}/contributions`;

  constructor(private http: HttpClient) { }

  // ✅ Función privada para obtener los headers (igual que BillsService)
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ✅ Crear contribución (siguiendo el patrón del servicio que funciona)
  createContribution(contributionData: CreateContributionRequest): Observable<Contribution> {
    const headers = this.getHeaders();
    console.log('📤 ContributionsService enviando request:', contributionData);
    return this.http.post<Contribution>(this.contributionsUrl, contributionData, { headers });
  }

  // ✅ Obtener todas las contribuciones
  getAllContributions(): Observable<Contribution[]> {
    const headers = this.getHeaders();
    return this.http.get<Contribution[]>(this.contributionsUrl, { headers });
  }

  // ✅ Obtener contribución por ID
  getContributionById(id: number): Observable<Contribution> {
    const headers = this.getHeaders();
    return this.http.get<Contribution>(`${this.contributionsUrl}/${id}`, { headers });
  }

  // ✅ Actualizar contribución
  updateContribution(id: number, contributionData: UpdateContributionRequest): Observable<Contribution> {
    const headers = this.getHeaders();
    return this.http.put<Contribution>(`${this.contributionsUrl}/${id}`, contributionData, { headers });
  }

  // ✅ Eliminar contribución
  deleteContribution(id: number): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.contributionsUrl}/${id}`, { headers });
  }

  // ✅ Obtener contribuciones por household (siguiendo el patrón de BillsService)
  getContributionsByHouseholdId(householdId: number): Observable<Contribution[]> {
    return this.getAllContributions().pipe(
      map(contributions => contributions.filter(contribution => contribution.householdId === householdId))
    );
  }
}
