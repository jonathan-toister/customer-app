import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'customers', pathMatch: 'full' },
  {
    path: 'customers',
    loadComponent: () =>
      import('./features/customers/customers-page/customers-page').then((m) => m.CustomersPage),
  },
  { path: '**', redirectTo: 'customers' },
];
