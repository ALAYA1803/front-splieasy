import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ContributionsService } from '../../services/contributions.service';
import { environment } from '../../../../core/environments/environment';
import { Contribution, CreateContributionRequest } from '../../interfaces/contributions';
import { User } from '../../../../core/interfaces/auth';
import { AuthService } from '../../../../core/services/auth.service';
import { HouseholdService } from '../../services/household.service';
import { HouseholdMemberService } from '../../services/household-member.service';
import { BillsService } from '../../services/bills.service';
import { MemberContributionService } from '../../services/member-contribution.service';

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
  currentUser!: User;
  loading = true;
  showForm = false;
  contributionForm!: FormGroup;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private contributionsService: ContributionsService,
    private householdService: HouseholdService,
    private householdMemberService: HouseholdMemberService,
    private authService: AuthService,
    private billService: BillsService,
    private memberContributionService: MemberContributionService
  ) {}

  ngOnInit() {
  const currentUserData = localStorage.getItem('currentUser');
  if (!currentUserData) {
    console.error('No se encontró información del usuario actual');
    return;
  }

  this.currentUser = JSON.parse(currentUserData);

  this.contributionForm = this.fb.group({
    billId: [null, Validators.required],
    description: ['', Validators.required],
    fechaLimite: [null, Validators.required],
    strategy: ['EQUAL', Validators.required]
  });

  // ✅ Usar servicio con headers correctos
  this.householdService.getHouseholdByRepresentante(this.currentUser.id).subscribe(households => {
    const household = households[0];
    if (household) {
      this.householdId = household.id;

      forkJoin({
        hms: this.householdMemberService.getByHouseholdIdWithQuery(this.householdId),
        users: this.authService.getAllUsers(),
        bills: this.billService.getBillsByHousehold(this.householdId),
        contributions: this.contributionsService.getContributionsByHouseholdId(this.householdId),
        memberContributions: this.memberContributionService.getAll()
      }).subscribe(({ hms, users, bills, contributions, memberContributions }) => {
        this.bills = bills;
        const representative = users.find(u => u.id == this.currentUser.id);

        this.members = [
          ...hms.map(hm => ({
            ...hm,
            user: users.find(u => u.id == hm.userId)
          })),
          ...(representative ? [{
            userId: representative.id,
            householdId: this.householdId,
            user: representative
          }] : [])
        ];

        this.contributions = contributions.map(c => {
          const details = memberContributions
            .filter((mc: any) => mc.contribution_id == c.id)
            .map((mc: any) => ({
              ...mc,
              user: users.find(u => u.id == mc.member_id)
            }));

          const hasRep = representative ? details.some((d: any) => d.user?.id == representative.id) : false;

          if (representative && !hasRep) {
            const monto = this.calculateMontoFaltante(c, details, representative);
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
            details,
            expanded: false
          };
        });

        this.loading = false;
      });
    }
  });
}

  openForm() {
    this.contributionForm.reset({
      billId: null,
      description: '',
      fechaLimite: null,
      strategy: 'EQUAL'
    });
    this.showForm = true;
  }

  submit() {
    if (this.contributionForm.invalid) {
      return;
    }

    const formValue = this.contributionForm.value;
    const fechaLimite = new Date(formValue.fechaLimite);
    const formattedDate = fechaLimite.toISOString().split('T')[0];

    const createRequest: CreateContributionRequest = {
      billId: +formValue.billId,
      householdId: this.householdId,
      description: formValue.description,
      strategy: formValue.strategy,
      fechaLimite: formattedDate
    };

    const bill = this.bills.find(b => +b.id === createRequest.billId);

    if (!bill) {
      alert('Error: no se encontró la cuenta seleccionada.');
      return;
    }

    const total = bill.monto;

    // Usar el service para crear la contribución
    this.contributionsService.createContribution(createRequest).subscribe((savedContribution: Contribution) => {
      const memberContributions = this.calculateDivision(total, createRequest.strategy, savedContribution.id);

      const requests = memberContributions.map(mc =>
        this.http.post(`${environment.urlBackend}/member_contributions`, mc)
      );

      forkJoin(requests).subscribe(() => {
        this.ngOnInit();
        this.showForm = false;
      });
    });
  }

  calculateDivision(total: number, strategy: string, contribution_id: number) {
    if (strategy === 'EQUAL') {
      const amount = +(total / this.members.length).toFixed(2);
      return this.members.map(m => ({
        contribution_id,
        member_id: m.userId,
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
          member_id: m.userId,
          monto,
          status: 'PENDIENTE',
          pagado_en: null
        };
      });
    }
  }

  calculateMontoFaltante(c: any, existingDetails: any[], rep: any) {
    const bill = this.bills.find(b => b.id == c.billId);
    if (!bill) return 0;

    const total = bill.monto;
    const strategy = c.strategy;

    if (strategy === 'EQUAL') {
      const n = this.members.length;
      return +(total / n).toFixed(2);
    } else {
      const totalIncome = this.members.reduce((sum, m) => sum + m.user.income, 0);
      const porcentaje = rep.income / totalIncome;
      return +(total * porcentaje).toFixed(2);
    }
  }

  getBillDescription(billId: number): string {
    const bill = this.bills.find(b => +b.id === +billId);
    return bill ? bill.descripcion : 'Cuenta no encontrada';
  }
}
