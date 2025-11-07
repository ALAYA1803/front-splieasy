import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap, forkJoin, of, catchError, map } from 'rxjs';
import { environment } from '../../../../core/environments/environment';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

interface Household {
  id: number;
  name: string;
  description: string;
  currency: string;
  representanteId: number;
}

interface RawUser {
  id: number;
  username?: string;
  email?: string;
  income?: number;
  roles?: string[];
}

interface ViewUser {
  id: number;
  username: string;
  email: string;
  income: number;
  roles: string[];
}

interface Contribution {
  id: number;
  householdId: number;
  description?: string;
  strategy?: string;
  fechaLimite?: string;
  memberIds?: number[];
}

interface MemberContribution {
  id: number;
  contributionId: number;
  memberId: number;
  monto: number;
  status?: 'PENDIENTE' | 'PAGADO' | 'PENDING' | 'PAID';
  pagadoEn?: string | null;
}

@Component({
  selector: 'app-memb-home',
  standalone: true,
  imports: [CommonModule, TranslateModule, AvatarModule, TagModule, ProgressSpinnerModule],
  templateUrl: './memb-home.component.html',
  styleUrls: ['./memb-home.component.css']
})
export class MembHomeComponent implements OnInit {
  currentUser!: ViewUser;

  household: Household | null = null;
  members: ViewUser[] = [];

  contributions: MemberContribution[] = [];

  activeContributions: MemberContribution[] = [];
  paidContributions: MemberContribution[] = [];

  totalPendiente = 0;
  totalPagado = 0;
  activeContribsCount = 0;

  blockedHouseholdContribs = false;
  blockedMemberContribs = false;

  loading = true;

  // nuevas propiedades para alertas
  householdContributions: Contribution[] = [];
  alerts: { contribution: Contribution; daysLeft: number; state: 'overdue' | 'due-soon' }[] = [];

  // grupos para la card única
  alertsToday: { contribution: Contribution; daysLeft: number; state: 'overdue' | 'due-soon' }[] = [];
  alertsTomorrow: { contribution: Contribution; daysLeft: number; state: 'overdue' | 'due-soon' }[] = [];

  // número de días para considerar "por vencer"
  private readonly ALERT_DAYS = 3;

  private readonly API_URL = environment.urlBackend;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const userString = localStorage.getItem('currentUser');
    if (userString) {
      const u: RawUser = JSON.parse(userString);
      this.currentUser = this.safeUser(u);
      this.loadDashboardData();
    } else {
      this.loading = false;
      console.error('No se encontró usuario en la sesión.');
    }
  }

  private normalizeStatus(s: MemberContribution['status']): 'PENDING' | 'PAID' {
    return (s === 'PAGADO' || s === 'PAID') ? 'PAID' : 'PENDING';
  }

  private getAmount(c: MemberContribution): number {
    return Number(c.monto ?? 0) || 0;
  }

  private safeUser(u: RawUser): ViewUser {
    const username =
      (u.username && u.username.trim()) ||
      (u.email ? u.email.split('@')[0] : 'Usuario');

    return {
      id: u.id,
      username,
      email: u.email ?? '',
      income: u.income ?? 0,
      roles: Array.isArray(u.roles) && u.roles.length ? u.roles : ['ROLE_MIEMBRO']
    };
  }

  private someMemberIsMe(members: any[]): boolean {
    return members?.some(m =>
      (typeof m?.userId === 'number' && m.userId === this.currentUser.id) ||
      (typeof m?.id === 'number' && (m?.username || m?.email) && m.id === this.currentUser.id) ||
      (typeof m?.user?.id === 'number' && m.user.id === this.currentUser.id)
    );
  }

  private findMyHouseholdByScanning() {
    return this.http.get<Household[]>(`${this.API_URL}/households`).pipe(
      catchError(() => of([] as Household[])),
      switchMap((hhs) => {
        if (!hhs?.length) return of<Household | null>(null);

        const probes = hhs.map(h =>
          this.http.get<any[]>(`${this.API_URL}/households/${h.id}/members`).pipe(
            catchError(() => of([] as any[])),
            map(members => ({ h, isMine: this.someMemberIsMe(members) }))
          )
        );

        return forkJoin(probes).pipe(
          map(rows => rows.find(r => r.isMine)?.h ?? null)
        );
      })
    );
  }

  private fetchHousehold(householdId: number) {
    return this.http.get<Household>(`${this.API_URL}/households/${householdId}`).pipe(
      catchError(() =>
        of({ id: householdId, name: 'Mi hogar', description: '', currency: 'PEN', representanteId: 0 } as Household)
      )
    );
  }

  private fetchMembers(householdId: number) {
    return this.http.get<any[]>(`${this.API_URL}/households/${householdId}/members`).pipe(
      catchError(() => of([] as any[])),
      switchMap(arr => {
        if (!arr?.length) return of([] as ViewUser[]);

        const looksLikeUsers = arr.some(m => m?.username || m?.email);
        if (looksLikeUsers) {
          return of(arr.map((u: RawUser) => this.safeUser(u)));
        }

        const ids = Array.from(new Set(arr.map(m => m?.userId).filter((x: any) => typeof x === 'number'))) as number[];
        if (!ids.length) return of([] as ViewUser[]);

        const calls = ids.map(uid =>
          this.http.get<RawUser>(`${this.API_URL}/users/${uid}`).pipe(
            catchError(() => of({ id: uid } as RawUser))
          )
        );

        return forkJoin(calls).pipe(map(users => users.map(u => this.safeUser(u))));
      })
    );
  }

  private fetchMyMemberContributions(householdId: number) {
    return this.http.get<MemberContribution[]>(
      `${this.API_URL}/member-contributions`,
      { params: { householdId: String(householdId), memberId: String(this.currentUser.id) } }
    ).pipe(
      catchError((err) => {
        if (err?.status === 403) {
          this.blockedMemberContribs = true;
          console.warn('403 en /member-contributions?householdId&memberId. Sin permiso para ver montos por miembro.');
        }
        return of([] as MemberContribution[]);
      })
    );
  }

  private fetchHouseholdContributions(householdId: number) {
    return this.http.get<Contribution[]>(`${this.API_URL}/households/${householdId}/contributions`).pipe(
      catchError((err) => {
        if (err?.status === 403) {
          this.blockedHouseholdContribs = true;
          return of([] as Contribution[]);
        }
        return of([] as Contribution[]);
      })
    );
  }

  // obtiene año/mes/día según la interpretación en la zona de Perú (UTC-5)
  private getPeruYMDFromString(fecha?: string): { y: number; m: number; d: number } | null {
    if (!fecha) return null;

    // 1) intentar extraer YYYY-MM-DD al inicio (incluso si viene con hora: 2025-11-07T00:00:00Z)
    const isoPrefix = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoPrefix) {
      return { y: Number(isoPrefix[1]), m: Number(isoPrefix[2]) - 1, d: Number(isoPrefix[3]) };
    }

    // 2) intentar DD/MM/YYYY al inicio
    const slashPrefix = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (slashPrefix) {
      return { y: Number(slashPrefix[3]), m: Number(slashPrefix[2]) - 1, d: Number(slashPrefix[1]) };
    }

    // 3) fallback: parsear con Date y convertir a fecha Perú (UTC-5)
    const parsed = new Date(fecha);
    if (isNaN(parsed.getTime())) return null;

    const OFFSET_HOURS = 5; // Perú UTC-5
    const peruTimeMs = parsed.getTime() - (OFFSET_HOURS * 60 * 60 * 1000);
    const peru = new Date(peruTimeMs);
    return { y: peru.getUTCFullYear(), m: peru.getUTCMonth(), d: peru.getUTCDate() };
  }

  private daysLeftUntil(fecha?: string): number | null {
    const ymd = this.getPeruYMDFromString(fecha);
    if (!ymd) return null;

    // hoy en Perú
    const OFFSET_HOURS = 5;
    const now = new Date();
    const peruNowMs = now.getTime() - (OFFSET_HOURS * 60 * 60 * 1000);
    const peruNow = new Date(peruNowMs);
    const todayUTC = Date.UTC(peruNow.getUTCFullYear(), peruNow.getUTCMonth(), peruNow.getUTCDate());

    const deadlineUTC = Date.UTC(ymd.y, ymd.m, ymd.d);
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((deadlineUTC - todayUTC) / msPerDay);
  }

  private computeAlerts(contribs: Contribution[]) {
    this.alerts = [];
    if (!contribs || !contribs.length) return;

    contribs.forEach(c => {
      // Si el miembro ya tiene una contribución pagada asociada a esta contribución del hogar,
      // la ignoramos (no debe aparecer en las alertas).
      const alreadyPaidByMe = this.paidContributions?.some(pc => pc && pc.contributionId === c.id && this.normalizeStatus(pc.status) === 'PAID');
      if (alreadyPaidByMe) return;

      const daysLeft = this.daysLeftUntil(c.fechaLimite);
      if (daysLeft === null) return; // sin fecha

      if (daysLeft < 0) {
        // vencida -> la podemos ignorar en estas columnas, o incluirla en otra sección; por ahora la guardamos
        this.alerts.push({ contribution: c, daysLeft, state: 'overdue' });
      } else if (daysLeft <= this.ALERT_DAYS) {
        this.alerts.push({ contribution: c, daysLeft, state: 'due-soon' });
      }
    });

    // ordenar: primero vencidas, luego por vencer por días asc
    this.alerts.sort((a, b) => {
      if (a.state === b.state) return a.daysLeft - b.daysLeft;
      return a.state === 'overdue' ? -1 : 1;
    });

    // poblar grupos para la tarjeta única: hoy (0) y mañana (1)
    this.alertsToday = this.alerts.filter(a => a.daysLeft === 0);
    this.alertsTomorrow = this.alerts.filter(a => a.daysLeft === 1);
  }

  // formatea fecha como DD/MM/YY según la interpretación en Perú
  public formatDate(fecha?: string): string {
    const ymd = this.getPeruYMDFromString(fecha);
    if (!ymd) return fecha || '';
    const pad = (n: number) => n < 10 ? `0${n}` : `${n}`;
    const yy = ymd.y % 100;
    return `${pad(ymd.d)}/${pad(ymd.m + 1)}/${pad(yy)}`;
  }

  loadDashboardData(): void {
    this.loading = true;
    this.blockedHouseholdContribs = false;
    this.blockedMemberContribs = false;

    this.findMyHouseholdByScanning().pipe(
      switchMap((h) => {
        if (!h) {
          console.log('El usuario no pertenece a ningún hogar (o no se pudo determinar por permisos).');
          this.loading = false;
          return of(null);
        }

        const householdId = h.id;

        return forkJoin({
          household: this.fetchHousehold(householdId),
          members: this.fetchMembers(householdId),
          myMemberContribs: this.fetchMyMemberContributions(householdId),
          householdContribs: this.fetchHouseholdContributions(householdId)
        });
      })
    ).subscribe({
      next: (bundle) => {
        if (!bundle) { this.loading = false; return; }

        const { household, members, myMemberContribs, householdContribs } = bundle as any;

        this.household = { ...household, currency: household.currency || 'PEN' };
        this.members = members;

        // guardar contribuciones del hogar para alertas
        this.householdContributions = householdContribs || [];
        // NOTA: movemos el cálculo de alertas más abajo, después de normalizar las contribuciones del miembro

        const normalized: MemberContribution[] = (myMemberContribs || []).map((c: MemberContribution) => ({
          ...c,
          status: this.normalizeStatus(c.status)
        }));
        this.activeContributions = normalized.filter((c: MemberContribution) => c.status === 'PENDING');
        this.paidContributions   = normalized.filter((c: MemberContribution) => c.status === 'PAID');
        this.contributions = this.activeContributions;
        this.totalPendiente = this.activeContributions.reduce((sum, c) => sum + this.getAmount(c), 0);
        this.totalPagado    = this.paidContributions.reduce((sum, c) => sum + this.getAmount(c), 0);
        this.activeContribsCount = this.activeContributions.length;

        // ahora sí calcular alertas teniendo en cuenta las contribuciones ya pagadas por el miembro
        this.computeAlerts(this.householdContributions);

        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar el dashboard', err);
        this.loading = false;
      }
    });
  }
}
