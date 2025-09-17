import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../core/environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  private readonly API_URL = environment.urlBackend;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  verifyEmailAndNavigate(): void {
    if (this.forgotPasswordForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const email = this.forgotPasswordForm.value.email;

    this.http.post<{ message: string; resetToken?: string }>(
      `${this.API_URL}/authentication/forgot-password`,
      { email }
    ).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.successMessage = res.message || 'Si el email existe, enviaremos instrucciones.';
        if (res.resetToken) {
          this.router.navigate(['/autenticacion/reset-password'], {
            queryParams: { token: res.resetToken },
          });
        } else {
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = 'Ocurrió un error. Por favor, intenta de nuevo.';
        console.error('Error al solicitar reset:', err);
      },
    });
  }
}
