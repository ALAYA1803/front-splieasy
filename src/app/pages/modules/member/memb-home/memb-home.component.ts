import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-memb-home',
  standalone: false,
  templateUrl: './memb-home.component.html',
  styleUrl: './memb-home.component.css'
})
export class MembHomeComponent implements OnInit {
  userId!: number;
  household: any = null;
  members: any[] = [];
  contributions: any[] = [];
  totalPendiente = 0;
  totalPagado = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('currentUser')!);
    this.userId = +user.id;

    // Obtener en qué hogar está el usuario
    this.http.get<any[]>(`http://localhost:3000/household_members?user_id=${this.userId}`).subscribe(hhMembers => {
      const hhId = hhMembers[0]?.household_id;

      if (hhId) {
        // Obtener datos del hogar por query param (NO por id directo)
        this.http.get<any[]>(`http://localhost:3000/households?id=${hhId}`).subscribe(hhResult => {
          this.household = hhResult[0];
          const repId = this.household.representante_id;

          // Obtener miembros del hogar
          this.http.get<any[]>(`http://localhost:3000/household_members?household_id=${hhId}`).subscribe(memberships => {
            const userIds = memberships.map(m => m.user_id);
            if (!userIds.includes(repId)) {
              userIds.push(repId);
            }

            this.http.get<any[]>(`http://localhost:3000/users`).subscribe(users => {
              this.members = users.filter(u => userIds.includes(u.id));
            });
          });

          // Obtener contribuciones del usuario actual
          this.http.get<any[]>(`http://localhost:3000/member_contributions?member_id=${this.userId}`).subscribe(mcList => {
            this.contributions = mcList;

            this.totalPendiente = mcList
              .filter(c => c.status === 'PENDIENTE')
              .reduce((sum, c) => sum + (Number(c.monto) || 0), 0);

            this.totalPagado = mcList
              .filter(c => c.status === 'PAGADO')
              .reduce((sum, c) => sum + (Number(c.monto) || 0), 0);
          });
        });
      }
    });
  }
}
