import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize, switchMap, map } from 'rxjs/operators';

import { ContributionsService } from '../../services/contributions.service';
import { CreateContributionRequest } from '../../interfaces/contributions';

import { User } from '../../../../core/interfaces/auth';
import { AuthService } from '../../../../core/services/auth.service';

import { HouseholdService } from '../../services/household.service';
import { HouseholdMemberService } from '../../services/household-member.service';
import { BillsService } from '../../services/bills.service';
import { MemberContributionService } from '../../services/member-contribution.service';

import { environment } from '../../../../core/environments/environment';
import { HttpClient } from '@angular/common/http';

import { PaymentReceiptsService, PaymentReceipt } from '../../../../core/services/payment-receipts.service';

interface Member {
  memberId: number;
  userId: number;
  user?: User | any;
  isRepresentative: boolean;
}

type LoadData = {
  hms: any[];
  users: User[] | any[];
  bills: any[];
  contributions: any[];
  memberContributions: any[];
};

type ReceiptStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

@Component({
  selector: 'app-contributions',
  standalone: false,
  templateUrl: './contributions.component.html',
  styleUrls: ['./contributions.component.css']
})
export class ContributionsComponent implements OnInit {
  householdId = 0;

  contributions: any[] = [];
  bills: any[] = [];
  members: Member[] = [];
  miembros: Array<{ id: number; name: string; role: 'REPRESENTANTE' | 'MIEMBRO' }> = [];
  currentUser!: User;

  loading = true;
  mostrarDialogo = false;

  reviewDialogVisible = false;
  reviewForDetail: any | null = null;
  reviewReceipts: PaymentReceipt[] = [];
  reviewLoading = false;

  contributionForm!: FormGroup;

  private apiUrl = environment.urlBackend;

  estrategias = [
    { label: 'Igualitaria', value: 'EQUAL' },
    { label: 'Según Ingresos', value: 'INCOME_BASED' }
  ];

  constructor(
    private fb: FormBuilder,
    private contributionsService: ContributionsService,
    private householdService: HouseholdService,
    private householdMemberService: HouseholdMemberService,
    private authService: AuthService,
    private billService: BillsService,
    private memberContributionService: MemberContributionService,
    private http: HttpClient,
    private receiptsSvc: PaymentReceiptsService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
  }

  private toYMD(value: Date | string): string {
    if (value instanceof Date) {
      const y = value.getFullYear();
      const m = value.getMonth();
      const d = value.getDate();
      return new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
    }
    if (typeof value === 'string') return value.slice(0, 10);
    throw new Error('Fecha límite inválida');
  }

  private toNumberId(v: any): number | null {
    const cand = v?.id ?? v;
    if (cand === null || cand === undefined) return null;
    const n = typeof cand === 'string' ? parseInt(cand, 10) : cand;
    return Number.isFinite(n) ? n : null;
  }

  private normalizeMemberIdFromMC(mc: any): number | null {
    const cand = mc?.memberId ?? mc?.householdMemberId ?? mc?.member?.id;
    return this.toNumberId(cand);
  }

  private normalizeUserIdFromMC(mc: any): number | null {
    const cand = mc?.userId ?? mc?.user?.id;
    return this.toNumberId(cand);
  }

  private initializeForm(): void {
    this.contributionForm = this.fb.group({
      billId: [null, Validators.required],
      description: ['', Validators.required],
      fechaLimite: [null, Validators.required],
      strategy: ['EQUAL', Validators.required],
      miembros: [[], []]
    });
  }

  private loadData(): void {
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      console.error('No se encontró información del usuario actual');
      this.loading = false;
      return;
    }

    this.currentUser = JSON.parse(raw);
    this.loading = true;

    this.householdService.getHouseholdByRepresentante(this.currentUser.id).pipe(
      switchMap(hhs => {
        const household = Array.isArray(hhs) ? hhs[0] : null;
        if (!household) return of<LoadData | null>(null);

        this.householdId = household.id;

        const hms$  : Observable<any[]> = this.householdMemberService.getByHouseholdId(this.householdId).pipe(
          map(v => Array.isArray(v) ? v : []), catchError(() => of<any[]>([]))
        );
        const users$: Observable<any[]> = this.authService.getAllUsers().pipe(
          map(v => Array.isArray(v) ? v : []), catchError(() => of<any[]>([]))
        );
        const bills$: Observable<any[]> = this.getBillsByHousehold(this.householdId).pipe(
          map(v => Array.isArray(v) ? v : []), catchError(() => of<any[]>([]))
        );
        const contribs$: Observable<any[]> = this.contributionsService.getByHouseholdId(this.householdId).pipe(
          map(v => Array.isArray(v) ? v : []), catchError(() => of<any[]>([]))
        );
        const mcs$  : Observable<any[]> = this.memberContributionService.getAll().pipe(
          map(v => Array.isArray(v) ? v : []), catchError(() => of<any[]>([]))
        );

        return forkJoin({ hms: hms$, users: users$, bills: bills$, contributions: contribs$, memberContributions: mcs$ }) as Observable<LoadData>;
      }),
      finalize(() => (this.loading = false))
    )
      .subscribe({
        next: (payload: LoadData | null) => {
          if (!payload) {
            this.bills = [];
            this.members = [];
            this.miembros = [];
            this.contributions = [];
            return;
          }

          const { hms, users, bills, contributions: contribsArr, memberContributions } = payload;

          this.bills = (bills || []).map(b => ({ ...b }));

          this.members = (hms || [])
            .map((hm: any) => {
              const memberId = hm?.id ?? hm?.memberId ?? hm?.householdMemberId;
              const userId   = hm?.userId ?? hm?.user?.id;
              if (!Number.isFinite(memberId) || !Number.isFinite(userId)) return null;

              const user = (users as any[]).find(u => u.id === userId);
              const isRep = Boolean(
                hm?.isRepresentative ??
                (user?.roles?.includes?.('ROLE_REPRESENTANTE')) ??
                false
              );

              const m: Member = {
                memberId,
                userId,
                user,
                isRepresentative: isRep
              };
              return m;
            })
            .filter((m: Member | null): m is Member => m !== null);

          this.miembros = this.members.map(m => ({
            id: m.memberId,
            name: m.user?.username || 'Sin nombre',
            role: m.isRepresentative ? 'REPRESENTANTE' : 'MIEMBRO'
          }));

          const list = (contribsArr || [])
            .filter((c: any) => {
              const hid = c.householdId ?? c.household_id ?? c.household?.id;
              if (hid !== this.householdId) return false;
              const bid = c.billId ?? c.bill_id ?? c.bill?.id;
              return this.bills.some((b: any) => b.id === bid);
            })
            .map((c: any) => {
              const bid = c.billId ?? c.bill_id ?? c.bill?.id;
              const bill = this.bills.find((b: any) => b.id === bid);

              const mcsAll = (memberContributions || []).filter((mc: any) =>
                (mc.contributionId ?? mc.contribution?.id) === c.id
              );

              const mcsUnique = mcsAll.filter((mc: any, idx: number, arr: any[]) =>
                arr.findIndex(x =>
                  (x.contributionId ?? x.contribution?.id) === (mc.contributionId ?? mc.contribution?.id) &&
                  (x.memberId ?? x.member?.id ?? x.householdMemberId) === (mc.memberId ?? mc.member?.id ?? mc.householdMemberId)
                ) === idx
              );

              const details = mcsUnique.map((mc: any) => {
                const hmId = this.normalizeMemberIdFromMC(mc);
                let uid  = this.normalizeUserIdFromMC(mc);

                if (!uid && hmId && !this.members.find(m => m.memberId === hmId)) {
                  uid = hmId;
                }

                let member = (hmId != null) ? this.members.find(m => m.memberId === hmId) : undefined;
                if (!member && uid != null) {
                  member = this.members.find(m => m.userId === uid);
                }

                const displayName =
                  member?.user?.username ??
                  mc?.user?.username ??
                  mc?.member?.user?.username ??
                  `Miembro #${uid ?? hmId ?? '-'}`;

                const displayRole = member?.isRepresentative ? 'REPRESENTANTE' : 'MIEMBRO';

                const normalizedStatus = this.normalizeDetailStatus(mc?.status);

                return {
                  ...mc,
                  monto: Number(mc.monto) || 0,
                  status: normalizedStatus,
                  displayName,
                  displayRole,
                  receipts: [] as PaymentReceipt[],
                  pendingReceiptsCount: 0
                };
              });

              const totalCents = mcsUnique.reduce((s: number, mc: any) => s + Math.round((Number(mc.monto) || 0) * 100), 0);
              const montoTotal = totalCents / 100;

              return { ...c, bill, details, montoTotal, expanded: false };
            })
            .sort((a: any, b: any) => {
              const da = new Date(a.fechaLimite ?? a.fecha_limite ?? a.deadline ?? 0).getTime();
              const db = new Date(b.fechaLimite ?? b.fecha_limite ?? b.deadline ?? 0).getTime();
              return da - db;
            });

          this.contributions = list;

          this.prefetchReceiptsForAllDetails();
        },
        error: (err) => {
          console.error(' Error cargando contribuciones:', err);
          this.bills = [];
          this.members = [];
          this.miembros = [];
          this.contributions = [];
        }
      });
  }

  private normalizeDetailStatus(s: any): 'PAGADO' | 'PENDIENTE' | 'EN_REVISION' | 'RECHAZADO' {
    const v = String(s || 'PENDIENTE').toUpperCase().trim();
    if (v === 'PAID' || v === 'PAGADO') return 'PAGADO';
    if (v === 'EN_REVISION' || v === 'PENDING_REVIEW' || v === 'EN-REVISION' || v === 'REVIEW') return 'EN_REVISION';
    if (v === 'RECHAZADO' || v === 'REJECTED') return 'RECHAZADO';
    return 'PENDIENTE';
  }

  private prefetchReceiptsForAllDetails(): void {
    const mcIds = new Set<number>();
    this.contributions.forEach(c => {
      c.details?.forEach((d: any) => {
        const id = Number(d.id ?? d.memberContributionId ?? d.member_contribution_id);
        if (Number.isFinite(id)) mcIds.add(id);
      });
    });
    if (mcIds.size === 0) return;

    const calls = Array.from(mcIds).map(id =>
      this.receiptsSvc.list(id).pipe(
        catchError(() => of([] as PaymentReceipt[])),
        map(list => ({ id, list }))
      )
    );

    forkJoin(calls).subscribe({
      next: pairs => {
        const byMc = new Map<number, PaymentReceipt[]>();
        pairs.forEach(p => byMc.set(p.id, p.list));

        this.contributions = this.contributions.map(c => {
          const details = (c.details || []).map((d: any) => {
            const id = Number(d.id ?? d.memberContributionId ?? d.member_contribution_id);
            const receipts = byMc.get(id) || [];
            const pending = receipts.filter(r => r.status === 'PENDING').length;
            return { ...d, receipts, pendingReceiptsCount: pending };
          });
          return { ...c, details };
        });
      },
      error: err => console.error('Error prefetching receipts:', err)
    });
  }

  openReviewDialog(detail: any): void {
    const mcId = Number(detail.id ?? detail.memberContributionId ?? detail.member_contribution_id);
    if (!Number.isFinite(mcId)) return;

    this.reviewForDetail = detail;
    this.reviewDialogVisible = true;
    this.reviewLoading = true;

    this.receiptsSvc.list(mcId)
      .pipe(catchError(() => of([] as PaymentReceipt[])), finalize(() => (this.reviewLoading = false)))
      .subscribe(list => {
        this.reviewReceipts = list || [];
      });
  }

  approveReceipt(r: PaymentReceipt): void {
    if (!window.confirm('¿Aprobar esta boleta? Se marcará como PAGADO.')) return;

    this.receiptsSvc.approve(r.id)
      .pipe(catchError(() => of(null)))
      .subscribe(ok => {
        if (!ok) return;

        this.reviewReceipts = this.reviewReceipts.map(x =>
          x.id === r.id ? { ...x, status: 'APPROVED' } : x
        );

        if (this.reviewForDetail) {
          this.reviewForDetail.status = 'PAGADO';
          this.reviewForDetail.pendingReceiptsCount = Math.max(0, (this.reviewForDetail.pendingReceiptsCount || 1) - 1);
        }

        this.prefetchReceiptsForAllDetails();
      });
  }

  rejectReceipt(r: PaymentReceipt): void {
    const notes = window.prompt('Motivo del rechazo (opcional):', '') ?? '';

    this.receiptsSvc.reject(r.id, notes)
      .pipe(catchError(() => of(null)))
      .subscribe(ok => {
        if (!ok) return;

        this.reviewReceipts = this.reviewReceipts.map(x =>
          x.id === r.id ? { ...x, status: 'REJECTED', notes } : x
        );

        if (this.reviewForDetail && this.reviewForDetail.status === 'EN_REVISION') {
          this.reviewForDetail.pendingReceiptsCount = Math.max(0, (this.reviewForDetail.pendingReceiptsCount || 1) - 1);
        }

        this.prefetchReceiptsForAllDetails();
      });
  }

  receiptTagClass(s: ReceiptStatus): string {
    switch (s) {
      case 'APPROVED': return 'p-tag-success';
      case 'REJECTED': return 'p-tag-danger';
      default: return 'p-tag-warning';
    }
  }

  onDeleteContribution(contribution: any): void {
    if (!window.confirm(`¿Eliminar la contribución "${contribution.description}"?`)) return;

    this.loading = true;
    this.contributionsService.deleteContribution(contribution.id).pipe(
      finalize(() => (this.loading = false))
    ).subscribe({
      next: ok => {
        if (ok) {
          this.contributions = this.contributions.filter(c => c.id !== contribution.id);
        } else {
          alert('No se pudo eliminar la contribución.');
        }
      },
      error: err => {
        console.error(' Error eliminando contribución:', err);
        if (err?.status === 401) alert('Tu sesión expiró. Inicia sesión nuevamente.');
        else alert('Error al eliminar la contribución.');
      }
    });
  }

  abrirDialogo(): void {
    this.contributionForm.reset({
      billId: null,
      description: '',
      fechaLimite: null,
      strategy: 'EQUAL',
      miembros: []
    });
    this.mostrarDialogo = true;
  }

  cerrarDialogo(): void {
    this.mostrarDialogo = false;
  }

  guardarContribution(): void {
    if (this.contributionForm.invalid || !this.householdId) return;

    const fv = this.contributionForm.value;

    let fechaLimite: string;
    try {
      fechaLimite = this.toYMD(fv.fechaLimite);
    } catch {
      alert('La fecha límite es inválida.');
      return;
    }

    const billIdMaybe = this.toNumberId(fv.billId);
    if (!(typeof billIdMaybe === 'number' && Number.isFinite(billIdMaybe))) {
      alert('Selecciona un comprobante (bill) válido.');
      return;
    }
    const billId: number = billIdMaybe;

    const selected = Array.isArray(fv.miembros) ? fv.miembros : [];
    const rawIds: number[] = selected
      .map((x: any) => {
        const v = typeof x === 'number' ? x : (x?.id ?? x?.memberId ?? x);
        const n = typeof v === 'string' ? parseInt(v, 10) : v;
        return Number.isFinite(n) ? (n as number) : NaN;
      })
      .filter((n: number) => Number.isFinite(n));
    const memberIds: number[] = Array.from<number>(new Set<number>(rawIds));

    if (memberIds.length === 0) {
      alert('Selecciona al menos un miembro del hogar para la contribución.');
      return;
    }

    const req: CreateContributionRequest = {
      billId,
      householdId: Number(this.householdId),
      description: String(fv.description ?? '').trim(),
      strategy: String(fv.strategy ?? 'EQUAL').toUpperCase(),
      fechaLimite,
      memberIds
    };

    this.loading = true;
    this.contributionsService.createContribution(req)
      .pipe(
        finalize(() => (this.loading = false)),
        catchError(err => { console.error('Error creando contribución:', err); return of(null); })
      )
      .subscribe(saved => {
        if (!saved) return;
        this.mostrarDialogo = false;
        this.loadData();
      });
  }

  private getBillsByHousehold(householdId: number): Observable<any[]> {
    const svc: any = this.billService as any;
    const obs: Observable<any> = svc.getBillsByHousehold(householdId);
    return obs.pipe(map(v => Array.isArray(v) ? v : []));
  }

  private getBillAmount(bill: any): number {
    if (!bill) return 0;
    const fields = ['monto', 'amount', 'total', 'valor', 'price'];
    for (const f of fields) {
      const n = Number(bill?.[f]);
      if (Number.isFinite(n)) return n;
    }
    return 0;
  }

  get selectedBillMonto(): number {
    const raw = this.contributionForm.get('billId')?.value;
    const billId = this.toNumberId(raw);
    const bill = this.bills.find((b: any) => b.id === billId);
    return this.getBillAmount(bill);
  }

  getStatusClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'pagado':    return 'p-tag-success';
      case 'pendiente': return 'p-tag-warning';
      case 'vencido':   return 'p-tag-danger';
      default:          return 'p-tag-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'pagado':    return 'Pagado';
      case 'pendiente': return 'Pendiente';
      case 'vencido':   return 'Vencido';
      default:          return status || 'Sin estado';
    }
  }

  reloadData(): void {
    this.loading = true;
    this.loadData();
  }
}
