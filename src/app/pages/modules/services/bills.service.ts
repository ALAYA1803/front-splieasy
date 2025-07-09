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

  // Función privada para obtener los headers. La usaremos en todos los métodos.
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    // Si no hay token, el backend rechazará la petición, lo cual es correcto.
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  createBill(billData: CreateBillRequest): Observable<BillResponse> {
    return this.http.post<BillResponse>(this.billsUrl, billData, { headers: this.getHeaders() });
  }

  getAllBills(): Observable<BillResponse[]> {
    return this.http.get<BillResponse[]>(this.billsUrl, { headers: this.getHeaders() });
  }

  getBillById(billId: number): Observable<BillResponse> {
    return this.http.get<BillResponse>(`${this.billsUrl}/${billId}`, { headers: this.getHeaders() });
  }

  updateBill(billId: number, billData: CreateBillRequest): Observable<BillResponse> {
    return this.http.put<BillResponse>(`${this.billsUrl}/${billId}`, billData, { headers: this.getHeaders() });
  }

  deleteBill(billId: number): Observable<void> {
    return this.http.delete<void>(`${this.billsUrl}/${billId}`, { headers: this.getHeaders() });
  }

  getBillsByHousehold(householdId: number): Observable<BillResponse[]> {
    return this.getAllBills().pipe(
      map(bills => bills.filter(bill => bill.householdId === householdId))
    );
  }
}
