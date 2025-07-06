import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { switchMap, map, forkJoin, of } from 'rxjs';
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

interface User {
  id: number;
  name: string;
  email: string;
  role: 'REPRESENTANTE' | 'MIEMBRO';
  income: number;
}

interface HouseholdMember {
  id: number;
  user_id: number;
  household_id: number;
}

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
  private readonly API_URL = 'http://localhost:3000';

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.addMemberForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading = true;
    const currentUser = JSON.parse(localStorage.getItem('currentUser')!);

    this.http.get<any[]>(`${this.API_URL}/households?representante_id=${currentUser.id}`).pipe(
      switchMap(households => {
        if (!households || households.length === 0) return of([]);
        this.householdId = households[0].id;
        return this.http.get<HouseholdMember[]>(`${this.API_URL}/household_members?household_id=${this.householdId}`);
      }),
      switchMap(memberLinks => {
        this.householdMembersLinks = memberLinks;
        if (memberLinks.length === 0) return of([]);
        const memberIds = memberLinks.map(link => link.user_id);
        const userRequests = memberIds.map(id => this.http.get<User>(`${this.API_URL}/users/${id}`));
        return forkJoin(userRequests);
      })
    ).subscribe({
      next: (membersData) => {
        this.members = membersData;
        this.loading = false;
      },
      error: (err) => {
        console.error("Error al cargar los miembros", err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los miembros.' });
        this.loading = false;
      }
    });
  }

  deleteMember(memberToDelete: User): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que quieres eliminar a <strong>${memberToDelete.name}</strong> del hogar?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const linkToDelete = this.householdMembersLinks.find(link => link.user_id === memberToDelete.id);
        if (!linkToDelete) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo encontrar la relación del miembro.' });
          return;
        }
        this.http.delete(`${this.API_URL}/household_members/${linkToDelete.id}`).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Se ha eliminado a ${memberToDelete.name}.` });
            this.loadMembers();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo completar la eliminación.' });
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

    this.http.get<User[]>(`${this.API_URL}/users?email=${email}`).subscribe({
      next: (users) => {
        if (users.length === 0) {
          this.messageService.add({ severity: 'warn', summary: 'No encontrado', detail: 'No se encontró ningún usuario con ese email.' });
          this.isSaving = false;
          return;
        }

        const userToAdd = users[0];

        if (this.members.some(m => m.id === userToAdd.id)) {
          this.messageService.add({ severity: 'warn', summary: 'Miembro existente', detail: 'Este usuario ya forma parte del hogar.' });
          this.isSaving = false;
          return;
        }

        const newLink = {
          user_id: userToAdd.id,
          household_id: this.householdId
        };
        this.http.post(`${this.API_URL}/household_members`, newLink).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `${userToAdd.name} ha sido añadido al hogar.` });
            this.loadMembers();
            this.showAddMemberForm = false;
            this.isSaving = false;
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo añadir al miembro.' });
            this.isSaving = false;
          }
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al buscar el usuario.' });
        this.isSaving = false;
      }
    });
  }
}
