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
    ProgressSpinnerModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  household: Household | null = null;
  members: any[] = [];
  bills: any[] = [];
  contributions: any[] = [];
  loading = true;
  showOnboarding = false;
  onboardingForm: FormGroup;
  currencies = ['PEN', 'USD', 'EUR'];

  constructor(
    private householdService: HouseholdService,
    private http: HttpClient,
    private fb: FormBuilder
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
}
