import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'quake/:id', loadComponent: () => import('./features/detail/detail.component').then(m => m.DetailComponent) },
  { path: 'stats', loadComponent: () => import('./features/stats/stats.component').then(m => m.StatsComponent) },
  { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
  { path: '**', redirectTo: '' },
];
