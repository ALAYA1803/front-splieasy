import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-memb-contributions',
  standalone: false,
  templateUrl: './memb-contributions.component.html',
  styleUrl: './memb-contributions.component.css'
})
export class MembContributionsComponent implements OnInit {
  userId!: number;
  contributions: any[] = [];
  isLoading = true;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('currentUser')!);
    this.userId = +user.id;
    this.fetchContributions();
  }

  fetchContributions(): void {
    this.isLoading = true;
    this.http.get<any[]>(`http://localhost:3000/member_contributions?member_id=${this.userId}`).subscribe(mcList => {
      const contribIds = mcList.map(c => c.contribution_id);
      this.http.get<any[]>(`http://localhost:3000/contributions`).subscribe(allContribs => {
        this.http.get<any[]>(`http://localhost:3000/bills`).subscribe(bills => {
          this.contributions = mcList.map(mc => {
            const contrib = allContribs.find(c => c.id == mc.contribution_id);
            const bill = bills.find(b => b.id == contrib?.bill_id);
            return {
              ...mc,
              descripcion: contrib?.descripcion,
              strategy: contrib?.strategy,
              fechaLimite: contrib?.fecha_limite,
              billDescripcion: bill?.descripcion,
              fechaFactura: bill?.fecha,
              montoFactura: bill?.monto
            };
          });
          this.isLoading = false;
        });
      });
    });
  }

  pagar(contribution: any): void {
    const updated = { ...contribution, status: 'PAGADO', pagado_en: new Date().toISOString() };
    this.http.patch(`http://localhost:3000/member_contributions/${contribution.id}`, updated).subscribe(() => {
      this.fetchContributions(); // refrescar lista
    });
  }
}
