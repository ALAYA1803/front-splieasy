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
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formValue = this.registerForm.value;

    const payload: SignUpRequest = {
      username: formValue.username,
      email: formValue.email,
      password: formValue.password,
      income: formValue.income,
      roles: [formValue.role] // Importante: backend espera un array
    };

    this.authService.signUp(payload).subscribe({
      next: () => {
        console.log('Registro exitoso');
        this.router.navigate(['/autenticacion/login']); // Redirige al login
      },
      error: (err) => {
        console.error('Error en registro:', err);
        // Aquí puedes mostrar un mensaje de error si quieres
      }
    });
  }
}
