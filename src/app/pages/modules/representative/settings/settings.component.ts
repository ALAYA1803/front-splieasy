import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
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

  private destroy$ = new Subject<void>();
  private readonly API_URL = environment.urlBackend;

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordsMatchValidator });

    this.settingsForm = this.fb.group({
      language: [{ value: 'es', disabled: true }],
      darkMode: [{ value: false, disabled: true }],
      notificationsEnabled: [{ value: true, disabled: true }]
    });

    this.loadMyProfile();
  }

  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const np = group.get('newPassword')?.value;
    const cp = group.get('confirmPassword')?.value;
    if (!np || !cp) return null;
    return np === cp ? null : { mismatch: true };
  }

  private loadMyProfile(): void {
    this.http.get<{ id: number; username: string; email: string }>(
      `${this.API_URL}/account/me`,
      { headers: this.getAuthHeaders() }
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: me => {
          this.profileForm.patchValue({
            name: me.username,
            email: me.email
          });
        },
        error: err => {
          console.error('No se pudo cargar el perfil:', err);
        }
      });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;

    const payload = {
      username: this.profileForm.value.name,
      email: this.profileForm.value.email
    };

    this.http.put(
      `${this.API_URL}/account/profile`,
      payload,
      { headers: this.getAuthHeaders(), responseType: 'text' as 'json' }
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Perfil actualizado correctamente.');
          this.loadMyProfile();
        },
        error: (err: any) => {
          const msg = typeof err?.error === 'string' ? err.error : 'No se pudo actualizar el perfil.';
          alert(msg);
        }
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      alert('Verifica que las contraseñas coincidan y cumplan los requisitos.');
      return;
    }
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.http.put(
      `${this.API_URL}/account/password`,
      { currentPassword, newPassword },
      { headers: this.getAuthHeaders(), responseType: 'text' as 'json' }
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Contraseña cambiada correctamente.');
          this.passwordForm.reset();
        },
        error: (err: any) => {
          const msg = typeof err?.error === 'string' ? err.error : 'No se pudo cambiar la contraseña.';
          alert(msg);
        }
      });
  }

  deleteAccount(): void {
    if (!confirm('¿Seguro que deseas eliminar tu cuenta? Esta acción es irreversible.')) return;

    this.http.delete(
      `${this.API_URL}/account`,
      { headers: this.getAuthHeaders(), responseType: 'text' as 'json' }
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Cuenta eliminada.');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('currentUser');
          window.location.href = '/autenticacion/login';
        },
        error: (err: any) => {
          const msg = typeof err?.error === 'string' ? err.error : 'No se pudo eliminar la cuenta.';
          alert(msg);
        }
      });
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
