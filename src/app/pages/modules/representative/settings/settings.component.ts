import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    CardModule,
    ButtonModule,
    DropdownModule,
    InputSwitchModule,
    InputTextModule,
    PasswordModule,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, OnDestroy {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  settingsForm!: FormGroup;
  userId!: any;
  settingId!: any;
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.passwordMatchValidator
    });

    this.settingsForm = this.fb.group({
      language: ['es'],
      dark_mode: [false],
      notifications_enabled: [true]
    });

    const user = JSON.parse(localStorage.getItem('currentUser')!);
    if (user && user.id) {
      this.userId = user.id;
      this.loadUserData();
      this.loadSettingsData();
    } else {
      console.error("No se pudo encontrar el usuario o su ID en localStorage.");
    }
  }
  passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }
  loadUserData(): void {
    this.http.get<any>(`https://backend-app-1-vd66.onrender.com/api/v1/users/${this.userId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(userData => this.profileForm.patchValue(userData));
  }

  loadSettingsData(): void {
    this.http.get<any[]>(`https://backend-app-1-vd66.onrender.com/api/v1/settings?user_id=${this.userId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        const existingSetting = settings[0];
        if (existingSetting) {
          this.settingId = existingSetting.id;
          this.settingsForm.patchValue(existingSetting);
        }
      });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.http.patch(`https://backend-app-1-vd66.onrender.com/api/v1/users/${this.userId}`, this.profileForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => alert('Perfil actualizado con éxito'));
  }

  saveSettings(): void {
    if (this.settingsForm.invalid) return;
    const settingsPayload = { ...this.settingsForm.value, user_id: this.userId };
    const request = this.settingId
      ? this.http.patch(`https://backend-app-1-vd66.onrender.com/api/v1/settings/${this.settingId}`, settingsPayload)
      : this.http.post(`https://backend-app-1-vd66.onrender.com/api/v1/settings`, settingsPayload);
    request.pipe(takeUntil(this.destroy$)).subscribe(() => alert('Configuración guardada'));
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.http.get<any>(`https://backend-app-1-vd66.onrender.com/api/v1/users/${this.userId}`)
      .subscribe(user => {
        if (user && user.password === currentPassword) {
          this.http.patch(`https://backend-app-1-vd66.onrender.com/api/v1/users/${this.userId}`, { password: newPassword })
            .subscribe(() => {
              alert('Contraseña actualizada con éxito');
              this.passwordForm.reset();
            });

        } else {
          alert('Error: La contraseña actual es incorrecta.');
        }
      });
  }

  deleteAccount(): void {
    const confirmation = prompt('Esta acción es irreversible. Para confirmar, escribe tu correo electrónico:');
    if (confirmation && confirmation.toLowerCase() === this.profileForm.value.email.toLowerCase()) {
      this.http.delete(`https://backend-app-1-vd66.onrender.com/api/v1/users/${this.userId}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => alert('Cuenta eliminada.'));
    } else {
      alert('La confirmación ha fallado. La cuenta no ha sido eliminada.');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
