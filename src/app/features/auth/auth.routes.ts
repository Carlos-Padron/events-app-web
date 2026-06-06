import { Routes } from '@angular/router';
import { guestGuard } from '../../common/guards/guest.guard';

export const routes: Routes = [
  { path: 'login',    canActivate: [guestGuard], loadComponent: () => import('./pages/login/login').then((c) => c.Login) },
  { path: 'registro', canActivate: [guestGuard], loadComponent: () => import('./pages/register/register').then((c) => c.Register) },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
