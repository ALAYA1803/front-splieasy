// interfaces/bills.ts
export interface Bill {
  id: number;
  householdId: number;
  descripcion: string;
  monto: number;
  createdBy: number;
  fecha: string; // formato ISO date
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBillRequest {
  householdId: number;
  descripcion: string;
  monto: number;
  fecha: string; // formato ISO date
}

export interface UpdateBillRequest {
  descripcion: string;
  monto: number;
  fecha: string;
}

export interface BillResponse {
  id: number;
  householdId: number;
  descripcion: string;
  monto: number;
  createdBy: number;
  fecha: string;
  createdAt: string;
  updatedAt: string;
}
