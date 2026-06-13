import { Routes } from '@angular/router';
import { LayoutAdmin } from './layout/components/layout-admin/layout-admin';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/pages/login/login').then(m => m.Login)
  },
  {
    path: '',
    component: LayoutAdmin,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/clientes/clientes').then(m => m.Clientes)
      },
      {
        path: 'productos-servicios',
        loadComponent: () =>
          import('./features/productos-servicios/productos-servicios').then(m => m.ProductosServicios)
      },
      {
        path: 'comprobantes',
        loadComponent: () =>
          import('./features/comprobantes/pages/comprobantes-list/comprobantes-list').then(m => m.ComprobantesList)
      },
      {
        path: 'comprobantes/nuevo',
        loadComponent: () =>
          import('./features/comprobantes/pages/comprobante-form/comprobante-form').then(m => m.ComprobanteForm)
      },
      {
        path: 'comprobantes/:id/vista-previa',
        loadComponent: () =>
          import('./features/comprobantes/pages/comprobante-preview/comprobante-preview').then(m => m.ComprobantePreview)
      },
      {
        path: 'comprobantes/:id/seguimiento',
        loadComponent: () =>
          import('./features/comprobantes/pages/comprobante-tracking/comprobante-tracking').then(m => m.ComprobanteTracking)
      },
      {
        path: 'comprobantes/:id',
        loadComponent: () =>
          import('./features/comprobantes/pages/comprobante-detail/comprobante-detail').then(m => m.ComprobanteDetail)
      },
      {
        path: 'notas',
        loadComponent: () =>
          import('./features/notas/notas').then(m => m.Notas)
      },
      {
        path: 'guias-remision',
        loadComponent: () =>
          import('./features/guias-remision/guias-remision').then(m => m.GuiasRemision)
      },
      {
        path: 'sunat-cdr',
        loadComponent: () =>
          import('./features/sunat-cdr/sunat-cdr').then(m => m.SunatCdr)
      },
      {
        path: 'usuarios-roles',
        loadComponent: () =>
          import('./features/usuarios-roles/usuarios-roles').then(m => m.UsuariosRoles)
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/configuracion/configuracion').then(m => m.Configuracion)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
