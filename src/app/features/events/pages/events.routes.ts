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
];
