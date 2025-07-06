import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap, forkJoin, of, map } from 'rxjs';
interface User {
  id: number;
  name: string;
  email: string;
  role: 'REPRESENTANTE' | 'MIEMBRO';
}

interface Household {
  id: number;
  name: string;
  description: string;
  currency: string;
  representante_id: number;
}

@Component({
  selector: 'app-memb-home',
  standalone: false,
  templateUrl: './memb-home.component.html',
  styleUrls: ['./memb-home.component.css']
})
export class MembHomeComponent implements OnInit {
  currentUser!: User;
  household: Household | null = null;
  members: User[] = [];
  contributions: any[] = [];
  totalPendiente = 0;
  totalPagado = 0;
  loading = true;

  private readonly API_URL = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.currentUser = JSON.parse(localStorage.getItem('currentUser')!);
    if (!this.currentUser) {
      this.loading = false;
      return;
    }
    this.http.get<any[]>(`${this.API_URL}/household_members?user_id=${this.currentUser.id}`).pipe(
      switchMap(hhMembers => {
        const householdId = hhMembers[0]?.household_id;
        if (!householdId) {
          return of(null);
        }
        return forkJoin({
          household: this.http.get<Household[]>(`${this.API_URL}/households?id=${householdId}`).pipe(map(h => h[0])),
          memberships: this.http.get<any[]>(`${this.API_URL}/household_members?household_id=${householdId}`),
          myContributions: this.http.get<any[]>(`${this.API_URL}/member_contributions?member_id=${this.currentUser.id}`)
        });
      }),
      switchMap(data => {
        if (!data) return of(null);

        const { household, memberships, myContributions } = data;
        const allUserIds = [...new Set(memberships.map(m => m.user_id).concat(household.representante_id))];

        return this.http.get<User[]>(`${this.API_URL}/users`).pipe(
          map(allUsers => {
            const householdMembers = allUsers.filter(u => allUserIds.includes(u.id));
            return { household, members: householdMembers, myContributions };
          })
        );
      })
    ).subscribe({
      next: (result) => {
        if (result) {
          this.household = result.household;
          this.members = result.members;
          this.contributions = result.myContributions;
          this.totalPendiente = result.myContributions
            .filter(c => c.status === 'PENDIENTE')
            .reduce((sum, c) => sum + (Number(c.monto) || 0), 0);

          this.totalPagado = result.myContributions
            .filter(c => c.status === 'PAGADO')
            .reduce((sum, c) => sum + (Number(c.monto) || 0), 0);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error("Error al cargar el dashboard", err);
        this.loading = false;
      }
    });
  }
}
