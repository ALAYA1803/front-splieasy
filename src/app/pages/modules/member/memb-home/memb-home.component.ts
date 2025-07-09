import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap, forkJoin, of } from 'rxjs';
import { environment } from '../../../../core/environments/environment';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// --- Interfaces para un tipado más fuerte ---
interface User {
  id: number;
  username: string;
  email: string;
  income: number;
  roles: string[];
}

interface Household {
  id: number;
  name: string;
  description: string;
  currency: string;
  representanteId: number;
}

interface HouseholdMember {
  id: number;
  userId: number;
  householdId: number;
}

interface MemberContribution {
  id: number;
  contributionId: number;
  memberId: number;
  monto: number;
  status: 'PENDIENTE' | 'PAGADO';
  pagadoEn: string | null;
}

@Component({
  selector: 'app-memb-home',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    AvatarModule,
    TagModule,
    ProgressSpinnerModule
  ],
  templateUrl: './memb-home.component.html',
  styleUrls: ['./memb-home.component.css']
})
export class MembHomeComponent implements OnInit {
  currentUser!: User;
  household: Household | null = null;
  members: User[] = [];
  contributions: MemberContribution[] = [];
  totalPendiente = 0;
  totalPagado = 0;
  loading = true;

  // Se obtiene la URL del backend desde el archivo de environment.
  private readonly API_URL = environment.urlBackend;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const userString = localStorage.getItem('currentUser');
    if (userString) {
      this.currentUser = JSON.parse(userString);
      this.loadDashboardData();
    } else {
      this.loading = false;
      console.error("No se encontró usuario en la sesión.");
    }
  }

  // Se elimina getAuthHeaders(), el AuthInterceptor se encargará de esto.

  loadDashboardData(): void {
    this.loading = true;

    // Ya no necesitas pasar los { headers } manualmente en cada petición.
    this.http.get<HouseholdMember[]>(`${this.API_URL}/household-members`).pipe(
      switchMap(allMemberships => {
        const myMembership = allMemberships.find(m => m.userId === this.currentUser.id);

        if (!myMembership) {
          console.log("El usuario no pertenece a ningún hogar.");
          this.loading = false;
          // Devolvemos un 'of(null)' para que el flujo continúe y no rompa la subscripción.
          return of(null);
        }

        const householdId = myMembership.householdId;

        // forkJoin para ejecutar las llamadas restantes en paralelo.
        return forkJoin({
          household: this.http.get<Household>(`${this.API_URL}/households/${householdId}`),
          allUsers: this.http.get<User[]>(`${this.API_URL}/users`),
          allMemberContributions: this.http.get<MemberContribution[]>(`${this.API_URL}/member-contributions`),
          allMemberships: of(allMemberships) // Pasamos la data ya obtenida.
        });
      })
    ).subscribe({
      next: (result) => {
        if (result) {
          const { household, allUsers, allMemberContributions, allMemberships } = result;

          this.household = household;

          // Obtenemos los IDs de los miembros que pertenecen a nuestro hogar.
          const memberIdsOfMyHousehold = allMemberships
            .filter(m => m.householdId === this.household!.id)
            .map(m => m.userId);

          // Filtramos la lista de usuarios para obtener solo los miembros de nuestro hogar.
          this.members = allUsers.filter(u => memberIdsOfMyHousehold.includes(u.id));

          // Filtramos las contribuciones que le pertenecen al usuario actual.
          this.contributions = allMemberContributions.filter(c => c.memberId === this.currentUser.id);

          // Calculamos los totales.
          this.totalPendiente = this.contributions
            .filter(c => c.status === 'PENDIENTE')
            .reduce((sum, c) => sum + (Number(c.monto) || 0), 0);

          this.totalPagado = this.contributions
            .filter(c => c.status === 'PAGADO')
            .reduce((sum, c) => sum + (Number(c.monto) || 0), 0);
        }
        // Si el resultado es null (porque no hay membresía), el loading se detiene aquí.
        this.loading = false;
      },
      error: (err) => {
        console.error("Error al cargar el dashboard", err);
        this.loading = false;
      }
    });
  }
}
