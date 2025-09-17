export interface MemberContribution {
  contributionId: number;
  memberId: number;
  monto: number;
  status: 'PENDIENTE' | 'PAGADO' | string;
  pagadoEn: string | null;
}
