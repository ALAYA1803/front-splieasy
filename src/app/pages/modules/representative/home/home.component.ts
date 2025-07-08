import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Household } from '../../interfaces/household';
import { HouseholdService } from '../../services/household.service';
import { environment } from '../../../../core/environments/environment';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  household: Household | null = null;
  members: any[] = [];
  bills: any[] = [];
  contributions: any[] = [];

  constructor(
    private householdService: HouseholdService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const userId = Number(localStorage.getItem('userId'));
    if (!userId) {
      console.error('userId no encontrado en localStorage');
      return;
    }

    this.householdService.getHouseholdByRepresentante(userId).subscribe({
      next: (households) => {
        console.log('Households encontrados:', households);
        this.household = households[0] || null;

        if (this.household) {
          const hid = this.household.id;
          console.log('Household ID:', hid);

          const headers = new HttpHeaders({
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          });

          // Obtener miembros y filtrar por household_id en el frontend
          this.http.get<any[]>(`${environment.urlBackend}/household-members`, { headers })
            .subscribe({
              next: (allMembers) => {
                this.members = allMembers.filter(member => member.householdId === hid);
                console.log('Miembros filtrados:', this.members);
              },
              error: (err) => console.error('Error obteniendo miembros:', err)
            });

          // Obtener bills y filtrar por household_id en el frontend
          this.http.get<any[]>(`${environment.urlBackend}/bills`, { headers })
            .subscribe({
              next: (allBills) => {
                this.bills = allBills.filter(bill => bill.householdId === hid);
                console.log('Bills filtradas:', this.bills);
              },
              error: (err) => console.error('Error obteniendo bills:', err)
            });

          // Obtener contributions y filtrar por household_id en el frontend
          this.http.get<any[]>(`${environment.urlBackend}/contributions`, { headers })
            .subscribe({
              next: (allContributions) => {
                this.contributions = allContributions.filter(contribution => contribution.householdId === hid);
                console.log('Contributions filtradas:', this.contributions);
              },
              error: (err) => console.error('Error obteniendo contributions:', err)
            });
        } else {
          console.log('No se encontró household para el usuario:', userId);
        }
      },
      error: err => console.error('Error obteniendo household:', err)
    });
  }
}
