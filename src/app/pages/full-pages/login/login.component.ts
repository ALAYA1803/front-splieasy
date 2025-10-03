import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarService } from '../../../core/services/sidebar.service';
import { AuthService } from '../../../core/services/auth.service';
import { SignInRequest, User } from '../../../core/interfaces/auth';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  captchaToken: string = '';

  constructor(
    private authService: AuthService,
    private sidebarService: SidebarService,
    private router: Router
  ) {}

  onCaptchaResolved(token: string | null) {
      if (token) {
        this.captchaToken = token;  // Asigna el token solo si no es null
      } else {
        this.captchaToken = '';  // Si es null, vacía el token
      }
    }

  onLogin() {
    if (!this.captchaToken) {
      this.error = 'Por favor, verifica que no eres un robot.';
      return;
    }

    const payload: SignInRequest = {
      username: this.username,
      password: this.password,
      captchaToken: this.captchaToken
    };

   // Log para ver los datos antes de enviarlos
    console.log('Datos de inicio de sesión enviados al backend:', payload);

    this.authService.signIn(payload).subscribe({
      next: () => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          this.error = 'ID de usuario no encontrado.';
          return;
        }

        this.authService.getUserById(Number(userId)).subscribe({
          next: (user: User) => {
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.sidebarService.generateMenu();
            const userRole = user.roles[0];
            if (userRole === 'ROLE_REPRESENTANTE') {
              this.router.navigate(['/representante']);
            } else if (userRole === 'ROLE_MIEMBRO') {
              this.router.navigate(['/miembro']);
            } else {
              this.router.navigate(['/']);
            }
          },
          error: (err) => {
            this.error = 'No se pudo obtener información del usuario.';
            console.error(err);
          }
        });
      },
      error: (err) => {
        this.error = 'Credenciales inválidas.';
        console.error(err);
      }
    });
  }
}
