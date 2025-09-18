import { Injectable } from '@angular/core';
import { environment } from '../../../core/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BillResponse, CreateBillRequest, UpdateBillRequest } from '../interfaces/bills';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BillsService {
  private billsUrl = `${environment.urlBackend}/bills`;

  constructor(private http: HttpClient) { }
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  createBill(billData: CreateBillRequest): Observable<BillResponse> {
    const headers = this.getHeaders();
    console.log('📤 BillsService enviando request:', billData);
    return this.http.post<BillResponse>(this.billsUrl, billData, { headers });
  }
  getAllBills(): Observable<BillResponse[]> {
    const headers = this.getHeaders();
    return this.http.get<BillResponse[]>(this.billsUrl, { headers });
  }
  getBillById(billId: number): Observable<BillResponse> {
    const headers = this.getHeaders();
    return this.http.get<BillResponse>(`${this.billsUrl}/${billId}`, { headers });
  }
  updateBill(billId: number, billData: CreateBillRequest): Observable<BillResponse> {
    const headers = this.getHeaders();
    return this.http.put<BillResponse>(`${this.billsUrl}/${billId}`, billData, { headers });
  }
  deleteBill(billId: number): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.billsUrl}/${billId}`, { headers });
  }
  getBillsByHousehold(householdId: number): Observable<BillResponse[]> {
    return this.getAllBills().pipe(
      map(bills => bills.filter(bill => bill.householdId === householdId))
    );
  }
}
