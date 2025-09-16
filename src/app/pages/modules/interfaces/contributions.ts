export interface Contribution {
  id: number;
  billId: number;
  householdId: number;
  description: string;
  strategy: string;
  fechaLimite: string;
}

export interface CreateContributionRequest {
  billId: number;
  householdId: number;
  description: string;
  strategy: string;
  fechaLimite: string;
  memberIds?: number[];
}

export interface UpdateContributionRequest {
  billId: number;
  householdId: number;
  description: string;
  strategy: string;
  fechaLimite: string;
}
