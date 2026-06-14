import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then((c) => c.HomeEvent),
  },
  {
    path: 'crear',
    loadComponent: () => import('./create-event/create-event').then((c) => c.CreateEvent),
  },

  {
    path: 'perfil',
    loadComponent: () => import('./profile/profile').then((c) => c.Profile),
  },
  {
    path: ':id/capturar',
    loadComponent: () => import('./capture/capture').then((c) => c.Capture),
  },
  {
    path: ':id',
    loadComponent: () => import('./event-detail/event-detail').then((c) => c.EventDetail),
  },
];
