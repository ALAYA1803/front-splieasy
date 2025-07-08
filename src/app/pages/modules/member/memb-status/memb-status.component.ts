import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-memb-status',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    TableModule,
    CardModule
  ],
  templateUrl: './memb-status.component.html',
  styleUrl: './memb-status.component.css'
})
export class MembStatusComponent implements OnInit {
  userId!: number;
  statusList: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('currentUser')!);
    this.userId = +user.id;
    this.loadStatus();
  }

  loadStatus(): void {
    this.http.get<any[]>(`https://backend-app-1-vd66.onrender.com/api/v1/member_contributions?member_id=${this.userId}`).subscribe(mcList => {
      const contribIds = mcList.map(mc => mc.contribution_id);

      this.http.get<any[]>(`https://backend-app-1-vd66.onrender.com/api/v1/contributions`).subscribe(allContribs => {
        this.http.get<any[]>(`https://backend-app-1-vd66.onrender.com/api/v1/bills`).subscribe(bills => {
          this.statusList = mcList.map(mc => {
            const contrib = allContribs.find(c => c.id === mc.contribution_id);
            const bill = bills.find(b => b.id === contrib?.bill_id);

            return {
              descripcionFactura: bill?.descripcion,
              montoFactura: bill?.monto,
              fechaFactura: bill?.fecha,
              descripcionContrib: contrib?.descripcion,
              strategy: contrib?.strategy,
              fechaLimite: contrib?.fecha_limite,
              monto: mc.monto,
              status: mc.status,
              pagadoEn: mc.pagado_en
            };
          });
        });
      });
    });
  }
}
