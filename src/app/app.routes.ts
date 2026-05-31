import { Routes } from '@angular/router';
import { MobileShell } from './layout/mobile-shell/mobile-shell';

export const routes: Routes = [
  {
    path: '',
    component: MobileShell,
    children: [
      {
        path: '',
        loadChildren: () => import('./features/auth/auth.routes').then((r) => r.routes),
      },
      {
        path: '**',
        redirectTo: 'login',
      },
    ],
  },
];
