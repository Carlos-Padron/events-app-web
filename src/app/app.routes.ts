import { Routes } from '@angular/router';
import { MobileShell } from './layout/mobile-shell/mobile-shell';
import { EventsShell } from './layout/events-shell/events-shell';
import { authGuard } from './common/guards/auth.guard';

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
        path: 'eventos',
        component: EventsShell,
        canActivate: [authGuard],
        loadChildren: () => import('./features/events/pages/events.routes').then((r) => r.routes),
      },
      {
        path: '**',
        redirectTo: 'login',
      },
    ],
  },
];
