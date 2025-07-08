export interface MemberContribution {
  contributionId: number;
  memberId: number;
  monto: number;
  status: 'PENDIENTE' | 'PAGADO' | string; // puedes ajustar según los estados válidos
  pagadoEn: string | null; // ISO date string o null si aún no se ha pagado
}
