import { Routes } from '@angular/router';
import { Auth } from './features/auth/auth';
import { LayoutComponent } from './layout/layout.component';
import { Dashboard } from './features/dashboard/dashboard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'consulta', loadComponent: () => import('./features/portal/portal').then(c => c.Portal) },
  { path: '', component: Auth },
  {
    path: 'layout', component: LayoutComponent, canActivate: [authGuard], children: [
      { path: 'dashboard', component: Dashboard },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'usuarios', loadComponent: () => import('./features/usuarios/lista-usuarios/lista-usuarios').then(c => c.ListaUsuarios) },
      { path: 'medidores', loadComponent: () => import('./features/medidores/lista-medidores/lista-medidores').then(c => c.ListaMedidores) },
      { path: 'asignar-medidores', loadComponent: () => import('./features/medidores/asignar-medidores/asignar-medidores').then(c => c.AsignarMedidores) },
      { path: 'ingreso-lecturas', loadComponent: () => import('./features/lecturas/ingreso-lecturas/ingreso-lecturas').then(c => c.IngresoLecturas) },
      { path: 'facturas', loadComponent: () => import('./features/facturas/facturas-general/facturas-general').then(c => c.FacturasGeneral) },
      { path: 'rubros-adicionales', loadComponent: () => import('./features/rubros-adicionales/rubros-lista/rubros-lista').then(c => c.RubrosLista) },
      { path: 'tarifas', loadComponent: () => import('./features/configuracion/tarifas/tarifas').then(c => c.Tarifas) },
      { path: 'configuracion/multas', loadComponent: () => import('./features/configuracion/multas-config/multas-config').then(c => c.MultasConfig) },
      { path: 'categorias-egresos', loadComponent: () => import('./features/configuracion/categorias-egresos/categorias-egresos').then(c => c.CategoriasEgresos) },
      { path: 'configuracion/usuarios-sistema', loadComponent: () => import('./features/configuracion/usuarios-sistema/usuarios-sistema').then(c => c.UsuariosSistemaComponent) },
      { path: 'registro-egresos', loadComponent: () => import('./features/caja/registro-egresos/registro-egresos').then(c => c.RegistroEgresos) },
      { path: 'estado-caja', loadComponent: () => import('./features/caja/estado-caja/estado-caja').then(c => c.EstadoCaja) },
      { path: 'reportes', loadComponent: () => import('./features/reportes/reporte-general/reporte-general').then(c => c.ReporteGeneral), data: { type: 'general' } },
      { path: 'reportes-financieros', loadComponent: () => import('./features/reportes/reporte-general/reporte-general').then(c => c.ReporteGeneral), data: { type: 'financiero' } },
      { path: 'ingresos-extra', loadComponent: () => import('./features/tesoreria/ingresos-extra/ingresos-extra').then(c => c.IngresosExtraordinarios) },
      { path: 'cuentas-bancarias', loadComponent: () => import('./features/tesoreria/cuentas-bancarias/cuentas-bancarias').then(c => c.default) },
      // Nuevas Rutas (Directiva, Convenios, Cortes, Inventario)
      { path: 'directiva', loadComponent: () => import('./features/directiva/list-directiva/list-directiva').then(c => c.ListDirectiva) },
      { path: 'directiva/nueva', loadComponent: () => import('./features/directiva/form-directiva/form-directiva').then(c => c.FormDirectiva) },
      { path: 'directiva/:id', loadComponent: () => import('./features/directiva/form-directiva/form-directiva').then(c => c.FormDirectiva) },
      { path: 'reuniones', loadComponent: () => import('./features/directiva/reuniones/lista-reuniones').then(c => c.ListaReuniones) },
      { path: 'reuniones/asistencia/:id', loadComponent: () => import('./features/directiva/reuniones/tomar-asistencia').then(c => c.TomarAsistencia) },
      { path: 'convenios', loadComponent: () => import('./features/usuarios/convenios/convenios').then(c => c.Convenios) },
      { path: 'cortes-caja', loadComponent: () => import('./features/caja/cortes-caja/cortes-caja').then(c => c.CortesCaja) },
      { path: 'inventario', loadComponent: () => import('./features/inventario/list-inventario/list-inventario').then(c => c.ListInventario) },
      { path: 'inventario/kardex/:id', loadComponent: () => import('./features/inventario/kardex/kardex').then(c => c.Kardex) },
      { path: 'respaldos', loadComponent: () => import('./features/respaldos/respaldos').then(c => c.Respaldos) },
    ]
  },
  { path: '**', redirectTo: '' }
];
