import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError } from 'rxjs';
import { environment } from '../environments/environment';
import { JwtService } from '../auth/jwt.service';

export interface HouseholdMembership {
  id: number;
  householdId: number;
  userId: number;
  isRepresentative: boolean;
}

export interface MemberContributionDto {
  id: number;
  description: string;
  billId: number;
  householdId: number;
  amount: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'PAGADO' | 'PENDIENTE';
  dueDate?: string;
  createdAt?: string;
}

export interface HouseholdDto {
  id: number;
  name: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class MemberApiService {
  private base = environment.urlBackend;

  constructor(private http: HttpClient, private jwt: JwtService) {}

  /**
   * Membresías del usuario autenticado.
   * Backend esperado: /householdmembers/me
   * Fallback:        /householdmembers?userId={id}
   */
  getMyMemberships(): Observable<HouseholdMembership[]> {
    const userId = this.jwt.getUserId() || '';
    return this.http
      .get<HouseholdMembership[]>(`${this.base}/householdmembers/me`)
      .pipe(
        catchError(() =>
          this.http.get<HouseholdMembership[]>(`${this.base}/householdmembers`, {
            params: new HttpParams().set('userId', String(userId))
          })
        ),
        map((list: HouseholdMembership[]) => list ?? [])
      );
  }

  /** Info de un hogar por id */
  getHousehold(householdId: number): Observable<HouseholdDto> {
    return this.http.get<HouseholdDto>(`${this.base}/households/${householdId}`);
  }

  /**
   * Contribuciones del miembro dentro de un hogar.
   * Backend esperado: GET /membercontributions?householdId=&userId=&status=
   * (status opcional)
   */
  getMyContributions(householdId: number, status?: 'PENDING' | 'PAID' | 'PARTIAL'): Observable<MemberContributionDto[]> {
    const userId = this.jwt.getUserId() || '';

    let params = new HttpParams()
      .set('householdId', String(householdId))
      .set('userId', String(userId));
    if (status) params = params.set('status', status);

    return this.http.get<MemberContributionDto[]>(`${this.base}/membercontributions`, { params });
  }
}
