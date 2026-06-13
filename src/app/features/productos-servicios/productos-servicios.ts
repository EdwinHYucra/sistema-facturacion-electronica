import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Plus,
  Search,
  Filter,
  Wrench,
  Briefcase,
  Truck,
  CalendarDays,
  Package,
  Pencil,
  Trash2,
  X
} from 'lucide-angular';
import { FacturacionApi, ProductoServicioApi } from '../../core/api/facturacion-api';

type TipoProducto = 'Repuesto' | 'Servicio' | 'Equipo' | 'Alquiler' | 'Producto';
type EstadoProducto = 'Activo' | 'Inactivo';

interface ProductoServicio {
  idProductoServicio?: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo: TipoProducto;
  unidadMedida: string;
  precioUnitario: number;
  estado: EstadoProducto;
}

@Component({
  selector: 'app-productos-servicios',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './productos-servicios.html',
  styleUrl: './productos-servicios.css'
})
export class ProductosServicios implements OnInit {
  private readonly api = inject(FacturacionApi);

  icons = {
    Plus,
    Search,
    Filter,
    Wrench,
    Briefcase,
    Truck,
    CalendarDays,
    Package,
    Pencil,
    Trash2,
    X
  };

  productos: ProductoServicio[] = [];
  cargando = false;
  guardando = false;
  mostrarModal = false;
  modoEdicion = false;
  mensaje = '';
  error = '';

  filtros = {
    codigo: '',
    nombre: '',
    tipo: '',
    estado: ''
  };

  formulario: ProductoServicio = this.emptyProducto();

  ngOnInit(): void {
    this.cargarProductos();
  }

  get productosFiltrados(): ProductoServicio[] {
    return this.productos.filter(producto => {
      const cumpleCodigo = producto.codigo.toLowerCase().includes(this.filtros.codigo.toLowerCase());
      const cumpleNombre = producto.nombre.toLowerCase().includes(this.filtros.nombre.toLowerCase());
      const cumpleTipo = !this.filtros.tipo || producto.tipo === this.filtros.tipo;
      const cumpleEstado = !this.filtros.estado || producto.estado === this.filtros.estado;
      return cumpleCodigo && cumpleNombre && cumpleTipo && cumpleEstado;
    });
  }

  cargarProductos(): void {
    this.cargando = true;
    this.api.getProductosServicios().subscribe({
      next: productos => {
        this.productos = productos.map(producto => this.fromApi(producto));
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar productos y servicios. Verifique que el backend este activo.';
        this.cargando = false;
      }
    });
  }

  abrirNuevo(): void {
    this.formulario = this.emptyProducto();
    this.modoEdicion = false;
    this.mostrarModal = true;
    this.error = '';
    this.mensaje = '';
  }

  abrirEditar(producto: ProductoServicio): void {
    this.formulario = { ...producto };
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
    const request = this.modoEdicion && this.formulario.idProductoServicio
      ? this.api.updateProductoServicio(this.formulario.idProductoServicio, payload)
      : this.api.createProductoServicio(payload);

    request.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarModal = false;
        this.mensaje = this.modoEdicion ? 'Producto/servicio actualizado correctamente.' : 'Producto/servicio registrado correctamente.';
        this.cargarProductos();
      },
      error: response => {
        this.guardando = false;
        this.error = this.getErrorMessage(response.error);
      }
    });
  }

  eliminar(producto: ProductoServicio): void {
    if (!producto.idProductoServicio) {
      return;
    }

    const confirmado = confirm(`Eliminar ${producto.nombre}?`);
    if (!confirmado) {
      return;
    }

    this.api.deleteProductoServicio(producto.idProductoServicio).subscribe({
      next: () => {
        this.mensaje = 'Producto/servicio eliminado correctamente.';
        this.cargarProductos();
      },
      error: () => {
        this.error = 'No se pudo eliminar el producto. Puede estar asociado a detalles.';
      }
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      codigo: '',
      nombre: '',
      tipo: '',
      estado: ''
    };
  }

  getTipoIcon(tipo: TipoProducto) {
    const icons = {
      Repuesto: this.icons.Wrench,
      Servicio: this.icons.Briefcase,
      Equipo: this.icons.Truck,
      Alquiler: this.icons.CalendarDays,
      Producto: this.icons.Package
    };

    return icons[tipo];
  }

  getTipoClass(tipo: TipoProducto): string {
    const classes = {
      Repuesto: 'text-orange-500',
      Servicio: 'text-violet-500',
      Equipo: 'text-emerald-500',
      Alquiler: 'text-red-500',
      Producto: 'text-blue-500'
    };

    return classes[tipo];
  }

  getEstadoClass(estado: EstadoProducto): string {
    const classes = {
      Activo: 'border-slate-300 bg-white text-slate-700',
      Inactivo: 'border-slate-200 bg-slate-100 text-slate-500'
    };

    return classes[estado];
  }

  formatPrecio(precio: number): string {
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(precio || 0);
  }

  private emptyProducto(): ProductoServicio {
    return {
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo: 'Producto',
      unidadMedida: 'NIU',
      precioUnitario: 0,
      estado: 'Activo'
    };
  }

  private fromApi(producto: ProductoServicioApi): ProductoServicio {
    return {
      idProductoServicio: producto.idProductoServicio,
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      tipo: this.toTipo(producto.tipo),
      unidadMedida: producto.unidadMedida,
      precioUnitario: producto.precioUnitario,
      estado: producto.estado?.toUpperCase() === 'INACTIVO' ? 'Inactivo' : 'Activo'
    };
  }

  private toApi(producto: ProductoServicio): ProductoServicioApi {
    return {
      idProductoServicio: producto.idProductoServicio,
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      tipo: producto.tipo.toUpperCase(),
      unidadMedida: producto.unidadMedida,
      precioUnitario: Number(producto.precioUnitario),
      estado: producto.estado.toUpperCase()
    };
  }

  private toTipo(tipo: string): TipoProducto {
    const values: Record<string, TipoProducto> = {
      REPUESTO: 'Repuesto',
      SERVICIO: 'Servicio',
      EQUIPO: 'Equipo',
      ALQUILER: 'Alquiler',
      PRODUCTO: 'Producto'
    };

    return values[tipo?.toUpperCase()] || 'Producto';
  }

  private getErrorMessage(error: any): string {
    if (!error) {
      return 'No se pudo guardar el producto/servicio.';
    }
    if (typeof error === 'string') {
      return error;
    }
    return Object.values(error).join(' ');
  }
}
