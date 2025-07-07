import { HttpClient } from '@angular/common/http';
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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin() {
    const payload: SignInRequest = {
      username: this.username,
      password: this.password
    };

    this.authService.signIn(payload).subscribe({
      next: () => {
        // ✅ Ya guardó token + id en localStorage dentro del service

        const userId = localStorage.getItem('userId');
        if (!userId) {
          this.error = 'ID de usuario no encontrado.';
          return;
        }

        this.authService.getUserById(Number(userId)).subscribe({
          next: (user: User) => {
            console.log('Usuario obtenido:', user);

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
