import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarService } from '../../../core/services/sidebar.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(
    private authService: AuthService,
    private sidebarService: SidebarService,
    private router: Router
  ) { }

  onLogin() {
    this.authService.login(this.email, this.password).subscribe({
      next: user => {
        this.sidebarService.generateMenu();

        if (user.role === 'REPRESENTANTE') {
          this.router.navigate(['/representante']);
        } else if (user.role === 'MIEMBRO') {
          this.router.navigate(['/miembro']);
        }
      },
      error: err => {
        this.error = 'Usuario o contraseña incorrectos';
      }
    });
  }
}
