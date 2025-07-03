import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgFor } from '@angular/common';

interface ServiceFeature {
  iconClass: string;
  titleKey: string;
  descriptionKey: string;
}

@Component({
  selector: 'app-service-section',
  standalone: false,
  templateUrl: './service-section.component.html',
  styleUrls: ['./service-section.component.css']
})
export class ServiceSectionComponent {
  features: ServiceFeature[] = [
    {
      iconClass: 'bi bi-calculator-fill',
      titleKey: 'SERVICES.SERVICE1.TITLE',
      descriptionKey: 'SERVICES.SERVICE1.DESCRIPTION'
    },
    {
      iconClass: 'bi bi-pie-chart-fill',
      titleKey: 'SERVICES.SERVICE2.TITLE',
      descriptionKey: 'SERVICES.SERVICE2.DESCRIPTION'
    },
    {
      iconClass: 'bi bi-people-fill',
      titleKey: 'SERVICES.SERVICE3.TITLE',
      descriptionKey: 'SERVICES.SERVICE3.DESCRIPTION'
    },
    {
      iconClass: 'bi bi-display-fill',
      titleKey: 'SERVICES.SERVICE4.TITLE',
      descriptionKey: 'SERVICES.SERVICE4.DESCRIPTION'
    }
  ];

  constructor() { }
}
