export interface Contribution {
  id: number;
  billId: number;
  householdId: number;
  description: string;
  strategy: string;
  fechaLimite: string; // formato: "YYYY-MM-DD"
}

export interface CreateContributionRequest {
  billId: number;
  householdId: number;
  description: string;
  strategy: string;
  fechaLimite: string; // formato: "YYYY-MM-DD"
}

export interface UpdateContributionRequest {
  billId: number;
  householdId: number;
  description: string;
  strategy: string;
  fechaLimite: string; // formato: "YYYY-MM-DD"
}
