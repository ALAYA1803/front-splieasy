// login.component.ts
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarService } from '../../../core/services/sidebar.service';

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
    private http: HttpClient,
    private router: Router,
    private sidebarService: SidebarService
  ) {}

  login() {
    this.http.get<any[]>('http://localhost:3000/users').subscribe(users => {
      const user = users.find(u => u.email === this.email && u.password === this.password);

      if (user) {
        // Guardar usuario en localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));

        // ⚠️ Actualizar el sidebar con los ítems correctos
        this.sidebarService.generateMenu();

        // Redirigir según el rol
        if (user.role === 'REPRESENTANTE') {
          this.router.navigate(['/representante']);
        } else {
          this.router.navigate(['/miembro']);
        }
      } else {
        this.error = 'Email o contraseña incorrectos';
        this.password = ''; // limpiar campo contraseña
      }
    });
  }
}
