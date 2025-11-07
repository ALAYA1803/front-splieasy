import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Household } from '../../interfaces/household';
import { HouseholdService } from '../../services/household.service';
import { environment } from '../../../../core/environments/environment';
import { forkJoin, of } from 'rxjs';
import { switchMap, tap, catchError, finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    DropdownModule,
    InputTextModule,
    InputTextarea,
    ButtonModule,
    ProgressSpinnerModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  household: Household | null = null;
  members: any[] = [];
  bills: any[] = [];
  contributions: any[] = [];
  // Contribuciones urgentes para mostrar en el home (vence hoy o mañana)
  urgentContributions: any[] = [];
  // Evita mostrar repetidamente el toast en la misma sesión de carga
  private shownUrgentToastCount = 0;
  // Track IDs of urgent items already shown to avoid duplicates cuando cambien orden/fecha
  private shownUrgentIds = new Set<string | number>();
  loading = true;
  showOnboarding = false;
  onboardingForm: FormGroup;
  currencies = ['PEN', 'USD', 'EUR'];

  constructor(
    private householdService: HouseholdService,
    private http: HttpClient,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.onboardingForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      currency: ['PEN', Validators.required]
    });
  }

  ngOnInit(): void {
    const userId = Number(localStorage.getItem('userId'));
    if (!userId) {
      console.error('userId no encontrado en localStorage');
      this.loading = false;
      return;
    }
    this.checkAndLoadDashboard(userId);
  }

  private checkAndLoadDashboard(userId: number): void {
    this.loading = true;
    this.householdService.getHouseholdByRepresentante(userId).subscribe({
      next: (households) => {
        if (households && households.length > 0) {
          this.showOnboarding = false;
          this.loadDashboardData(userId, households[0]);
        } else {
          this.showOnboarding = true;
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error al verificar el hogar del representante:', err);
        this.loading = false;
      }
    });
  }

  private loadDashboardData(userId: number, hh: Household): void {
    const token = localStorage.getItem('accessToken') || '';
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();

    this.http.get<Household>(`${environment.urlBackend}/households/${hh.id}`, { headers }).pipe(
      tap(full => console.log('Detalles de household:', full)),
      catchError(err => {
        console.warn('Error obteniendo detalle del household, usando fallback:', err);
        return of(hh as Household);
      }),
      switchMap((fullHousehold: Household | null) => {
        if (!fullHousehold) {
          this.household = null;
          return of(null);
        }
        this.household = fullHousehold;

        return forkJoin({
          allMembers: this.http.get<any[]>(
            `${environment.urlBackend}/household-members`, { headers }
          ).pipe(
            catchError(err => {
              console.warn('No se pudieron cargar miembros, se devuelve [].', err);
              return of<any[]>([]);
            })
          ),
          allBills: this.http.get<any[]>(
            `${environment.urlBackend}/bills`, { headers }
          ).pipe(
            catchError(err => {
              console.warn('No se pudieron cargar bills, se devuelve [].', err);
              return of<any[]>([]);
            })
          ),
          allContributions: this.http.get<any[]>(
            `${environment.urlBackend}/contributions`, { headers }
          ).pipe(
            catchError(err => {
              console.warn('No se pudieron cargar contribuciones, se devuelve [].', err);
              return of<any[]>([]);
            })
          )
        });
      }),
      finalize(() => {
        this.loading = false;
      })
    )
      .subscribe({
        next: (result) => {
          if (!result || !this.household) {
            this.members = [];
            this.bills = [];
            this.contributions = [];
            return;
          }

          const hhId = this.household.id;
          const members = Array.isArray(result.allMembers) ? result.allMembers : [];
          const bills = Array.isArray(result.allBills) ? result.allBills : [];
          const contributions = Array.isArray(result.allContributions) ? result.allContributions : [];

          this.members = members.filter(m => m.householdId === hhId);
          this.bills = bills.filter(b => b.householdId === hhId);
          this.contributions = contributions.filter(c => c.householdId === hhId);

          // Calcular contribuciones urgentes (hoy o mañana)
          this.computeUrgentContributions();

          console.log('Dashboard cargado:', {
            household: this.household,
            members: this.members,
            bills: this.bills,
            contributions: this.contributions
          });
        },
        error: (err) => {
          console.error('Error cargando dashboard:', err);
          this.members = [];
          this.bills = [];
          this.contributions = [];
        }
      });
  }

  createHousehold(): void {
    if (this.onboardingForm.invalid) return;

    this.loading = true;
    const userId = Number(localStorage.getItem('userId'));

    const newHousehold = {
      ...this.onboardingForm.value,
      representanteId: userId
    };

    this.householdService.createHousehold(newHousehold).subscribe({
      next: (createdHousehold) => {
        this.showOnboarding = false;
        this.loadDashboardData(userId, createdHousehold);
      },
      error: (err) => {
        console.error('Error al crear el hogar:', err);
        this.loading = false;
      }
    });
  }

  private getDaysUntil(value: Date | string | null | undefined): number | null {
    if (!value) return null;

    // Manejo robusto de strings 'YYYY-MM-DD' para evitar que se interpreten como UTC
    let d: Date;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, day] = value.split('-').map(v => Number(v));
      d = new Date(y, m - 1, day);
    } else {
      d = new Date(value as any);
    }

    if (isNaN(d.getTime())) return null;

    // Normalizar ambas fechas a medianoche local para evitar desfases por TZ
    const targetLocal = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffDays = Math.round((targetLocal.getTime() - todayLocal.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Helper para formatear una fecha respetando el mismo parseo local que getDaysUntil
  private formatLocalDate(value: Date | string | null | undefined): string {
    if (!value) return '';

    let d: Date;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, day] = value.split('-').map(v => Number(v));
      d = new Date(y, m - 1, day);
    } else {
      d = new Date(value as any);
    }

    if (isNaN(d.getTime())) return '';

    // Devolver en formato local legible (ej. '7/11/2025' según locale)
    return d.toLocaleDateString('es-PE');
  }

  private computeUrgentContributions(): void {
    try {
      const combined: any[] = [];

      (this.contributions || []).forEach(c => {
        const dateVal = c.fechaLimite ?? c.fecha_limite ?? c.deadline ?? c.dueDate ?? null;
        combined.push({ ...c, __type: 'contribution', __date: dateVal });
      });

      (this.bills || []).forEach(b => {
        const dateVal = b.dueDate ?? b.fechaLimite ?? b.fecha_limite ?? b.deadline ?? null;
        combined.push({ ...b, __type: 'bill', __date: dateVal });
      });

      const mapped = combined.map(i => ({ ...i, __daysUntil: this.getDaysUntil(i.__date) }));

      // Consideramos urgentes los que vencen hoy (0) o mañana (1)
      this.urgentContributions = mapped.filter(i => typeof i.__daysUntil === 'number' && i.__daysUntil >= 0 && i.__daysUntil <= 1);

      if ((this.urgentContributions?.length ?? 0) > 0 && this.shownUrgentToastCount !== this.urgentContributions.length) {
        this.showUrgentToast();
        this.shownUrgentToastCount = this.urgentContributions.length;
      }
    } catch (err) {
      console.error('Error calculando contribuciones urgentes en home', err);
      this.urgentContributions = [];
    }
  }

  private showUrgentToast(): void {
    try {
      // En lugar de agrupar, mostrar un toast por cada item urgente
      // No bloqueamos por cantidad: mostramos solo los items no mostrados aun usando shownUrgentIds

      this.messageService.clear();

      // Mostrar toasts individuales; limitamos a un máximo razonable por sesión (por ej. 10)
      const maxToShow = 20;
      const toShow = this.urgentContributions.slice(0, maxToShow);

      // Mostrar solo los items que no hemos mostrado aún (evitar duplicados)
      toShow.forEach((u: any, idx: number) => {
        // Determinar id único
        const uid = u.id ?? u._id ?? `${u.__type}-${u.__date}-${idx}`;
        if (this.shownUrgentIds.has(uid)) return;

        // Usar formatLocalDate para evitar parseo UTC en strings 'YYYY-MM-DD'
        const d = this.formatLocalDate(u.__date);
        const label = u.description ?? u.name ?? u.title ?? u.concept ?? 'Sin descripción';
        const typeLabel = u.__type === 'bill' ? 'Factura' : 'Contribución';
        const when = (u.__daysUntil === 0) ? 'vence hoy' : (u.__daysUntil === 1) ? 'vence mañana' : '';
        const summary = `${typeLabel}: ${label}`;
        const detail = when ? `${when} • ${d}` : `${d}`;

        const severity = (u.__daysUntil === 0) ? 'error' : ((u.__daysUntil === 1) ? 'warn' : 'info');
        this.messageService.add({
          severity,
          summary,
          detail,
          life: 8000
        });

        this.shownUrgentIds.add(uid);
      });

      // Si había más items de los que mostramos, añadir un toast final indicando cuántos más (opcional)
      if (this.urgentContributions.length > maxToShow) {
        const remaining = this.urgentContributions.length - maxToShow;
        this.messageService.add({
          severity: 'warn',
          summary: `+${remaining} más`,
          detail: 'Ver lista completa',
          life: 6000
        });
      }

      this.shownUrgentToastCount = this.shownUrgentIds.size;
    } catch (err) {
      console.error('Error mostrando toast de contribuciones urgentes', err);
    }
  }

}
