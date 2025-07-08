import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberRoutingModule } from './member-routing.module';
import { TranslateModule } from '@ngx-translate/core';
import { MembHomeComponent } from './memb-home/memb-home.component';
import { MembContributionsComponent } from './memb-contributions/memb-contributions.component';
import { MembStatusComponent } from './memb-status/memb-status.component';
import { MembSettingsComponent } from './memb-settings/memb-settings.component';
import { PrimeNgModule } from '../../../prime-ng/prime-ng.module';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    MemberRoutingModule,
    TranslateModule,

    // Módulos de PrimeNG
    PrimeNgModule,
    TableModule,
    CardModule,
    ButtonModule,
    TooltipModule,
    AvatarModule,
    ProgressSpinnerModule,
    TagModule
  ]
})
export class MemberModule { }
