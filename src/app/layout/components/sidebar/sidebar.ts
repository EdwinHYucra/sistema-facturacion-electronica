import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  ChevronLeft,
  FileMinus2,
  Files,
  FileText,
  LayoutDashboard,
  LogOut,
  LucideAngularModule,
  Package,
  ReceiptText,
  Server,
  Settings,
  ShieldCheck,
  Truck,
  Users
} from 'lucide-angular';
import { AuthService } from '../../../auth/auth.service';

interface MenuItem {
  label: string;
  path: string;
  icon: any;
  exact: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  private readonly auth = inject(AuthService);

  @Input() mobileOpen = false;
  @Output() mobileClose = new EventEmitter<void>();

  logoIcon = ReceiptText;
  collapseIcon = ChevronLeft;
  logoutIcon = LogOut;

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      exact: true
    },
    {
      label: 'Clientes',
      path: '/clientes',
      icon: Users,
      exact: true
    },
    {
      label: 'Productos y servicios',
      path: '/productos-servicios',
      icon: Package,
      exact: true
    },
    {
      label: 'Nueva factura/boleta',
      path: '/comprobantes/nuevo',
      icon: FileText,
      exact: true
    },
    {
      label: 'Comprobantes',
      path: '/comprobantes',
      icon: Files,
      exact: true
    },
    {
      label: 'Notas crédito/débito',
      path: '/notas',
      icon: FileMinus2,
      exact: true
    },
    {
      label: 'Guías de remisión',
      path: '/guias-remision',
      icon: Truck,
      exact: true
    },
    {
      label: 'SUNAT / CDR',
      path: '/sunat-cdr',
      icon: Server,
      exact: true
    },
    {
      label: 'Usuarios y roles',
      path: '/usuarios-roles',
      icon: ShieldCheck,
      exact: true
    },
    {
      label: 'Configuración',
      path: '/configuracion',
      icon: Settings,
      exact: true
    }
  ];

  cerrarSesion(): void {
    this.mobileClose.emit();
    this.auth.logout();
  }

  cerrarMobile(): void {
    this.mobileClose.emit();
  }
}
