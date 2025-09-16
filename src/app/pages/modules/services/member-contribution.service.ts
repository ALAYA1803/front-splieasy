import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../core/environments/environment';
import { MemberContribution } from '../interfaces/member-contribution';

@Injectable({ providedIn: 'root' })
export class MemberContributionService {
  private readonly base = environment.urlBackend;
  private readonly url  = `${this.base}/member-contributions`;

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken') || '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return new HttpHeaders(headers);
  }

  getAll(): Observable<MemberContribution[]> {
    return this.http.get<MemberContribution[]>(this.url, { headers: this.authHeaders() });
  }

  getByIds(contributionId: number, memberId: number): Observable<MemberContribution> {
    return this.http.get<MemberContribution>(
      `${this.url}?contributionId=${contributionId}&memberId=${memberId}`,
      { headers: this.authHeaders() }
    );
  }

  create(body: MemberContribution): Observable<MemberContribution> {
    return this.http.post<MemberContribution>(this.url, body, { headers: this.authHeaders() });
  }

  update(body: MemberContribution): Observable<MemberContribution> {
    return this.http.put<MemberContribution>(
      `${this.url}/${body.contributionId}/${body.memberId}`,
      body,
      { headers: this.authHeaders() }
    );
  }

  deleteById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`, { headers: this.authHeaders() });
  }

  deleteByPair(contributionId: number, memberId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.url}/${contributionId}/${memberId}`,
      { headers: this.authHeaders() }
    );
  }
}
