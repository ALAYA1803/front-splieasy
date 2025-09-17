import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { of, forkJoin } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../core/environments/environment';
import { PaymentReceiptsService, PaymentReceipt } from '../../../../core/services/payment-receipts.service';

interface MemberContribution {
  id: number;
  contributionId: number;
  memberId: number;
  monto: number;
  status: 'PENDIENTE' | 'PAGADO' | 'EN_REVISION' | 'RECHAZADO' | 'PENDING' | 'PAID';
  pagadoEn?: string | null;
}

interface Contribution {
  id: number;
  billId: number;
  description?: string;
  strategy?: 'EQUAL' | 'INCOME_BASED' | string;
  fechaLimite?: string;
}

interface Bill {
  id: number;
  description?: string;
  monto?: number;
  fecha?: string;
}

type Row = MemberContribution & {
  descripcion?: string;
  strategy?: string;
  fechaLimite?: string;
  billDescripcion?: string;
  fechaFactura?: string;
  montoFactura?: number;
  receipts?: PaymentReceipt[];
};

@Component({
  selector: 'app-memb-contributions',
  standalone: true,
  imports: [CommonModule, TranslateModule, TableModule, ButtonModule, TooltipModule, DialogModule],
  templateUrl: './memb-contributions.component.html',
  styleUrls: ['./memb-contributions.component.css']
})
export class MembContributionsComponent implements OnInit {
  userId!: number;
  contributions: Row[] = [];
  isLoading = true;

  showUploadDialog = false;
  selectedRow: Row | null = null;
  selectedFile: File | null = null;
  isSubmitting = false;

  private apiUrl = environment.urlBackend;

  constructor(
    private http: HttpClient,
    private receiptsSvc: PaymentReceiptsService
  ) {}

  ngOnInit(): void {
    const userString = localStorage.getItem('currentUser');
    if (!userString) {
      this.isLoading = false;
      console.error('No se encontró el usuario en localStorage.');
      return;
    }
    const user = JSON.parse(userString);
    this.userId = Number(user.id);
    console.log('Usuario obtenido:', user);
    this.fetchContributions();
  }

  private normalizeStatus(s: MemberContribution['status']): 'PENDIENTE'|'PAGADO'|'EN_REVISION'|'RECHAZADO' {
    const v = (s || 'PENDIENTE').toString().toUpperCase();
    if (v === 'PAID' || v === 'PAGADO') return 'PAGADO';
    if (v === 'EN_REVISION' || v === 'EN-REVISION' || v === 'ENREVISION' || v === 'REVIEW') return 'EN_REVISION';
    if (v === 'RECHAZADO' || v === 'REJECTED') return 'RECHAZADO';
    return 'PENDIENTE';
  }

  fetchContributions(): void {
    this.isLoading = true;

    const params = new HttpParams().set('memberId', String(this.userId));

    this.http.get<MemberContribution[]>(`${this.apiUrl}/member-contributions`, { params }).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error('Error listando member-contributions del usuario:', err);
        return of([] as MemberContribution[]);
      }),
      switchMap((memberContribs) => {
        if (!memberContribs?.length) return of([] as Row[]);

        const contribIds = Array.from(new Set(memberContribs.map(mc => mc.contributionId)));
        const contrib$ = contribIds.length
          ? forkJoin(contribIds.map(id =>
            this.http.get<Contribution>(`${this.apiUrl}/contributions/${id}`)
              .pipe(catchError(() => of({ id } as Contribution)))
          ))
          : of([] as Contribution[]);

        return contrib$.pipe(
          switchMap((contribs) => {
            const billIds = Array.from(new Set((contribs || []).map(c => c?.billId).filter(Boolean) as number[]));
            const bills$ = billIds.length
              ? forkJoin(billIds.map(bid =>
                this.http.get<Bill>(`${this.apiUrl}/bills/${bid}`)
                  .pipe(catchError(() => of({ id: bid } as Bill)))
              ))
              : of([] as Bill[]);

            const receipts$ = forkJoin(
              memberContribs.map(mc =>
                this.receiptsSvc.list(mc.id).pipe(catchError(() => of([] as PaymentReceipt[])))
              )
            );

            return forkJoin([bills$, receipts$]).pipe(
              map(([bills, receiptsList]) => {
                const rows: Row[] = memberContribs.map((mc, idx) => {
                  const c = (contribs || []).find(c2 => c2?.id === mc.contributionId);
                  const b = c?.billId ? (bills || []).find(bb => bb?.id === c.billId) : undefined;
                  const receipts = (receiptsList?.[idx] || []) as PaymentReceipt[];
                  const hasPendingReceipt = receipts.some(r => r.status === 'PENDING');

                  return {
                    ...mc,
                    status: hasPendingReceipt ? 'EN_REVISION' : this.normalizeStatus(mc.status),
                    descripcion: c?.description,
                    strategy: c?.strategy,
                    fechaLimite: c?.fechaLimite,
                    billDescripcion: b?.description,
                    fechaFactura: b?.fecha,
                    montoFactura: b?.monto,
                    receipts
                  };
                });

                return rows;
              })
            );
          })
        );
      }),
      finalize(() => { this.isLoading = false; })
    )
      .subscribe({
        next: (rows) => {
          this.contributions = (rows || [])
            .map(r => ({ ...r, status: this.normalizeStatus(r.status) }))
            .filter(r => r.status !== 'PAGADO');
        },
        error: (err) => {
          console.error('Error armando tabla de contribuciones:', err);
        }
      });
  }

  openUploadDialog(row: Row): void {
    if (row.status === 'PAGADO') return;
    this.selectedRow = row;
    this.selectedFile = null;
    this.showUploadDialog = true;
  }

  onFileSelected(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    this.selectedFile = (input.files && input.files.length) ? input.files[0] : null;
  }

  submitReceipt(): void {
    if (!this.selectedRow || !this.selectedFile) return;
    this.isSubmitting = true;

    this.receiptsSvc.upload(this.selectedRow.id, this.selectedFile).pipe(
      catchError((err) => {
        console.error('Error enviando boleta:', err);
        this.isSubmitting = false;
        return of(null);
      })
    ).subscribe((res) => {
      this.isSubmitting = false;
      this.showUploadDialog = false;

      if (res) {
        this.receiptsSvc.list(this.selectedRow!.id).subscribe(list => {
          this.contributions = this.contributions.map(r =>
            r.id === this.selectedRow!.id ? { ...r, receipts: list, status: 'EN_REVISION' } : r
          );
        });
      }
    });
  }

  canPay(row: Row): boolean {
    return row.status === 'PENDIENTE' || row.status === 'RECHAZADO';
  }
  isPaid(row: Row): boolean {
    return row.status === 'PAGADO';
  }
  isUnderReview(row: Row): boolean {
    return row.status === 'EN_REVISION';
  }
}
