import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { switchMap, map, forkJoin, of, tap } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslateModule } from '@ngx-translate/core';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { environment } from '../../../../core/environments/environment';
import { HouseholdMemberService } from '../../services/household-member.service';
import { HouseholdMember } from '../../interfaces/household-member';
import { User } from '../../../../core/interfaces/auth';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ToastModule,
    ConfirmDialogModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    DialogModule,
    ProgressSpinnerModule,
    AvatarModule,
    TooltipModule
  ],
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.css'],
  providers: [ConfirmationService, MessageService]
})
export class MembersComponent implements OnInit {
  members: User[] = [];
  loading = true;
  isSaving = false;
  showAddMemberForm = false;

  addMemberForm: FormGroup;

  private householdId!: number;
  private householdMembersLinks: HouseholdMember[] = [];
  private readonly API_URL = environment.urlBackend;

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private householdMemberService: HouseholdMemberService
  ) {
    this.addMemberForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.loadMembers();
  }

  // MÉTODO CORREGIDO: loadMembers()
  loadMembers(): void {
    this.loading = true;
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);

    console.log('👤 Usuario actual:', currentUser);

    // PASO 1: Obtener el hogar del representante
    this.http.get<any[]>(`${this.API_URL}/households?representanteId=${currentUser.id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(households => {
        console.log('🏠 Hogares encontrados:', households);
        console.log('🔍 Buscando hogar para representante ID:', currentUser.id);
      }),
      switchMap(households => {
        if (!households || households.length === 0) {
          console.log('❌ No se encontraron hogares para el representante');
          return of([]);
        }

        // VERIFICAR que el hogar pertenezca al usuario actual
        const userHousehold = households.find(h => h.representanteId === currentUser.id);
        if (!userHousehold) {
          console.log('❌ No se encontró hogar donde el usuario sea representante');
          return of([]);
        }

        this.householdId = userHousehold.id;
        console.log('✅ Hogar correcto encontrado - ID:', this.householdId);
        console.log('✅ Hogar:', userHousehold);

        // PASO 2: Obtener miembros del hogar específico
        return this.householdMemberService.getByHouseholdId(this.householdId);
      }),
      tap(memberLinks => {
        console.log('🔗 Enlaces de miembros del hogar', this.householdId, ':', memberLinks);
        this.householdMembersLinks = memberLinks;
      }),
      switchMap(memberLinks => {
        if (memberLinks.length === 0) {
          console.log('ℹ️ No hay miembros en este hogar');
          return of([]);
        }

        // PASO 3: Obtener datos de usuarios
        const memberIds = memberLinks.map(link => link.userId);
        console.log('👥 IDs de miembros a obtener:', memberIds);

        const userRequests = memberIds.map(id =>
          this.http.get<User>(`${this.API_URL}/users/${id}`, {
            headers: this.getAuthHeaders()
          }).pipe(
            tap(user => console.log(`✅ Usuario ${id} obtenido:`, user))
          )
        );
        return forkJoin(userRequests);
      })
    ).subscribe({
      next: (membersData) => {
        console.log('🎉 Datos finales de miembros:', membersData);
        this.members = membersData;
        this.loading = false;
      },
      error: (err) => {
        console.error("❌ Error al cargar los miembros:", err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los miembros.'
        });
        this.loading = false;
      }
    });
  }

  deleteMember(memberToDelete: User): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que quieres eliminar a <strong>${memberToDelete.username}</strong> del hogar?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const linkToDelete = this.householdMembersLinks.find(link => link.userId === memberToDelete.id);
        if (!linkToDelete) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo encontrar la relación del miembro.'
          });
          return;
        }

        this.householdMemberService.deleteMemberLink(linkToDelete.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: `Se ha eliminado a ${memberToDelete.username}.`
            });
            this.loadMembers();
          },
          error: (err) => {
            console.error("Error al eliminar miembro:", err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo completar la eliminación.'
            });
          }
        });
      }
    });
  }

  openAddMemberDialog(): void {
    this.addMemberForm.reset();
    this.showAddMemberForm = true;
  }

  addMember(): void {
    if (this.addMemberForm.invalid) {
      return;
    }

    this.isSaving = true;
    const { email } = this.addMemberForm.value;

    this.http.get<User[]>(`${this.API_URL}/users?email=${email}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (users) => {
        const userToAdd = users.find(user =>
          user.email.toLowerCase().trim() === email.toLowerCase().trim()
        );

        if (!userToAdd) {
          this.messageService.add({
            severity: 'warn',
            summary: 'No encontrado',
            detail: 'No se encontró ningún usuario con ese email exacto.'
          });
          this.isSaving = false;
          return;
        }

        if (this.members.some(m => m.id === userToAdd.id)) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Miembro existente',
            detail: 'Este usuario ya forma parte del hogar.'
          });
          this.isSaving = false;
          return;
        }

        const newHouseholdMemberData = {
          userId: userToAdd.id,
          householdId: this.householdId
        };

        console.log('📤 Enviando datos al backend:', newHouseholdMemberData);

        this.householdMemberService.createMemberLink(newHouseholdMemberData).subscribe({
          next: (response) => {
            console.log('✅ Respuesta del backend:', response);
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: `${userToAdd.username} ha sido añadido al hogar.`
            });
            this.loadMembers();
            this.showAddMemberForm = false;
            this.isSaving = false;
          },
          error: (err) => {
            console.error("❌ Error al añadir miembro:", err);
            console.error("❌ Detalles del error:", err.error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo añadir al miembro.'
            });
            this.isSaving = false;
          }
        });
      },
      error: (err) => {
        console.error("Error al buscar usuario:", err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ocurrió un error al buscar el usuario.'
        });
        this.isSaving = false;
      }
    });
  }
}
