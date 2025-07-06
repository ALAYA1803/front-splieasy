import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberRoutingModule } from './member-routing.module';
import { MembContributionsComponent } from './memb-contributions/memb-contributions.component';
import { MembStatusComponent } from './memb-status/memb-status.component';
import { SettingsComponent } from '../representative/settings/settings.component';
import { MembHomeComponent } from './memb-home/memb-home.component';
import { PrimeNgModule } from '../../../prime-ng/prime-ng.module';
import { DropdownModule } from 'primeng/dropdown';
import {TranslatePipe} from '@ngx-translate/core';


@NgModule({
  declarations: [
    MembHomeComponent,
    MembContributionsComponent,
    MembStatusComponent,
  ],
  imports: [
    CommonModule,
    MemberRoutingModule,
    PrimeNgModule,
    DropdownModule,
    SettingsComponent,
    TranslatePipe
  ]
})
export class MemberModule { }
