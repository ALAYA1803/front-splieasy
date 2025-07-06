import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RepresentativeRoutingModule } from './representative-routing.module';
import { PrimeNgModule } from '../../../prime-ng/prime-ng.module';
import { TranslateModule } from '@ngx-translate/core';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AvatarModule } from 'primeng/avatar';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { HomeComponent } from './home/home.component';
import { ContributionsComponent } from './contributions/contributions.component';
import { BillsComponent } from './bills/bills.component';
import { MembersComponent } from './members/members.component';
import { SettingsComponent } from './settings/settings.component';

@NgModule({
  declarations: [
    HomeComponent,
    ContributionsComponent,
    BillsComponent
  ],
  imports: [
    CommonModule,
    RepresentativeRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    PrimeNgModule,
    TranslateModule,
    ToastModule,
    ConfirmDialogModule,
    AvatarModule,
    DialogModule,
    TooltipModule,
    MembersComponent,
    SettingsComponent
  ]
})
export class RepresentativeModule { }
