import { Injectable } from '@angular/core';
import { environment } from '../../../core/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MemberContribution } from '../interfaces/member.contribution';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MemberContributionService {
  private memberContributionUrl = `${environment.urlBackend}/member-contributions`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ✅ Obtener todas las contribuciones
  getAll(): Observable<MemberContribution[]> {
    const headers = this.getHeaders();
    return this.http.get<MemberContribution[]>(this.memberContributionUrl, { headers });
  }

  // ✅ Obtener por ID compuesto (contributionId + memberId)
  getByIds(contributionId: number, memberId: number): Observable<MemberContribution> {
    const headers = this.getHeaders();
    const url = `${this.memberContributionUrl}?contributionId=${contributionId}&memberId=${memberId}`;
    return this.http.get<MemberContribution>(url, { headers });
  }

  // ✅ Crear nueva contribución
  create(contribution: MemberContribution): Observable<MemberContribution> {
    const headers = this.getHeaders();
    return this.http.post<MemberContribution>(this.memberContributionUrl, contribution, { headers });
  }

  // ✅ Actualizar contribución (usando ID compuesto)
  update(contribution: MemberContribution): Observable<MemberContribution> {
    const headers = this.getHeaders();
    const url = `${this.memberContributionUrl}/${contribution.contributionId}/${contribution.memberId}`;
    return this.http.put<MemberContribution>(url, contribution, { headers });
  }

  // ✅ Eliminar contribución (usando ID compuesto)
  delete(contributionId: number, memberId: number): Observable<void> {
    const headers = this.getHeaders();
    const url = `${this.memberContributionUrl}/${contributionId}/${memberId}`;
    return this.http.delete<void>(url, { headers });
  }
}

