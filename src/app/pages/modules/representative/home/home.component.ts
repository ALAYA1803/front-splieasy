import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Household } from '../../interfaces/household';
import { HouseholdService } from '../../services/household.service';
import { environment } from '../../../../core/environments/environment';
import { forkJoin, of } from 'rxjs';
import { switchMap, map, tap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  household: Household | null = null;
  members: any[] = [];
  bills: any[] = [];
  contributions: any[] = [];
  loading = true;

  constructor(
    private householdService: HouseholdService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const userId = Number(localStorage.getItem('userId'));
    if (!userId) {
      console.error('userId no encontrado en localStorage');
      this.loading = false;
      return;
    }
    this.loadDashboardData(userId);
  }

  private loadDashboardData(userId: number): void {
    this.loading = true;
    const token = localStorage.getItem('accessToken')!;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.householdService.getHouseholdByRepresentante(userId).pipe(
      tap(hs => console.log('Households encontrados:', hs)),
      map(hs => hs[0]),
      switchMap(hh => {
        if (!hh) {
          console.warn('No se encontró household para el usuario:', userId);
          this.loading = false;
          return of(null);
        }
        // Obtener detalles completos del household (con name y description)
        return this.http.get<Household>(
          `${environment.urlBackend}/households/${hh.id}`,
          { headers }
        ).pipe(
          tap(full => console.log('Detalles de household:', full)),
          catchError(err => {
            console.error('Error obteniendo detalle del household:', err);
            this.loading = false;
            return of(null);
          })
        );
      }),
      switchMap(fullHousehold => {
        if (!fullHousehold) {
          return of(null);
        }
        this.household = fullHousehold;

        // Traer miembros, facturas y contribuciones
        return forkJoin({
          allMembers: this.http.get<any[]>(
            `${environment.urlBackend}/household-members`,
            { headers }
          ),
          allBills: this.http.get<any[]>(
            `${environment.urlBackend}/bills`,
            { headers }
          ),
          allContributions: this.http.get<any[]>(
            `${environment.urlBackend}/contributions`,
            { headers }
          )
        }).pipe(
          catchError(err => {
            console.error('Error en forkJoin:', err);
            this.loading = false;
            return of(null);
          })
        );
      })
    ).subscribe(result => {
      if (result && this.household) {
        const hhId = this.household.id;
        this.members = result.allMembers.filter(m => m.householdId === hhId);
        this.bills = result.allBills.filter(b => b.householdId === hhId);
        this.contributions = result.allContributions.filter(c => c.householdId === hhId);
        console.log('Dashboard cargado:', { household: this.household, members: this.members, bills: this.bills, contributions: this.contributions });
      }
      this.loading = false;
    });
  }
}
