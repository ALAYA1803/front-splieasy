import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  private readonly API_URL = environment.urlBackend;

  // ✅ Headers de autorización
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

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
    this.initializeForm();
    this.loadData();
  }

  private initializeForm(): void {
    this.contributionForm = this.fb.group({
      billId: [null, Validators.required],
      description: ['', Validators.required],
      fechaLimite: [null, Validators.required],
      strategy: ['EQUAL', Validators.required],
      miembros: [[], Validators.required]
    });
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

        // Verificar estructura de bills
        if (bills.length > 0) {
          console.log('🧾 Estructura de bill:', bills[0]);
          console.log('🧾 Propiedades disponibles en bills:', Object.keys(bills[0]));
        }

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

        console.log('🏠 Estructura de memberContributions:');
        if (memberContributions.length > 0) {
          console.log('Primer elemento:', memberContributions[0]);
          console.log('Propiedades disponibles:', Object.keys(memberContributions[0]));
        }

        this.contributions = contributions
          .filter(c => {
            // ✅ CORREGIDO: Verificar que la contribución pertenezca al hogar actual
            const belongsToCurrentHousehold = c.householdId === this.householdId;
            const hasBill = this.bills.some(b => b.id === c.billId);

            if (!belongsToCurrentHousehold) {
              console.warn(`⚠️ Contribución ${c.id} no pertenece al hogar actual (householdId: ${c.householdId} vs ${this.householdId})`);
              return false;
            }

            if (!hasBill) {
              console.warn(`⚠️ Contribución ${c.id} no tiene factura asociada (billId: ${c.billId})`);
              return false;
            }

            return true;
          })
          .map(c => {
            const bill = this.bills.find(b => b.id === c.billId);

            // ✅ CORREGIDO: Filtrar solo las contribuciones de miembros del hogar actual
            const details = memberContributions
              .filter((mc: any) => {
                const belongsToContribution = mc.contributionId === c.id;
                const memberBelongsToHousehold = this.members.some(m => m.userId === mc.memberId);

                if (belongsToContribution && !memberBelongsToHousehold) {
                  console.warn(`⚠️ MemberContribution ${mc.id} tiene un miembro que no pertenece al hogar actual (memberId: ${mc.memberId})`);
                }

                return belongsToContribution && memberBelongsToHousehold;
              })
              .map((mc: any) => {
                return {
                  ...mc,
                  memberId: mc.memberId,
                  monto: mc.monto,
                  status: mc.status,
                  pagado_en: mc.pagadoEn,
                  user: this.members.find(m => m.userId === mc.memberId)?.user
                };
              });

            const sumaRealDeDetalles = details.reduce((sum, detail) => {
              const monto = detail.monto || 0;
              console.log(`💰 Sumando monto ${monto} del miembro ${detail.memberId}`);
              return sum + monto;
            }, 0);

            return {
              ...c,
              montoTotal: sumaRealDeDetalles,
              details,
              expanded: false
            };
          });

        console.log('📄 Contribuciones finales procesadas:');
        this.contributions.forEach(c => {
          console.log(`Contribución ${c.id}: ${c.details.length} detalles y monto total: ${c.montoTotal}`);
        });

        console.log('✅ Contribuciones cargadas:', this.contributions);
        this.loading = false;
      });
    });
  }

  onDeleteContribution(contribution: any): void {
    const confirmMsg = '¿Seguro que deseas eliminar la contribución "' + contribution.description + '"?';
    if (!window.confirm(confirmMsg)) {
      return;
    }

    this.loading = true;

    this.http.delete(`${this.API_URL}/contributions/${contribution.id}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => {
        console.log('✅ Contribución eliminada exitosamente');
        this.contributions = this.contributions.filter(c => c.id !== contribution.id);
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error eliminando contribución:', error);
        alert('Error al eliminar la contribución: ' + (error.error?.message || 'Error desconocido'));
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

    console.log('🔄 Valores del formulario:', formValue);
    console.log('🏠 householdId actual:', this.householdId);
    console.log('📤 Request final:', createRequest);

    if (createRequest.billId === 0 || createRequest.householdId === 0) {
      console.error('❌ Error: billId o householdId son 0 después de la conversión');
      console.error('billId original:', formValue.billId);
      console.error('householdId original:', this.householdId);
      this.loading = false;
      return;
    }

    this.http.post<Contribution>(`${this.API_URL}/contributions`, createRequest, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (savedContribution: Contribution) => {
        console.log('✅ Contribución creada exitosamente:', savedContribution);

        const selectedMembers = this.members.filter(m =>
          formValue.miembros.includes(m.userId)
        );

        console.log('👥 Miembros seleccionados en el formulario:', formValue.miembros);
        console.log('👥 Miembros disponibles:', this.members);
        console.log('👥 Miembros filtrados:', selectedMembers);

        if (selectedMembers.length === 0) {
          console.error('❌ No se seleccionaron miembros');
          console.error('❌ formValue.miembros:', formValue.miembros);
          console.error('❌ this.members:', this.members);
          this.loading = false;
          return;
        }

        const bill = this.bills.find(b => b.id === formValue.billId);
        console.log('🧾 Bill encontrada completa:', bill);
        console.log('🧾 Propiedades de la bill:', Object.keys(bill || {}));

        // Verificar todas las posibles propiedades de monto
        let montoTotal = 0;
        if (bill) {
          montoTotal = bill.monto || bill.amount || bill.total || bill.valor || bill.price || 0;
          console.log('💰 Monto original de la bill:', montoTotal);

          // VERIFICAR: Si el monto viene duplicado por alguna razón, puedes dividirlo:
          // montoTotal = montoTotal / 2; // Descomenta solo si confirmas que viene duplicado
        }

        if (montoTotal <= 0) {
          console.error('❌ El monto de la factura debe ser mayor a 0');
          console.error('🧾 Estructura completa de la bill:', bill);
          this.loading = false;
          return;
        }

        const memberContributions = this.calculateDivisionForSelected(
          montoTotal,
          formValue.strategy,
          savedContribution.id,
          selectedMembers
        );

        console.log('📋 Enviando contribuciones de miembros:', memberContributions);

        // ✅ VERIFICAR: Si el servicio necesita headers de autorización
        const requests = memberContributions.map(mc => {
          console.log('🔍 Enviando MemberContribution individual:', mc);
          return this.memberContributionService.create(mc);
        });

        if (requests.length === 0) {
          console.error('❌ No se generaron requests para MemberContributions');
          this.loading = false;
          return;
        }

        forkJoin(requests).subscribe({
          next: (results) => {
            console.log('✅ Contribuciones de miembros creadas:', results);
            console.log('✅ Cantidad de contribuciones creadas:', results.length);
            this.loadData();
            this.mostrarDialogo = false;
            this.loading = false;
          },
          error: (error) => {
            console.error('❌ Error al crear contribuciones de miembros:', error);
            console.error('❌ Error completo:', error);
            alert('Error al crear las contribuciones de miembros: ' + (error.error?.message || error.message || 'Error desconocido'));
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('❌ Error al crear contribución:', error);
        console.error('Status:', error.status);
        console.error('Error body:', error.error);

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

        alert('Error al crear la contribución: ' + errorMessage);
        this.loading = false;
      }
    });
  }

  private calculateDivisionForSelected(
    montoTotal: number,
    strategy: string,
    contributionId: number,
    selectedMembers: any[]
  ): any[] {
    const memberContributions: any[] = [];

    console.log('🧮 Calculando división:');
    console.log('💰 Monto total:', montoTotal);
    console.log('📊 Estrategia:', strategy);
    console.log('🆔 Contribution ID:', contributionId);
    console.log('👥 Miembros seleccionados:', selectedMembers);
    console.log('🔢 Cantidad de miembros seleccionados:', selectedMembers.length);

    // Verificar que selectedMembers no esté vacío
    if (selectedMembers.length === 0) {
      console.error('❌ No hay miembros seleccionados para calcular la división');
      return [];
    }

    if (strategy === 'EQUAL') {
      const montoPorMiembro = montoTotal / selectedMembers.length;
      console.log('💰 Monto por miembro (división igualitaria):', montoPorMiembro);
      console.log('🔢 Dividiendo entre:', selectedMembers.length, 'miembros');

      selectedMembers.forEach((member, index) => {
        const memberContribution = {
          contributionId: contributionId,
          memberId: member.userId,
          monto: Math.round(montoPorMiembro * 100) / 100,
          status: 'PENDIENTE',
          pagadoEn: null
        };
        console.log(`👤 ${index + 1}. Creando MemberContribution para miembro ${member.userId} (${member.user?.username}):`, memberContribution);
        memberContributions.push(memberContribution);
      });
    } else if (strategy === 'INCOME_BASED') {
      const totalIngresos = selectedMembers.reduce((sum, member) => {
        const ingresos = member.user?.ingresos || 0;
        console.log(`💰 Ingresos del miembro ${member.userId} (${member.user?.username}): ${ingresos}`);
        return sum + ingresos;
      }, 0);

      console.log('💰 Total ingresos de miembros seleccionados:', totalIngresos);

      if (totalIngresos > 0) {
        selectedMembers.forEach((member, index) => {
          const ingresosMiembro = member.user?.ingresos || 0;
          const porcentaje = ingresosMiembro / totalIngresos;
          const montoMiembro = montoTotal * porcentaje;

          const memberContribution = {
            contributionId: contributionId,
            memberId: member.userId,
            monto: Math.round(montoMiembro * 100) / 100,
            status: 'PENDIENTE',
            pagadoEn: null
          };
          console.log(`👤 ${index + 1}. Creando MemberContribution (income-based) para miembro ${member.userId} (${member.user?.username}):`, memberContribution);
          console.log(`   📊 Ingresos: ${ingresosMiembro}, Porcentaje: ${(porcentaje * 100).toFixed(2)}%, Monto: ${montoMiembro}`);
          memberContributions.push(memberContribution);
        });
      } else {
        console.warn('⚠️ No hay ingresos registrados en los miembros seleccionados, usando división igualitaria');
        return this.calculateDivisionForSelected(montoTotal, 'EQUAL', contributionId, selectedMembers);
      }
    }

    // Verificación final
    const totalCalculado = memberContributions.reduce((sum, mc) => sum + mc.monto, 0);
    console.log('🔍 Verificación final:');
    console.log('💰 Monto total original:', montoTotal);
    console.log('💰 Monto total calculado:', totalCalculado);
    console.log('📋 Contribuciones generadas:', memberContributions.length);
    console.log('📋 MemberContributions completas:', memberContributions);

    return memberContributions;
  }

  get selectedBillMonto(): number {
    const billId = this.contributionForm.get('billId')?.value;
    const bill = this.bills.find(b => b.id === billId);

    if (bill) {
      console.log('🧾 Bill seleccionada en el getter:', bill);
      const monto = bill?.monto || bill?.amount || bill?.total || bill?.valor || bill?.price || 0;
      console.log('💰 Monto extraído en el getter:', monto);
      return monto;
    }

    return 0;
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

  reloadData(): void {
    this.loading = true;
    this.loadData();
  }
}
