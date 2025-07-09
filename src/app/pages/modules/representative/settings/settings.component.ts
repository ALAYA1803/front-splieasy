import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { environment } from '../../../../core/environments/environment';
interface Setting {
  id: number;
  userId: number;
  language: string;
  darkMode: boolean;
  notificationsEnabled: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TranslateModule, CardModule, ButtonModule,
    DropdownModule, InputSwitchModule, InputTextModule, PasswordModule,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, OnDestroy {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  settingsForm!: FormGroup;

  userId!: number;
  settingId: number | null = null;

  private destroy$ = new Subject<void>();
  private readonly API_URL = environment.urlBackend;

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  ngOnInit(): void {
    const userString = localStorage.getItem('currentUser');
    if (userString) {
      this.userId = JSON.parse(userString).id;
    } else {
      console.error("No se pudo encontrar el usuario en localStorage.");
      return;
    }

    this.profileForm = this.fb.group({
      name: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
    });
    this.passwordForm = this.fb.group({
      currentPassword: [{ value: '', disabled: true }],
      newPassword: [{ value: '', disabled: true }],
      confirmPassword: [{ value: '', disabled: true }]
    });

    this.settingsForm = this.fb.group({
      language: ['es'],
      darkMode: [false],
      notificationsEnabled: [true]
    });

    this.loadSettingsData();
  }

  loadSettingsData(): void {
    this.http.get<Setting[]>(`${this.API_URL}/settings`, { headers: this.getAuthHeaders() })
      .pipe(takeUntil(this.destroy$))
      .subscribe(allSettings => {
        // Filtramos en el frontend porque la API no lo hace
        const userSetting = allSettings.find(s => s.userId === this.userId);
        if (userSetting) {
          this.settingId = userSetting.id;
          this.settingsForm.patchValue({
            language: userSetting.language,
            darkMode: userSetting.darkMode,
            notificationsEnabled: userSetting.notificationsEnabled,
          });
        }
      });
  }

  saveSettings(): void {
    if (this.settingsForm.invalid) return;

    const settingsPayload = {
      ...this.settingsForm.value,
      userId: this.userId
    };

    let request;
    if (this.settingId) {
      request = this.http.put(`${this.API_URL}/settings/${this.settingId}`, settingsPayload, { headers: this.getAuthHeaders() });
    } else {
      request = this.http.post(`${this.API_URL}/settings`, settingsPayload, { headers: this.getAuthHeaders() });
    }

    request.pipe(takeUntil(this.destroy$)).subscribe(() => {
      alert('Configuración guardada con éxito');
      this.loadSettingsData();
    });
  }

  saveProfile(): void {
    alert('Esta función no está disponible actualmente.');
  }

  changePassword(): void {
    alert('Esta función no está disponible actualmente.');
  }

  deleteAccount(): void {
    alert('Esta función no está disponible actualmente.');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
