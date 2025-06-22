import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RepresentativeRoutingModule } from './representative-routing.module';
import { HomeComponent } from './home/home.component';
import { ContributionsComponent } from './contributions/contributions.component';
import { SettingsComponent } from './settings/settings.component';
import { PrimeNgModule } from '../../../../prime-ng/prime-ng.module';
import { MembersComponent } from './members/members.component';
import { BillsComponent } from './bills/bills.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';


@NgModule({
  declarations: [
    HomeComponent,
    ContributionsComponent,
    BillsComponent,
    MembersComponent,
    SettingsComponent,
  ],
  imports: [
    CommonModule,
    RepresentativeRoutingModule,
    PrimeNgModule,
    ReactiveFormsModule,
    DropdownModule
  ]
})
export class RepresentativeModule { }
