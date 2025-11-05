import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../core/environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetPasswordForm!: FormGroup;
  isSubmitting = false;
  message = '';
  private token: string | null = null;
  private readonly API_URL = environment.urlBackend;
  private subs: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.router.navigate(['/autenticacion/forgot-password']);
      return;
    }

    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
      repeatPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });

    // Suscribirse a cambios del password para actualizar la UI en vivo
    this.subs.add(
      this.resetPasswordForm.get('password')!.valueChanges.subscribe(() => {
        // Forzar re-evaluación del validador de confirmación
        this.resetPasswordForm.get('repeatPassword')?.updateValueAndValidity({ onlySelf: true });
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private passwordMatchValidator = (form: FormGroup) => {
    const p1 = form.get('password')?.value;
    const p2 = form.get('repeatPassword')?.value;
    return p1 === p2 ? null : { mismatch: true };
  };

  // Getters útiles para la plantilla (validación en vivo)
  get passwordControl() {
    return this.resetPasswordForm.get('password');
  }

  get repeatPasswordControl() {
    return this.resetPasswordForm.get('repeatPassword');
  }

  get isMinLength(): boolean {
    const val = this.passwordControl?.value;
    return !!val && val.length >= 8;
  }

  get passwordsMatch(): boolean {
    const p = this.passwordControl?.value;
    const r = this.repeatPasswordControl?.value;
    return !!p && !!r && p === r;
  }

  updatePassword(): void {
    if (this.resetPasswordForm.invalid || !this.token) return;

    this.isSubmitting = true;
    this.message = '';
    const newPassword = this.resetPasswordForm.value.password;

    this.http.post<{ message: string }>(
      `${this.API_URL}/authentication/reset-password`,
      { token: this.token, newPassword }
    ).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        alert(res?.message || 'Contraseña actualizada con éxito. Ahora puedes iniciar sesión.');
        this.router.navigate(['/autenticacion/login']);
      },
      error: (err) => {
        this.isSubmitting = false;
        const serverMsg = err?.error?.message || err?.error || 'Token inválido o expirado.';
        this.message = serverMsg;
        console.error('Error al actualizar la contraseña', err);
      }
    });
  }
}
