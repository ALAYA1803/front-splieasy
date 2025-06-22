import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
import { FormsModule } from '@angular/forms';
import { AboutSectionComponent } from './about-section/about-section.component';
import { ContactusSectionComponent } from './contactus-section/contactus-section.component';
import { HeroSectionComponent } from './hero-section/hero-section.component';
import { HowdoesitworkSectionComponent } from './howdoesitwork-section/howdoesitwork-section.component';
import { LanguageSwitcherComponent } from '../../core/components/language-switcher/language-switcher.component';
import { PriceSectionComponent } from './price-section/price-section.component';
import { ReviewSectionComponent } from './review-section/review-section.component';
import { ServiceSectionComponent } from './service-section/service-section.component';
import { TranslateModule } from '@ngx-translate/core';
import { CoreModule } from '../../core/core.module';
import { AppRoutingModule } from '../../app-routing.module';


@NgModule({
  declarations: [HomeComponent,
    AboutSectionComponent,
    ContactusSectionComponent,
    HeroSectionComponent,
    HowdoesitworkSectionComponent,
    PriceSectionComponent,
    ReviewSectionComponent,
    ServiceSectionComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    TranslateModule,
    FormsModule,
    HomeRoutingModule
  ]
})
export class HomeModule { }
