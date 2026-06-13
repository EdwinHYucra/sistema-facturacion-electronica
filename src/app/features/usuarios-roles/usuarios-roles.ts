import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
  Eye,
  Pencil,
  Trash2,
  X
} from 'lucide-angular';
import { EmpresaApi, FacturacionApi, RolApi, UsuarioApi } from '../../core/api/facturacion-api';

type EstadoUsuario = 'Activo' | 'Inactivo';

interface UsuarioView {
  idUsuario?: number;
  idEmpresa?: number;
  idRol?: number;
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
  rol: string;
  estado: EstadoUsuario;
  ultimoAcceso: string;
}

@Component({
  selector: 'app-usuarios-roles',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './usuarios-roles.html',
  styleUrl: './usuarios-roles.css'
})
export class UsuariosRoles implements OnInit {
  private readonly api = inject(FacturacionApi);

  mostrarModal = false;
  modoEdicion = false;
  cargando = false;
  guardando = false;
  mensaje = '';
  error = '';

  icons = {
    Plus,
    Search,
    ShieldCheck,
    UserCheck,
    UserX,
    Users,
    Eye,
    Pencil,
    Trash2,
    X
  };

  usuarios: UsuarioView[] = [];
  roles: RolApi[] = [];
  empresas: EmpresaApi[] = [];

  filtros = {
    texto: '',
    rol: '',
    estado: ''
  };

  formulario: UsuarioView = this.emptyUsuario();

  ngOnInit(): void {
    this.cargarDatos();
  }

  get usuariosFiltrados(): UsuarioView[] {
    const texto = this.filtros.texto.toLowerCase();
    return this.usuarios.filter(usuario => {
      const cumpleTexto = !texto
        || usuario.nombres.toLowerCase().includes(texto)
        || usuario.apellidos.toLowerCase().includes(texto)
        || usuario.correo.toLowerCase().includes(texto);
      const cumpleRol = !this.filtros.rol || usuario.rol === this.filtros.rol;
      const cumpleEstado = !this.filtros.estado || usuario.estado === this.filtros.estado;
      return cumpleTexto && cumpleRol && cumpleEstado;
    });
  }

  get usuariosActivos(): number {
    return this.usuarios.filter(usuario => usuario.estado === 'Activo').length;
  }

  get usuariosInactivos(): number {
    return this.usuarios.filter(usuario => usuario.estado === 'Inactivo').length;
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';

    this.api.getRoles().subscribe({
      next: roles => {
        this.roles = roles;
        this.api.getEmpresas().subscribe({
          next: empresas => {
            this.empresas = empresas;
            this.cargarUsuarios();
          },
          error: () => {
            this.error = 'No se pudieron cargar empresas.';
            this.cargando = false;
          }
        });
      },
      error: () => {
        this.error = 'No se pudieron cargar roles.';
        this.cargando = false;
      }
    });
  }

  cargarUsuarios(): void {
    this.api.getUsuarios().subscribe({
      next: usuarios => {
        this.usuarios = usuarios.map(usuario => this.fromApi(usuario));
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar usuarios. Verifique que el backend este activo.';
        this.cargando = false;
      }
    });
  }

  abrirModal(): void {
    const empresa = this.empresas[0];
    const rol = this.roles[0];
    this.formulario = {
      ...this.emptyUsuario(),
      idEmpresa: empresa?.idEmpresa,
      idRol: rol?.idRol,
      rol: rol?.nombreRol || 'Operador'
    };
    this.modoEdicion = false;
    this.mostrarModal = true;
    this.error = '';
    this.mensaje = '';
  }

  abrirEditar(usuario: UsuarioView): void {
    this.formulario = { ...usuario, password: usuario.password || 'admin123' };
    this.modoEdicion = true;
    this.mostrarModal = true;
    this.error = '';
    this.mensaje = '';
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  guardarUsuario(): void {
    this.guardando = true;
    const payload = this.toApi(this.formulario);
    const request = this.modoEdicion && this.formulario.idUsuario
      ? this.api.updateUsuario(this.formulario.idUsuario, payload)
      : this.api.createUsuario(payload);

    request.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarModal = false;
        this.mensaje = this.modoEdicion ? 'Usuario actualizado correctamente.' : 'Usuario registrado correctamente.';
        this.cargarUsuarios();
      },
      error: response => {
        this.guardando = false;
        this.error = this.getErrorMessage(response.error);
      }
    });
  }

  eliminarUsuario(usuario: UsuarioView): void {
    if (!usuario.idUsuario) {
      return;
    }

    const confirmado = confirm(`Eliminar usuario ${usuario.nombres} ${usuario.apellidos}?`);
    if (!confirmado) {
      return;
    }

    this.api.deleteUsuario(usuario.idUsuario).subscribe({
      next: () => {
        this.mensaje = 'Usuario eliminado correctamente.';
        this.cargarUsuarios();
      },
      error: () => {
        this.error = 'No se pudo eliminar el usuario.';
      }
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      texto: '',
      rol: '',
      estado: ''
    };
  }

  getEstadoClass(estado: EstadoUsuario): string {
    const classes = {
      Activo: 'bg-emerald-100 text-emerald-700',
      Inactivo: 'bg-red-100 text-red-600'
    };

    return classes[estado];
  }

  getRolClass(rol: string): string {
    const normalized = rol.toUpperCase();
    if (normalized.includes('ADMIN')) return 'bg-violet-100 text-violet-700';
    if (normalized.includes('SUPERV')) return 'bg-blue-100 text-blue-700';
    if (normalized.includes('AUDIT')) return 'bg-slate-100 text-slate-700';
    return 'bg-amber-100 text-amber-700';
  }

  private emptyUsuario(): UsuarioView {
    return {
      nombres: '',
      apellidos: '',
      correo: '',
      password: 'admin123',
      rol: '',
      estado: 'Activo',
      ultimoAcceso: '-'
    };
  }

  private fromApi(usuario: UsuarioApi): UsuarioView {
    return {
      idUsuario: usuario.idUsuario,
      idEmpresa: usuario.empresa?.idEmpresa,
      idRol: usuario.rol?.idRol,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      password: usuario.password,
      rol: usuario.rol?.nombreRol || 'Operador',
      estado: usuario.estado?.toUpperCase() === 'INACTIVO' ? 'Inactivo' : 'Activo',
      ultimoAcceso: usuario.fechaCreacion?.replace('T', ' ').slice(0, 16) || '-'
    };
  }

  private toApi(usuario: UsuarioView): UsuarioApi {
    return {
      idUsuario: usuario.idUsuario,
      empresa: { idEmpresa: usuario.idEmpresa } as EmpresaApi,
      rol: { idRol: usuario.idRol } as RolApi,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      password: usuario.password || 'admin123',
      estado: usuario.estado.toUpperCase()
    };
  }

  private getErrorMessage(error: any): string {
    if (!error) {
      return 'No se pudo guardar el usuario.';
    }
    if (typeof error === 'string') {
      return error;
    }
    return Object.values(error).join(' ');
  }
}
