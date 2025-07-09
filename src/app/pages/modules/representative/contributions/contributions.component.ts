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
  miembros: any[] = [];
  currentUser!: User;
  loading = true;
  showForm = false;
  mostrarDialogo = false;
  contributionForm!: FormGroup;
  estrategias = [
    { label: 'Igualitaria', value: 'EQUAL' },
    { label: 'Según Ingresos', value: 'INCOME_BASED' }
  ];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private contributionsService: ContributionsService,
    private householdService: HouseholdService,
    private householdMemberService: HouseholdMemberService,
    private authService: AuthService,
    private billService: BillsService,
    private memberContributionService: MemberContributionService
  ) { }

  ngOnInit(): void {
    this.contributionForm = this.fb.group({
      billId: [null, Validators.required],
      description: ['', Validators.required],
      fechaLimite: [null, Validators.required],
      strategy: ['EQUAL', Validators.required],
      miembros: [[], Validators.required]
    });

    this.loadData();
  }

  private loadData(): void {
    const currentUserData = localStorage.getItem('currentUser');
    if (!currentUserData) {
      console.error('No se encontró información del usuario actual');
      return;
    }

    this.currentUser = JSON.parse(currentUserData);
    this.loading = true;

    this.householdService.getHouseholdByRepresentante(this.currentUser.id).subscribe(households => {
      const household = households[0];
      if (!household) {
        console.error('No se encontró hogar del representante');
        this.loading = false;
        return;
      }

      this.householdId = household.id;

      forkJoin({
        hms: this.householdMemberService.getByHouseholdId(this.householdId),
        users: this.authService.getAllUsers(),
        bills: this.billService.getBillsByHousehold(this.householdId),
        contributions: this.contributionsService.getContributionsByHouseholdId(this.householdId),
        memberContributions: this.memberContributionService.getAll()
      }).subscribe(({ hms, users, bills, contributions, memberContributions }) => {
        this.bills = bills;
        console.log('📊 Datos recibidos:');
        console.log('Bills:', bills);
        console.log('Contributions:', contributions);
        console.log('MemberContributions:', memberContributions);

        const representative = users.find(u => u.id === this.currentUser.id);
        this.members = [
          ...hms.map(hm => ({
            ...hm,
            user: users.find(u => u.id === hm.userId)
          })),
          ...(representative ? [{
            userId: representative.id,
            householdId: this.householdId,
            user: representative
          }] : [])
        ];
        this.miembros = this.members.map(m => ({
          id: m.userId,
          name: m.user?.username || 'Sin nombre',
          role: m.user?.role || 'MIEMBRO'
        }));
        console.log(' Estructura de memberContributions:');
        if (memberContributions.length > 0) {
          console.log('Primer elemento:', memberContributions[0]);
          console.log('Propiedades disponibles:', Object.keys(memberContributions[0]));
        }

        this.contributions = contributions
          .filter(c => {
            const hasBill = this.bills.some(b => b.id === c.billId);
            if (!hasBill) {
              console.warn(` Contribución ${c.id} no tiene factura asociada (billId: ${c.billId})`);
            }
            return hasBill;
          })
          .map(c => {
            const bill = this.bills.find(b => b.id === c.billId);
            const details = memberContributions
              .filter((mc: any) => {
                const matchesId = mc.contributionId === c.id ||
                  mc.contribution_id === c.id ||
                  mc.contributionID === c.id;
                return matchesId;
              })
              .map((mc: any) => {
                const memberId = mc.memberId || mc.member_id || mc.memberID;
                return {
                  ...mc,
                  memberId: memberId,
                  user: users.find(u => u.id === memberId)
                };
              });
            const sumaRealDeDetalles = details.reduce((sum, detail) => sum + (detail.monto || 0), 0);
            console.log(` Detalles encontrados para contribución ${c.id}:`, details);
            return {
              ...c,
              montoTotal: sumaRealDeDetalles,
              details,
              expanded: false
            };
          });
        console.log(' Contribuciones finales procesadas:');
        this.contributions.forEach(c => {
          console.log(`Contribución ${c.id}: ${c.details.length} detalles y monto total: ${c.montoTotal}`);
        });

        console.log(' Contribuciones cargadas:', this.contributions);
        this.loading = false;
      });
    });
  }
  onDeleteContribution(contribution: any): void {
    const confirmMsg = '¿Seguro que deseas eliminar la contribución "'
      + contribution.description + '"?';
    if (!window.confirm(confirmMsg)) {
      return;
    }

    this.loading = true;
    this.contributionsService.deleteContribution(contribution.id)
      .subscribe({
        next: () => {
          this.contributions = this.contributions
            .filter(c => c.id !== contribution.id);
          this.loading = false;
        },
        error: err => {
          console.error('Error eliminando contribución:', err);
          this.loading = false;
        }
      });
  }

  abrirDialogo() {
    this.contributionForm.reset({
      billId: null,
      description: '',
      fechaLimite: null,
      strategy: 'EQUAL',
      miembros: []
    });
    this.mostrarDialogo = true;
  }

  cerrarDialogo() {
    this.mostrarDialogo = false;
  }

  guardarContribution() {
    if (this.contributionForm.invalid) {
      console.error('Formulario inválido:', this.contributionForm.errors);
      return;
    }

    this.loading = true;
    const formValue = this.contributionForm.value;

    if (!formValue.billId) {
      console.error('billId es requerido');
      this.loading = false;
      return;
    }

    if (!this.householdId) {
      console.error('householdId es requerido');
      this.loading = false;
      return;
    }

    let formattedDate: string;
    if (formValue.fechaLimite instanceof Date) {
      formattedDate = formValue.fechaLimite.toISOString().split('T')[0];
    } else if (typeof formValue.fechaLimite === 'string') {
      const dateObj = new Date(formValue.fechaLimite);
      formattedDate = dateObj.toISOString().split('T')[0];
    } else {
      console.error('Formato de fecha inválido:', formValue.fechaLimite);
      this.loading = false;
      return;
    }

    const createRequest: CreateContributionRequest = {
      billId: parseInt(formValue.billId.toString()),
      householdId: parseInt(this.householdId.toString()),
      description: formValue.description.trim(),
      strategy: formValue.strategy,
      fechaLimite: formattedDate
    };
    console.log(' Valores del formulario:', formValue);
    console.log(' householdId actual:', this.householdId);
    console.log(' Request final:', createRequest);
    if (createRequest.billId === 0 || createRequest.householdId === 0) {
      console.error(' Error: billId o householdId son 0 después de la conversión');
      console.error('billId original:', formValue.billId);
      console.error('householdId original:', this.householdId);
      this.loading = false;
      return;
    }

    this.contributionsService.createContribution(createRequest).subscribe({
      next: (savedContribution: Contribution) => {
        console.log(' Contribución creada exitosamente:', savedContribution);

        const selectedMembers = this.members.filter(m =>
          formValue.miembros.includes(m.userId)
        );

        if (selectedMembers.length === 0) {
          console.error(' No se seleccionaron miembros');
          this.loading = false;
          return;
        }

        const bill = this.bills.find(b => b.id === formValue.billId);
        const montoTotal = bill?.monto || 0;

        if (montoTotal <= 0) {
          console.error(' El monto de la factura debe ser mayor a 0');
          this.loading = false;
          return;
        }

        const memberContributions = this.calculateDivisionForSelected(
          montoTotal,
          formValue.strategy,
          savedContribution.id,
          selectedMembers
        );

        console.log(' Enviando contribuciones de miembros:', memberContributions);

        const requests = memberContributions.map(mc =>
          this.memberContributionService.create(mc)
        );

        forkJoin(requests).subscribe({
          next: (results) => {
            console.log(' Contribuciones de miembros creadas:', results);
            this.ngOnInit();
            this.mostrarDialogo = false;
            this.loading = false;
          },
          error: (error) => {
            console.error(' Error al crear contribuciones de miembros:', error);
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error(' Error al crear contribución:', error);
        console.error(' Status:', error.status);
        console.error(' Error body:', error.error);

        let errorMessage = 'Error desconocido al crear la contribución';
        if (error.status === 400) {
          errorMessage = 'Datos inválidos proporcionados';
        } else if (error.status === 401) {
          errorMessage = 'No autorizado para realizar esta acción';
        } else if (error.status === 404) {
          errorMessage = 'Recurso no encontrado';
        } else if (error.status === 500) {
          errorMessage = 'Error interno del servidor';
        }

        this.loading = false;
      }
    });
  }

  private calculateMontoFaltante(contribution: any, details: any[], representative: User): number {
    const bill = this.bills.find(b => b.id === contribution.billId);
    const montoTotal = bill?.monto || 0;
    const montoAsignado = details.reduce((sum, detail) => sum + (detail.monto || 0), 0);
    return montoTotal - montoAsignado;
  }

  private calculateDivisionForSelected(
    montoTotal: number,
    strategy: string,
    contributionId: number,
    selectedMembers: any[]
  ): any[] {
    const memberContributions: any[] = [];

    if (strategy === 'EQUAL') {
      const montoPorMiembro = montoTotal / selectedMembers.length;

      selectedMembers.forEach(member => {
        memberContributions.push({
          contribution_id: contributionId,
          member_id: member.userId,
          monto: Math.round(montoPorMiembro * 100) / 100,
          status: 'PENDIENTE',
          pagado_en: null
        });
      });
    } else if (strategy === 'INCOME_BASED') {
      const totalIngresos = selectedMembers.reduce((sum, member) => {
        return sum + (member.user?.ingresos || 0);
      }, 0);

      if (totalIngresos > 0) {
        selectedMembers.forEach(member => {
          const ingresosMiembro = member.user?.ingresos || 0;
          const porcentaje = ingresosMiembro / totalIngresos;
          const montoMiembro = montoTotal * porcentaje;

          memberContributions.push({
            contribution_id: contributionId,
            member_id: member.userId,
            monto: Math.round(montoMiembro * 100) / 100,
            status: 'PENDIENTE',
            pagado_en: null
          });
        });
      } else {
        console.warn('No hay ingresos registrados, usando división igualitaria');
        return this.calculateDivisionForSelected(montoTotal, 'EQUAL', contributionId, selectedMembers);
      }
    }

    return memberContributions;
  }

  get selectedBillMonto(): number {
    const billId = this.contributionForm.get('billId')?.value;
    return this.bills.find(b => b.id === billId)?.monto || 0;
  }


  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pagado':
        return 'p-tag-success';
      case 'pendiente':
        return 'p-tag-warning';
      case 'vencido':
        return 'p-tag-danger';
      default:
        return 'p-tag-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pagado':
        return 'Pagado';
      case 'pendiente':
        return 'Pendiente';
      case 'vencido':
        return 'Vencido';
      default:
        return status || 'Sin estado';
    }
  }

}
