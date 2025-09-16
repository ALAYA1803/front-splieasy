import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-memb-contributions',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    TooltipModule
  ],
  templateUrl: './memb-contributions.component.html',
  styleUrl: './memb-contributions.component.css'
})
export class MembContributionsComponent implements OnInit {
  userId!: number;
  contributions: any[] = [];
  isLoading = true;
  private apiUrl = 'https://back-spliteasy.onrender.com/api/v1';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Es más seguro verificar si 'currentUser' existe antes de parsearlo.
    const userString = localStorage.getItem('currentUser');
    if (userString) {
      const user = JSON.parse(userString);
      this.userId = +user.id;
      this.fetchContributions();
    } else {
      this.isLoading = false;
      console.error("No se encontró el usuario en localStorage.");
    }
  }

  fetchContributions(): void {
    this.isLoading = true;

    forkJoin({
      memberContributions: this.http.get<any[]>(`${this.apiUrl}/member-contributions`),
      allContributions: this.http.get<any[]>(`${this.apiUrl}/contributions`),
      bills: this.http.get<any[]>(`${this.apiUrl}/bills`)
    }).subscribe({
      next: ({ memberContributions, allContributions, bills }) => {
        const userMemberContributions = memberContributions.filter(mc => mc.memberId === this.userId);

        this.contributions = userMemberContributions.map(mc => {
          const contrib = allContributions.find(c => c.id === mc.contributionId);
          const bill = bills.find(b => b.id === contrib?.billId);

          return {
            ...mc,
            descripcion: contrib?.description,
            strategy: contrib?.strategy,
            fechaLimite: contrib?.fechaLimite,
            billDescripcion: bill?.description,
            fechaFactura: bill?.fecha,
            montoFactura: bill?.monto
          };
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error al obtener las contribuciones:", err);
        this.isLoading = false;
      }
    });
  }

  pagar(contribution: any): void {
    const updatedPayload = {
      contributionId: contribution.contributionId,
      memberId: contribution.memberId,
      monto: contribution.monto,
      status: 'PAGADO',
      pagadoEn: new Date().toISOString()
    };

    this.http.put(`${this.apiUrl}/member-contributions/${contribution.id}`, updatedPayload).subscribe({
      next: () => {
        this.fetchContributions();
      },
      error: (err) => {
        console.error("Error al procesar el pago:", err);
      }
    });
  }
}
