import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-contributions',
  standalone: false,
  templateUrl: './contributions.component.html',
  styleUrl: './contributions.component.css'
})
export class ContributionsComponent implements OnInit {
  householdId = 0;
  contributions: any[] = [];
  bills: any[] = [];
  members: any[] = [];
  loading = true;
  showForm = false;
  contributionForm!: FormGroup;

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  ngOnInit() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);

    this.contributionForm = this.fb.group({
      bill_id: [null, Validators.required],
      descripcion: ['', Validators.required],
      fecha_limite: ['', Validators.required],
      strategy: ['EQUAL', Validators.required]
    });

    this.http.get<any[]>(`http://localhost:3000/households?representante_id=${currentUser.id}`).subscribe(households => {
      const household = households[0];
      if (household) {
        this.householdId = household.id;

        forkJoin({
          hms: this.http.get<any[]>(`http://localhost:3000/household_members?household_id=${this.householdId}`),
          users: this.http.get<any[]>(`http://localhost:3000/users`),
          bills: this.http.get<any[]>(`http://localhost:3000/bills?household_id=${this.householdId}`),
          contributions: this.http.get<any[]>(`http://localhost:3000/contributions?household_id=${this.householdId}`),
          memberContributions: this.http.get<any[]>(`http://localhost:3000/member_contributions`)
        }).subscribe(({ hms, users, bills, contributions, memberContributions }) => {
          this.bills = bills;
          const representative = users.find(u => u.id == currentUser.id);

          this.members = [
            ...hms.map(hm => ({
              ...hm,
              user: users.find(u => u.id == hm.user_id)
            })),
            {
              user_id: representative.id,
              household_id: this.householdId,
              user: representative
            }
          ];

          this.contributions = contributions.map(c => {
            const details = memberContributions
              .filter(mc => mc.contribution_id == c.id)
              .map(mc => ({
                ...mc,
                user: users.find(u => u.id == mc.member_id)
              }));

            const hasRep = details.some(d => d.user?.id == representative.id);

            if (!hasRep) {
              const monto = this.calculateMontoFaltante(c, details, representative, users);
              details.push({
                contribution_id: c.id,
                member_id: representative.id,
                monto,
                status: 'PENDIENTE',
                pagado_en: null,
                user: representative
              });
            }

            return {
              ...c,
              details
            };
          });

          this.loading = false;
        });
      }
    });
  }

  openForm() {
    this.showForm = true;
    this.contributionForm.reset({
      bill_id: null,
      descripcion: '',
      fecha_limite: '',
      strategy: 'EQUAL'
    });
  }

  submit() {
    const data = {
      ...this.contributionForm.value,
      household_id: this.householdId
    };

    const billId = +data.bill_id;
    const bill = this.bills.find(b => +b.id === billId);

    if (!bill) {
      alert('Error: no se encontró la cuenta seleccionada.');
      return;
    }

    const total = bill.monto;

    this.http.post('http://localhost:3000/contributions', data).subscribe((savedContribution: any) => {
      const memberContributions = this.calculateDivision(total, data.strategy, savedContribution.id);

      memberContributions.forEach(mc => {
        this.http.post('http://localhost:3000/member_contributions', mc).subscribe();
      });

      this.contributions.push(savedContribution);
      this.showForm = false;
    });
  }

  calculateDivision(total: number, strategy: string, contribution_id: number) {
    if (strategy === 'EQUAL') {
      const amount = +(total / this.members.length).toFixed(2);
      return this.members.map(m => ({
        contribution_id,
        member_id: m.user_id,
        monto: amount,
        status: 'PENDIENTE',
        pagado_en: null
      }));
    } else {
      const totalIncome = this.members.reduce((sum, m) => sum + m.user.income, 0);
      return this.members.map(m => {
        const porcentaje = m.user.income / totalIncome;
        const monto = +(total * porcentaje).toFixed(2);
        return {
          contribution_id,
          member_id: m.user_id,
          monto,
          status: 'PENDIENTE',
          pagado_en: null
        };
      });
    }
  }

  calculateMontoFaltante(c: any, existingDetails: any[], rep: any, users: any[]) {
    const bill = this.bills.find(b => b.id == c.bill_id);
    if (!bill) return 0;

    const total = bill.monto;
    const strategy = c.strategy;
    const currentTotal = existingDetails.reduce((sum, d) => sum + d.monto, 0);

    if (strategy === 'EQUAL') {
      const n = existingDetails.length + 1;
      return +(total / n).toFixed(2);
    } else {
      const incomes = this.members.map(m => m.user.income);
      const totalIncome = incomes.reduce((sum, i) => sum + i, 0);
      const porcentaje = rep.income / totalIncome;
      return +(total * porcentaje).toFixed(2);
    }
  }

  getBillDescription(bill_id: number): string {
    const bill = this.bills.find(b => +b.id === +bill_id);
    return bill ? bill.descripcion : 'Cuenta no encontrada';
  }
}
