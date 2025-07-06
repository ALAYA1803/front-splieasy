import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

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
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    const email = this.forgotPasswordForm.value.email;
    this.http.get<any[]>(`http://localhost:3000/users?email=${email}`).subscribe({
      next: (users) => {
        this.isSubmitting = false;
        if (users.length > 0) {
          const user = users[0];
          this.router.navigate(['/autenticacion/reset-password'], { state: { userId: user.id } });
        } else {
          this.errorMessage = 'No se encontró ninguna cuenta con ese correo electrónico.';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = 'Ocurrió un error. Por favor, intenta de nuevo.';
        console.error('Error al verificar el correo', err);
      },
    });
  }
}
