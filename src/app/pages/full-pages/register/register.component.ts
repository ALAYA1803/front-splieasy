import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      repeatPassword: ['', Validators.required]
    }, {
      validator: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const repeatPassword = form.get('repeatPassword')?.value;
    return password === repeatPassword ? null : { mismatch: true };
  }

  register(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formValue = this.registerForm.value;
    const userData = {
      name: `${formValue.firstName} ${formValue.lastName}`,
      email: formValue.email,
      password: formValue.password,
      role: formValue.role.toUpperCase(),
      income: 0
    };

    this.http.post('http://localhost:3000/users', userData).subscribe({
      next: (response) => {
        console.log('Usuario registrado con éxito:', response);
        alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
        this.router.navigate(['/autenticacion/login']);
      },
      error: (err) => {
        console.error('Error en el registro:', err);
        alert('Ocurrió un error durante el registro. Por favor, intenta de nuevo.');
      }
    });
  }
}
