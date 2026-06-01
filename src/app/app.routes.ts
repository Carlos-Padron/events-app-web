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
        path: 'events/create',
        loadComponent: () => import('./features/events/pages/create-event/create-event').then((c) => c.CreateEvent),
      },
      {
        path: '**',
        redirectTo: 'login',
      },
    ],
  },
];
