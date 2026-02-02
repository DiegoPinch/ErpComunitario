import { Routes } from '@angular/router';
import { Auth } from './features/auth/auth';
import { LayoutComponent } from './layout/layout.component';
import { Dashboard } from './features/dashboard/dashboard';

export const routes: Routes = [
  { path: '', component: Auth },
  {
    path: 'layout', component: LayoutComponent, children: [
      { path: 'dashboard', component: Dashboard },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'usuarios', loadComponent: () => import('./features/usuarios/lista-usuarios/lista-usuarios').then(c => c.ListaUsuarios) },
      { path: 'medidores', loadComponent: () => import('./features/medidores/lista-medidores/lista-medidores').then(c => c.ListaMedidores) },
      { path: 'asignar-medidores', loadComponent: () => import('./features/medidores/asignar-medidores/asignar-medidores').then(c => c.AsignarMedidores) },
      { path: 'ingreso-lecturas', loadComponent: () => import('./features/lecturas/ingreso-lecturas/ingreso-lecturas').then(c => c.IngresoLecturas) },
      { path: 'facturas', loadComponent: () => import('./features/facturas/facturas-general/facturas-general').then(c => c.FacturasGeneral) },
      { path: 'rubros-adicionales', loadComponent: () => import('./features/rubros-adicionales/rubros-lista/rubros-lista').then(c => c.RubrosLista) },
      { path: 'tarifas', loadComponent: () => import('./features/configuracion/tarifas/tarifas').then(c => c.Tarifas) },
      { path: 'reportes', loadComponent: () => import('./features/reportes/reporte-general/reporte-general').then(c => c.ReporteGeneral) },

    ]
  },
  { path: '**', redirectTo: '' }
];
