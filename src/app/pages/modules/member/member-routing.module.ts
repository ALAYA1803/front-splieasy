import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MembContributionsComponent } from './memb-contributions/memb-contributions.component';
import { MembHomeComponent } from './memb-home/memb-home.component';
import { MembStatusComponent } from './memb-status/memb-status.component';
import { MembSettingsComponent } from './memb-settings/memb-settings.component';

const routes: Routes = [
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: 'home', component: MembHomeComponent},
  {path: 'contributions', component: MembContributionsComponent},
  {path: 'status', component: MembStatusComponent},
  {path: 'settings', component: MembSettingsComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MemberRoutingModule { }
