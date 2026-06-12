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
    path: ':id/listo',
    loadComponent: () => import('./event-ready/event-ready').then((c) => c.EventReady),
  },
  {
    path: ':id',
    loadComponent: () => import('./event-detail/event-detail').then((c) => c.EventDetail),
  },
];
