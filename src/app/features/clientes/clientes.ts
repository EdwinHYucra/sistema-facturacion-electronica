import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Plus,
  Search,
  Filter,
  FileText,
  Eye,
  Pencil,
  Trash2,
  X
} from 'lucide-angular';
import { ClienteApi, FacturacionApi } from '../../core/api/facturacion-api';

interface Cliente {
  idCliente?: number;
  tipoDocumento: 'RUC' | 'DNI';
  numeroDocumento: string;
  razonSocial: string;
  nombreComercial: string;
  direccion: string;
  correo: string;
  telefono: string;
  estado: 'Activo' | 'Inactivo';
}

@Component({
  selector: 'app-clientes',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css'
})
export class Clientes implements OnInit {
  private readonly api = inject(FacturacionApi);

  icons = {
    Plus,
    Search,
    Filter,
    FileText,
    Eye,
    Pencil,
    Trash2,
    X
  };

  clientes: Cliente[] = [];
  cargando = false;
  guardando = false;
  mostrarModal = false;
  modoEdicion = false;
  mensaje = '';
  error = '';

  filtros = {
    tipoDocumento: '',
    numeroDocumento: '',
    razonSocial: '',
    estado: ''
  };

  formulario: Cliente = this.emptyCliente();

  ngOnInit(): void {
    this.cargarClientes();
  }

  get clientesFiltrados(): Cliente[] {
    return this.clientes.filter(cliente => {
      const cumpleTipo = !this.filtros.tipoDocumento || cliente.tipoDocumento === this.filtros.tipoDocumento;
      const cumpleNumero = cliente.numeroDocumento.toLowerCase().includes(this.filtros.numeroDocumento.toLowerCase());
      const cumpleNombre = cliente.razonSocial.toLowerCase().includes(this.filtros.razonSocial.toLowerCase());
      const cumpleEstado = !this.filtros.estado || cliente.estado === this.filtros.estado;
      return cumpleTipo && cumpleNumero && cumpleNombre && cumpleEstado;
    });
  }

  cargarClientes(): void {
    this.cargando = true;
    this.error = '';
    this.api.getClientes().subscribe({
      next: clientes => {
        this.clientes = clientes.map(cliente => this.fromApi(cliente));
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar clientes. Verifique que el backend este activo.';
        this.cargando = false;
      }
    });
  }

  abrirNuevo(): void {
    this.formulario = this.emptyCliente();
    this.modoEdicion = false;
    this.mostrarModal = true;
    this.error = '';
    this.mensaje = '';
  }

  abrirEditar(cliente: Cliente): void {
    this.formulario = { ...cliente };
    this.modoEdicion = true;
    this.mostrarModal = true;
    this.error = '';
    this.mensaje = '';
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  guardar(): void {
    this.guardando = true;
    const payload = this.toApi(this.formulario);
    const request = this.modoEdicion && this.formulario.idCliente
      ? this.api.updateCliente(this.formulario.idCliente, payload)
      : this.api.createCliente(payload);

    request.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarModal = false;
        this.mensaje = this.modoEdicion ? 'Cliente actualizado correctamente.' : 'Cliente registrado correctamente.';
        this.cargarClientes();
      },
      error: response => {
        this.guardando = false;
        this.error = this.getErrorMessage(response.error);
      }
    });
  }

  eliminar(cliente: Cliente): void {
    if (!cliente.idCliente) {
      return;
    }

    const confirmado = confirm(`Eliminar cliente ${cliente.razonSocial}?`);
    if (!confirmado) {
      return;
    }

    this.api.deleteCliente(cliente.idCliente).subscribe({
      next: () => {
        this.mensaje = 'Cliente eliminado correctamente.';
        this.cargarClientes();
      },
      error: () => {
        this.error = 'No se pudo eliminar el cliente. Puede tener comprobantes asociados.';
      }
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      tipoDocumento: '',
      numeroDocumento: '',
      razonSocial: '',
      estado: ''
    };
  }

  getEstadoClass(estado: Cliente['estado']): string {
    const classes = {
      Activo: 'text-slate-900',
      Inactivo: 'bg-red-100 text-red-500 px-3 py-1 rounded-full'
    };

    return classes[estado];
  }

  private emptyCliente(): Cliente {
    return {
      tipoDocumento: 'RUC',
      numeroDocumento: '',
      razonSocial: '',
      nombreComercial: '',
      direccion: '',
      correo: '',
      telefono: '',
      estado: 'Activo'
    };
  }

  private fromApi(cliente: ClienteApi): Cliente {
    return {
      idCliente: cliente.idCliente,
      tipoDocumento: cliente.tipoDocumento as Cliente['tipoDocumento'],
      numeroDocumento: cliente.numeroDocumento,
      razonSocial: cliente.razonSocial,
      nombreComercial: cliente.nombreComercial || '-',
      direccion: cliente.direccion || '-',
      correo: cliente.correo || '-',
      telefono: cliente.telefono || '',
      estado: cliente.estado?.toUpperCase() === 'INACTIVO' ? 'Inactivo' : 'Activo'
    };
  }

  private toApi(cliente: Cliente): ClienteApi {
    return {
      idCliente: cliente.idCliente,
      tipoDocumento: cliente.tipoDocumento,
      numeroDocumento: cliente.numeroDocumento,
      razonSocial: cliente.razonSocial,
      nombreComercial: cliente.nombreComercial,
      direccion: cliente.direccion,
      correo: cliente.correo,
      telefono: cliente.telefono,
      estado: cliente.estado.toUpperCase()
    };
  }

  private getErrorMessage(error: any): string {
    if (!error) {
      return 'No se pudo guardar el cliente.';
    }
    if (typeof error === 'string') {
      return error;
    }
    return Object.values(error).join(' ');
  }

}
