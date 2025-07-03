import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

interface PricePlan {
  isRecommended: boolean;
  titleKey: string;
  monthlyPriceKey: string;
  yearlyPriceKey: string;
  periodKey: string;
  periodYearlyKey?: string;
  featuresKey: string;
  ctaKey: string;
}

@Component({
  selector: 'app-price-section',
  standalone: false,
  templateUrl: './price-section.component.html',
  styleUrls: ['./price-section.component.css']
})
export class PriceSectionComponent {

  billingCycle: 'monthly' | 'yearly' = 'monthly';

  plans: PricePlan[] = [
    {
      isRecommended: false,
      titleKey: 'PRICES.FREE.TITLE',
      monthlyPriceKey: 'PRICES.FREE.PRICE_MONTHLY',
      yearlyPriceKey: 'PRICES.FREE.PRICE_YEARLY',
      periodKey: 'PRICES.FREE.PERIOD',
      featuresKey: 'PRICES.FREE.FEATURES',
      ctaKey: 'PRICES.FREE.CTA'
    },
    {
      isRecommended: true,
      titleKey: 'PRICES.PREMIUM.TITLE',
      monthlyPriceKey: 'PRICES.PREMIUM.PRICE_MONTHLY',
      yearlyPriceKey: 'PRICES.PREMIUM.PRICE_YEARLY',
      periodKey: 'PRICES.PREMIUM.PERIOD',
      periodYearlyKey: 'PRICES.PREMIUM.PERIOD_YEARLY',
      featuresKey: 'PRICES.PREMIUM.FEATURES',
      ctaKey: 'PRICES.PREMIUM.CTA'
    }
  ];

  constructor() { }

  setBillingCycle(cycle: 'monthly' | 'yearly') {
    this.billingCycle = cycle;
  }
}
