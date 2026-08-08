import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/genealogy/pages/genealogy-page/genealogy-page.component')
      .then(module => module.GenealogyPageComponent),
  },
  { path: '**', redirectTo: '' },
];
