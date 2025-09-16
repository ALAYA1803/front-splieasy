import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from '../../../core/environments/environment';
import { Contribution, CreateContributionRequest, UpdateContributionRequest } from '../interfaces/contributions';

@Injectable({ providedIn: 'root' })
export class ContributionsService {
  private readonly base = environment.urlBackend;
  private readonly contributionsUrl = `${this.base}/contributions`;
  private readonly debug = !environment.production;

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken') || '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return new HttpHeaders(headers);
  }

  createContribution(body: CreateContributionRequest): Observable<Contribution> {
    const headers = this.authHeaders();
    this.debug && console.debug('📤 Create contribution', body);
    return this.http.post<Contribution>(this.contributionsUrl, body, { headers }).pipe(
      catchError(error => {
        console.error(' Error creando contribución:', error);
        let userMessage = 'No se pudo crear la contribución';
        if (error?.status === 400) userMessage = 'Datos inválidos';
        if (error?.status === 401) userMessage = 'No autorizado';
        if (error?.status === 404) userMessage = 'Recurso no encontrado';
        if (error?.status === 409) userMessage = 'Conflicto (registro duplicado)';
        return throwError(() => ({ ...error, userMessage }));
      })
    );
  }

  getAllContributions(): Observable<Contribution[]> {
    const headers = this.authHeaders();
    return this.http.get<Contribution[]>(this.contributionsUrl, { headers }).pipe(
      map(list => Array.isArray(list) ? list : []),
      catchError(error => {
        console.error(' Error listando contribuciones:', error);
        return of<Contribution[]>([]);
      })
    );
  }

  getContributionById(id: number): Observable<Contribution | null> {
    const headers = this.authHeaders();
    return this.http.get<Contribution>(`${this.contributionsUrl}/${id}`, { headers }).pipe(
      catchError(error => {
        if (error?.status === 404) return of(null);
        console.error(' Error obteniendo contribución:', error);
        return of(null);
      })
    );
  }

  updateContribution(id: number, body: UpdateContributionRequest): Observable<Contribution | null> {
    const headers = this.authHeaders();
    return this.http.put<Contribution>(`${this.contributionsUrl}/${id}`, body, { headers }).pipe(
      catchError(error => {
        console.error(' Error actualizando contribución:', error);
        let userMessage = 'No se pudo actualizar la contribución';
        if (error?.status === 400) userMessage = 'Datos inválidos';
        if (error?.status === 401) userMessage = 'No autorizado';
        if (error?.status === 404) userMessage = 'Contribución no encontrada';
        return throwError(() => ({ ...error, userMessage }));
      })
    );
  }

  deleteContribution(id: number): Observable<boolean> {
    const headers = this.authHeaders();
    return this.http.delete<void>(`${this.contributionsUrl}/${id}`, { headers }).pipe(
      map(() => true),
      catchError(error => {
        console.error(' Error eliminando contribución:', error);
        return of(false);
      })
    );
  }

  getByHouseholdId(householdId: number): Observable<Contribution[]> {
    const headers = this.authHeaders();

    const path1 = `${this.base}/households/${householdId}/contributions`;
    const path2 = `${this.base}/contributions`;
    const params2 = new HttpParams().set('householdId', String(householdId));
    const path3 = this.contributionsUrl;
    this.debug && console.debug(' Cargando contribuciones de household:', householdId);
    return this.http.get<Contribution[]>(path1, { headers }).pipe(
      tap(list => this.debug && console.debug('✅ path1 ok:', list?.length ?? 0)),
      catchError(err1 => {
        this.debug && console.warn('️ path1 falló:', err1?.status);
        return this.http.get<Contribution[]>(path2, { headers, params: params2 }).pipe(
          tap(list => this.debug && console.debug('✅ path2 ok:', list?.length ?? 0)),
          catchError(err2 => {
            this.debug && console.warn(' path2 falló:', err2?.status);
            return this.http.get<any[]>(path3, { headers }).pipe(
              map(list => {
                const arr = Array.isArray(list) ? list : [];
                const filtered = arr.filter((c: any) => {
                  const camel = c?.householdId;
                  const snake = c?.household_id;
                  const nested = c?.household?.id;
                  return camel === householdId || snake === householdId || nested === householdId ||
                    String(camel) === String(householdId) || String(snake) === String(householdId) || String(nested) === String(householdId);
                });
                this.debug && console.debug(' path3 filtrado:', filtered.length);
                return filtered as Contribution[];
              }),
              catchError(err3 => {
                console.error(' Todos los intentos fallaron (contribuciones):', err3);
                return of<Contribution[]>([]);
              })
            );
          })
        );
      }),
      map(list => Array.isArray(list) ? list : []),
      catchError(err => {
        console.error(' Error inesperado getByHouseholdId:', err);
        return of<Contribution[]>([]);
      })
    );
  }
}
