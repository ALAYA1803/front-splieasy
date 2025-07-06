import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  userId: string | null = null;
  isSubmitting = false;
  message = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    const navigation = this.router.getCurrentNavigation();
    this.userId = navigation?.extras?.state?.['userId'];
  }

  ngOnInit(): void {
    if (!this.userId) {
      this.router.navigate(['/autenticacion/login']);
      return;
    }

    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      repeatPassword: ['', Validators.required],
    }, {
      validator: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const repeatPassword = form.get('repeatPassword')?.value;
    return password === repeatPassword ? null : { mismatch: true };
  }

  updatePassword(): void {
    if (this.resetPasswordForm.invalid) {
      return;
    }
    this.isSubmitting = true;
    this.message = '';
    const newPassword = this.resetPasswordForm.value.password;
    this.http.patch(`http://localhost:3000/users/${this.userId}`, { password: newPassword }).subscribe({
      next: () => {
        alert('Contraseña actualizada con éxito. Ahora puedes iniciar sesión.');
        this.router.navigate(['/autenticacion/login']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.message = 'Ocurrió un error al actualizar la contraseña. Intenta de nuevo.';
        console.error('Error al actualizar la contraseña', err);
      }
    });
  }
}
