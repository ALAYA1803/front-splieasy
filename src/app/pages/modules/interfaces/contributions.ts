export interface Contribution {
  id: number;
  billId: number;
  householdId: number;
  description: string;
  strategy: string;
  fechaLimite: string;
  qr?: string;
  numero?: string;
}

export interface CreateContributionRequest {
  billId: number;
  householdId: number;
  description: string;
  strategy: string;
  fechaLimite: string;
  memberIds?: number[];
  qr?: string;
  numero?: string;
}

export interface UpdateContributionRequest {
  billId: number;
  householdId: number;
  description: string;
  strategy: string;
  fechaLimite: string;
}
