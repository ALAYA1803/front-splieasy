import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

import { environment } from '../../../core/environments/environment';
import { CreateHouseholdMemberRequest, HouseholdMember } from '../interfaces/household-member';

@Injectable({ providedIn: 'root' })
export class HouseholdMemberService {
  private readonly base = environment.urlBackend;
  private readonly memberUrl = `${this.base}/household-members`;
  private readonly debug = !environment.production;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return new HttpHeaders(headers);
  }

  private filterByHouseholdId(list: any[], householdId: number): HouseholdMember[] {
    if (!Array.isArray(list)) return [];
    return list.filter((m: any) => {
      const camel = m?.householdId;
      const snake = m?.household_id;
      const nested = m?.household?.id;
      return camel === householdId || snake === householdId || nested === householdId ||
        String(camel) === String(householdId) || String(snake) === String(householdId) || String(nested) === String(householdId);
    });
  }

  getByHouseholdId(householdId: number): Observable<HouseholdMember[]> {
    const headers = this.getAuthHeaders();

    const path1 = `${this.base}/households/${householdId}/members`;
    const path2 = `${this.base}/household-members`;
    const params2 = new HttpParams().set('householdId', String(householdId));
    const path3 = this.memberUrl;

    if (this.debug) console.debug(' Buscando miembros de household:', householdId);

    return this.http.get<HouseholdMember[]>(path1, { headers }).pipe(
      tap(list => {
        if (this.debug) console.debug(' Miembros por path1:', list?.length ?? 0);
      }),
      catchError(err1 => {
        if (this.debug) console.warn(' path1 falló:', err1?.status, err1?.message);
        return this.http.get<HouseholdMember[]>(path2, { headers, params: params2 }).pipe(
          tap(list => {
            if (this.debug) console.debug(' Miembros por path2:', list?.length ?? 0);
          }),
          catchError(err2 => {
            if (this.debug) console.warn('️ path2 falló:', err2?.status, err2?.message);
            return this.http.get<any[]>(path3, { headers }).pipe(
              map(list => {
                const filtered = this.filterByHouseholdId(list, householdId);
                if (this.debug) console.debug(' Miembros por path3 (filtrado):', filtered.length);
                return filtered;
              }),
              catchError(err3 => {
                console.error(' Todos los intentos fallaron al obtener miembros:', err3);
                return of<HouseholdMember[]>([]);
              })
            );
          })
        );
      }),
      map(list => Array.isArray(list) ? list : []),
      catchError(err => {
        console.error(' Error inesperado en getByHouseholdId:', err);
        return of<HouseholdMember[]>([]);
      })
    );
  }

  checkIfUserIsMember(userId: number, householdId: number): Observable<boolean> {
    return this.getByHouseholdId(householdId).pipe(
      map(members => members.some(m => (m as any)?.userId === userId)),
      catchError(err => {
        console.error(' Error al verificar membresía:', err);
        return of(false);
      })
    );
  }

  createMemberLink(data: CreateHouseholdMemberRequest): Observable<HouseholdMember> {
    const headers = this.getAuthHeaders();
    if (this.debug) {
      console.debug(' Creando miembro:', data);
      console.debug('URL:', this.memberUrl);
      console.debug('Auth?', !!headers.get('Authorization'));
    }

    return this.http.post<HouseholdMember>(this.memberUrl, data, { headers }).pipe(
      tap(resp => this.debug && console.debug(' Miembro creado:', resp)),
      catchError(error => {
        console.error(' Error al crear miembro:', error);

        let userMessage = 'Error desconocido al crear el miembro';
        switch (error?.status) {
          case 400: userMessage = 'Datos inválidos proporcionados'; break;
          case 401: userMessage = 'No autorizado para realizar esta acción'; break;
          case 404: userMessage = 'Usuario u hogar no encontrado'; break;
          case 409: userMessage = 'El usuario ya es miembro del hogar'; break;
          case 500: userMessage = 'Error interno del servidor'; break;
        }
        return throwError(() => ({ ...error, userMessage }));
      })
    );
  }

  deleteMemberLink(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    if (this.debug) console.debug(' Eliminando miembro ID:', id);

    return this.http.delete<void>(`${this.memberUrl}/${id}`, { headers }).pipe(
      tap(() => this.debug && console.debug(' Miembro eliminado')),
      catchError(error => {
        console.error(' Error al eliminar miembro:', error);
        const userMessage = error?.status === 404
          ? 'Miembro no encontrado'
          : (error?.status === 401 ? 'No autorizado' : 'No se pudo eliminar el miembro');
        return throwError(() => ({ ...error, userMessage }));
      })
    );
  }

  getAllMembers(): Observable<HouseholdMember[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<HouseholdMember[]>(this.memberUrl, { headers }).pipe(
      tap(list => this.debug && console.debug('📋 Todos los miembros:', Array.isArray(list) ? list.length : 0)),
      map(list => Array.isArray(list) ? list : []),
      catchError(error => {
        console.error(' Error al obtener todos los miembros:', error);
        return of<HouseholdMember[]>([]);
      })
    );
  }
}
