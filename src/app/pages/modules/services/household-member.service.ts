import { Injectable } from '@angular/core';
import { HouseholdMember } from '../interfaces/household-member';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../core/environments/environment';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HouseholdMemberService {
  private memberUrl = `${environment.urlBackend}/household-members`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // MÉTODO PRINCIPAL MEJORADO: Filtrar por household_id
getByHouseholdId(householdId: number): Observable<HouseholdMember[]> {
  const headers = this.getAuthHeaders();
  console.log('🔍 Buscando miembros para householdId:', householdId);

  return this.http.get<HouseholdMember[]>(this.memberUrl, { headers }).pipe(
    tap(members => {
      console.log('📦 Total miembros recibidos:', members.length);
      console.log('📦 Estructura primer miembro:', members[0]);

      // Verificar qué campos están disponibles
      if (members.length > 0) {
        const firstMember = members[0] as any;
        console.log('🔍 Campos disponibles:', Object.keys(firstMember));
        console.log('🔍 householdId (camelCase):', firstMember.householdId);
        console.log('🔍 household_id (snake_case):', firstMember.household_id);
      }
    }),
    map(members => {
      // Filtrar usando múltiples estrategias
      const filtered = members.filter(member => {
        const memberAny = member as any;

        // Estrategia 1: camelCase
        const matchesCamelCase = member.householdId === householdId;

        // Estrategia 2: snake_case
        const matchesSnakeCase = memberAny.household_id === householdId;

        // Estrategia 3: conversión de tipos
        const matchesStringComparison =
          String(member.householdId) === String(householdId) ||
          String(memberAny.household_id) === String(householdId);

        const matches = matchesCamelCase || matchesSnakeCase || matchesStringComparison;

        if (matches) {
          console.log('✅ Miembro encontrado:', member);
        }

        return matches;
      });

      console.log('🎯 Miembros filtrados:', filtered.length);
      console.log('🎯 Lista final:', filtered);
      return filtered;
    })
  );
}

// MÉTODO MEJORADO: Con validación de respuesta del servidor
getByHouseholdIdWithQuery(householdId: number): Observable<HouseholdMember[]> {
  const headers = this.getAuthHeaders();

  // Probar diferentes variaciones del query parameter
  const queryVariations = [
    `householdId=${householdId}`,
    `household_id=${householdId}`,
    `householdId=${householdId}&_limit=100`,
    `filter[householdId]=${householdId}`
  ];

  // Usar la primera variación por defecto
  const url = `${this.memberUrl}?${queryVariations[0]}`;
  console.log('🌐 Probando URL con query:', url);

  return this.http.get<HouseholdMember[]>(url, { headers }).pipe(
    tap(members => {
      console.log('📦 Respuesta del servidor con query:', members.length, 'miembros');

      // Validar si el filtro funcionó
      if (members.length > 0 && members.length < 10) {
        console.log('✅ El query parameter parece funcionar');
      } else if (members.length >= 10) {
        console.log('⚠️ El query parameter NO filtró (muchos resultados)');
      } else {
        console.log('ℹ️ No hay miembros o el filtro funcionó perfectamente');
      }
    }),
    // Aplicar filtro manual como respaldo
    map(members => {
      const manualFiltered = members.filter(member => {
        const memberAny = member as any;
        return member.householdId === householdId ||
               memberAny.household_id === householdId;
      });

      console.log('🔧 Filtro manual aplicado:', manualFiltered.length, 'miembros');
      return manualFiltered;
    })
  );
}

// MÉTODO DE DEBUGGING COMPLETO
debugHouseholdMembers(): Observable<any> {
  const headers = this.getAuthHeaders();
  console.log('🐛 === INICIANDO DEBUG COMPLETO ===');

  return this.http.get<HouseholdMember[]>(this.memberUrl, { headers }).pipe(
    tap(members => {
      console.log('🐛 DEBUG: Total de miembros:', members.length);

      if (members.length === 0) {
        console.log('❌ No hay miembros en la respuesta');
        return;
      }

      // Analizar estructura
      const firstMember = members[0] as any;
      console.log('🐛 DEBUG: Primer miembro completo:', firstMember);
      console.log('🐛 DEBUG: Propiedades disponibles:', Object.keys(firstMember));

      // Verificar tipos de datos
      console.log('🐛 DEBUG: Tipos de datos:');
      console.log('  - householdId:', typeof firstMember.householdId, '=', firstMember.householdId);
      console.log('  - household_id:', typeof firstMember.household_id, '=', firstMember.household_id);
      console.log('  - userId:', typeof firstMember.userId, '=', firstMember.userId);
      console.log('  - user_id:', typeof firstMember.user_id, '=', firstMember.user_id);

      // Agrupar por householdId
      const groupedByCamelCase = this.groupBy(members, 'householdId');
      const groupedBySnakeCase = this.groupBy(members, 'household_id');

      console.log('🐛 DEBUG: Agrupación por householdId (camelCase):', groupedByCamelCase);
      console.log('🐛 DEBUG: Agrupación por household_id (snake_case):', groupedBySnakeCase);

      // Mostrar todos los hogares únicos
      const uniqueHouseholds = [...new Set(members.map(m => (m as any).householdId || (m as any).household_id))];
      console.log('🐛 DEBUG: Hogares únicos encontrados:', uniqueHouseholds);
    })
  );
}

// Método auxiliar para agrupar
private groupBy(array: any[], key: string): any {
  return array.reduce((groups, item) => {
    const groupKey = item[key];
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {});
}

  // Crear un nuevo miembro del hogar
  createMemberLink(data: HouseholdMember): Observable<HouseholdMember> {
    const headers = this.getAuthHeaders();
    console.log('➕ Creando miembro:', data);
    return this.http.post<HouseholdMember>(this.memberUrl, data, { headers }).pipe(
      tap(response => {
        console.log('✅ Miembro creado:', response);
      })
    );
  }

  // Eliminar un miembro del hogar
  deleteMemberLink(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    console.log('🗑️ Eliminando miembro ID:', id);
    return this.http.delete<void>(`${this.memberUrl}/${id}`, { headers }).pipe(
      tap(() => {
        console.log('✅ Miembro eliminado');
      })
    );
  }

  // Obtener un miembro específico por ID
  getMemberById(id: number): Observable<HouseholdMember> {
    const headers = this.getAuthHeaders();
    return this.http.get<HouseholdMember>(`${this.memberUrl}/${id}`, { headers });
  }

  // Obtener todos los miembros (sin filtro)
  getAllMembers(): Observable<HouseholdMember[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<HouseholdMember[]>(this.memberUrl, { headers }).pipe(
      tap(members => {
        console.log('📋 Todos los miembros:', members);
      })
    );
  }
}
