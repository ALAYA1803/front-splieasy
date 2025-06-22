import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './public/home/home.component';
import { LayoutComponent } from './core/components/layout/layout.component';

const routes: Routes = [
  {path: '', redirectTo: 'inicio', pathMatch:'full'},
  {path: 'inicio', loadChildren: () => import('./public/home/home.module').then(m => m.HomeModule)},
  {path: 'autenticacion', loadChildren: () => import('./pages/full-pages/authentication.module').then(m => m.AuthenticationModule)},
  {
    path: 'representante',   // Ruta base para el portafolio
    component: LayoutComponent,
    children: [
      { path: '', loadChildren: () => import('./pages/modules/representative/representative.module').then(m => m.RepresentativeModule)}
    ]
  },
  {
    path: 'miembro',   // Ruta base para el portafolio
    component: LayoutComponent,
    children: [
      { path: '', loadChildren: () => import('./pages/modules/member/member.module').then(m => m.MemberModule)}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
