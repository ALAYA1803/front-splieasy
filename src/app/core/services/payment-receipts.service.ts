import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface PaymentReceipt {
  id: number;
  memberContributionId: number;
  filename: string;
  url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt: string;
  reviewedById?: number | null;
  notes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PaymentReceiptsService {
  private api = environment.urlBackend;

  constructor(private http: HttpClient) {}

  /** Lista boletas por memberContribution  */
  list(memberContributionId: number): Observable<PaymentReceipt[]> {
    const url = `${this.api}/member-contributions/${memberContributionId}/receipts`;
    return this.http.get<PaymentReceipt[]>(url);
  }

  /** Sube archivo de boleta a una memberContribution */
  upload(memberContributionId: number, file: File): Observable<PaymentReceipt> {
    const url = `${this.api}/member-contributions/${memberContributionId}/receipts`;
    const form = new FormData();
    form.append('file', file);
    return this.http.post<PaymentReceipt>(url, form);
  }

  /** Aprueba boleta  */
  approve(receiptId: number): Observable<PaymentReceipt> {
    const url = `${this.api}/receipts/${receiptId}/approve`;
    return this.http.post<PaymentReceipt>(url, {});
  }

  /** Rechaza boleta  */
  reject(receiptId: number, notes?: string): Observable<PaymentReceipt> {
    const url = `${this.api}/receipts/${receiptId}/reject`;
    const params = notes ? new HttpParams().set('notes', notes) : undefined;
    return this.http.post<PaymentReceipt>(url, null, { params });
  }
}
