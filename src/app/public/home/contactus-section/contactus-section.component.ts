import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contactus-section',
  standalone: true,
  imports: [
    RouterModule,
    TranslateModule,
    FormsModule
  ],
  templateUrl: './contactus-section.component.html',
  styleUrls: ['./contactus-section.component.css']
})
export class ContactusSectionComponent {
  nombre: string = '';
  correo: string = '';
  numero: string = '';

  constructor() { }
  enviarFormulario() {
    alert(`¡Gracias por contactarnos, ${this.nombre}!\nTe responderemos a tu correo: ${this.correo}.`);
  }
}
