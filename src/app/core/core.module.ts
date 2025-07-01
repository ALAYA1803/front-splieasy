import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TheFooterComponent } from './components/the-footer/the-footer.component';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher.component';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { PrimeNgModule } from '../prime-ng/prime-ng.module';
import { LayoutComponent } from './components/layout/layout.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterSidebarComponent } from './components/footer-sidebar/footer-sidebar.component';

@NgModule({
  declarations: [
    TheFooterComponent,
    NavBarComponent,
    LanguageSwitcherComponent,
    SidebarComponent,
    LayoutComponent,
    HeaderComponent,
    FooterSidebarComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    RouterModule,
    PrimeNgModule
  ],
  exports: [
    TheFooterComponent,
    NavBarComponent,
  ]
})
export class CoreModule { }
