import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SignUpRequest } from '../../../core/interfaces/auth';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {

  registerForm: FormGroup;
  isSubmitting = false;
  captchaToken: string = '';  // Token de reCAPTCHA
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      repeatPassword: ['', Validators.required],
      income: [0, [Validators.required, Validators.min(0)]],
      role: ['', Validators.required]
    }, { validators: [this.passwordMatchValidator()] });
  }

  /**
   * Validación para verificar que password y repeatPassword coincidan
   */
  private passwordMatchValidator() {
    return (formGroup: FormGroup) => {
      const password = formGroup.get('password')?.value;
      const repeatPassword = formGroup.get('repeatPassword')?.value;

      return password === repeatPassword ? null : { mismatch: true };
    };
  }

  /**
   * Acción de registro
   */
  register() {
    if (this.registerForm.invalid || this.isSubmitting|| !this.captchaToken) {
      if (this.registerForm.invalid) {
        this.registerForm.markAllAsTouched();
      }
    if (!this.captchaToken) {
      this.error = 'Por favor, verifica que no eres un robot.';
    }
      return;
    }

    this.isSubmitting = true;

    const formValue = this.registerForm.value;

    const payload: SignUpRequest = {
      username: formValue.username,
      email: formValue.email,
      password: formValue.password,
      income: formValue.income,
      roles: [formValue.role],
      captchaToken: this.captchaToken // Incluir el token del reCAPTCHA
    };

    console.log('Enviando payload:', payload);

    this.authService.signUp(payload).subscribe({
      next: (response) => {
        console.log('Registro exitoso:', response);
        this.isSubmitting = false;
        this.router.navigate(['/autenticacion/login']);
      },
      error: (err) => {
        console.error('Error en registro:', err);
        this.isSubmitting = false;
      }
    });
  }
/**
   * Captura el token de reCAPTCHA
   */
  onCaptchaResolved(token: string | null) {
    if (token) {
      this.captchaToken = token;  // Asigna el token si no es null
    } else {
      this.captchaToken = '';  // Si es null, vacía el token
    }
  }
}
