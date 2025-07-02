import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-the-footer',
  standalone: false,
  templateUrl: './the-footer.component.html',
  styleUrl: './the-footer.component.css'
})
export class TheFooterComponent {
  public currentYear: number = new Date().getFullYear();

  constructor() { }
}
