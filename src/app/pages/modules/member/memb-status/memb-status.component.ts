import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../core/environments/environment';
import { PaymentReceiptsService, PaymentReceipt } from '../../../../core/services/payment-receipts.service';

interface MemberContribution {
  id: number;
  contributionId: number;
  memberId: number;
  monto: number;
  status: 'PENDIENTE' | 'PAGADO';
  pagadoEn?: string | null;
}

interface Contribution {
  id: number;
  billId: number;
  description?: string;
  strategy?: 'EQUAL' | 'INCOME_BASED' | string;
  fechaLimite?: string | null;
}

interface Bill {
  id: number;
  description?: string;
  monto?: number;
  fecha?: string | null;
}

type Row = {
  descripcionFactura?: string;
  montoFactura?: number;
  fechaFactura?: string | null;
  descripcionContrib?: string;
  strategy?: string;
  fechaLimite?: string | null;
  monto: number;
  status: 'PENDIENTE' | 'PAGADO' | 'EN_REVISION';
  pagadoEn?: string | null;
};

@Component({
  selector: 'app-memb-status',
  standalone: true,
  imports: [CommonModule, TranslateModule, TableModule, CardModule],
  templateUrl: './memb-status.component.html',
  styleUrls: ['./memb-status.component.css']
})
export class MembStatusComponent implements OnInit {
  userId!: number;
  statusList: Row[] = [];
  isLoading = true;
  private api = environment.urlBackend;

  constructor(private http: HttpClient, private receiptsSvc: PaymentReceiptsService) {}

  ngOnInit(): void {
    const raw = localStorage.getItem('currentUser');
    if (!raw) { this.isLoading = false; return; }
    const user = JSON.parse(raw);
    this.userId = Number(user.id);
    this.loadStatus();
  }

  private loadStatus(): void {
    this.isLoading = true;

    const params = new HttpParams().set('memberId', String(this.userId));
    this.http.get<MemberContribution[]>(`${this.api}/member-contributions`, { params }).pipe(
      switchMap((mcs) => {
        if (!mcs?.length) return of({ rows: [] as Row[], mcs: [] as MemberContribution[] });

        // Traer contributions por ID
        const contribIds = Array.from(new Set(mcs.map(m => m.contributionId)));
        const contribCalls = contribIds.map(id =>
          this.http.get<Contribution>(`${this.api}/contributions/${id}`).pipe(
            catchError(() => of({ id } as Contribution))
          )
        );

        return forkJoin(contribCalls).pipe(
          switchMap((contribs) => {
            const byContrib = new Map<number, Contribution>();
            contribs.forEach(c => byContrib.set(c.id, c));

            // Traer bills por ID deducido desde contributions
            const billIds = Array.from(
              new Set(contribs.map(c => c.billId).filter(Boolean) as number[])
            );
            const billCalls = billIds.map(id =>
              this.http.get<Bill>(`${this.api}/bills/${id}`).pipe(
                catchError(() => of({ id } as Bill))
              )
            );

            return forkJoin(billCalls).pipe(
              switchMap((bills) => {
                const byBill = new Map<number, Bill>();
                bills.forEach(b => byBill.set(b.id, b));

                const mcReceiptCalls = mcs.map(mc =>
                  this.receiptsSvc.list(mc.id).pipe(
                    catchError(() => of([] as PaymentReceipt[])),
                    map(list => ({ mcId: mc.id, hasPending: list.some(r => r.status === 'PENDING') }))
                  )
                );

                return forkJoin(mcReceiptCalls).pipe(
                  map(pendingPairs => {
                    const pendingMap = new Map<number, boolean>();
                    pendingPairs.forEach(p => pendingMap.set(p.mcId, p.hasPending));

                    const rows: Row[] = mcs.map(mc => {
                      const c = byContrib.get(mc.contributionId);
                      const b = c?.billId ? byBill.get(c.billId) : undefined;
                      const underReview = pendingMap.get(mc.id) === true;

                      return {
                        descripcionFactura: b?.description,
                        montoFactura: b?.monto,
                        fechaFactura: b?.fecha ?? null,
                        descripcionContrib: c?.description,
                        strategy: c?.strategy,
                        fechaLimite: c?.fechaLimite ?? null,
                        monto: mc.monto,
                        status: mc.status === 'PAGADO'
                          ? 'PAGADO'
                          : (underReview ? 'EN_REVISION' : 'PENDIENTE'),
                        pagadoEn: mc.pagadoEn ?? null
                      };
                    });

                    return { rows, mcs };
                  })
                );
              })
            );
          })
        );
      }),
      catchError(err => {
        console.error('Error cargando estado del miembro:', err);
        return of({ rows: [] as Row[], mcs: [] as MemberContribution[] });
      })
    ).subscribe(({ rows }) => {
      this.statusList = rows.filter(r => r.status === 'PAGADO');
      this.isLoading = false;
    });
  }

  // Helpers de plantilla
  isPaid(s: Row) { return s.status === 'PAGADO'; }
  isPending(s: Row) { return s.status === 'PENDIENTE'; }
  isUnderReview(s: Row) { return s.status === 'EN_REVISION'; }
}
