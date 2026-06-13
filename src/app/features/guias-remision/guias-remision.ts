import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EMPTY, forkJoin, of } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import {
  LucideAngularModule,
  FileText,
  User,
  MapPin,
  Truck,
  PackageOpen,
  Plus,
  Search,
  Info,
  Save,
  Send,
  FileCheck2,
  Trash2,
  Pencil
} from 'lucide-angular';
import {
  ClienteApi,
  ComprobanteApi,
  EmpresaApi,
  FacturacionApi,
  GuiaRemisionApi,
  ProductoServicioApi,
  SerieComprobanteApi,
  UsuarioApi
} from '../../core/api/facturacion-api';

interface BienTransportar {
  producto: ProductoServicioApi;
  cantidad: number;
  unidadMedida: string;
  descripcion: string;
  peso: number;
}

@Component({
  selector: 'app-guias-remision',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './guias-remision.html',
  styleUrl: './guias-remision.css'
})
export class GuiasRemision implements OnInit {
  private readonly api = inject(FacturacionApi);

  icons = {
    FileText,
    User,
    MapPin,
    Truck,
    PackageOpen,
    Plus,
    Search,
    Info,
    Save,
    Send,
    FileCheck2,
    Trash2,
    Pencil
  };

  empresas: EmpresaApi[] = [];
  usuarios: UsuarioApi[] = [];
  clientes: ClienteApi[] = [];
  productos: ProductoServicioApi[] = [];
  comprobantes: ComprobanteApi[] = [];
  series: SerieComprobanteApi[] = [];
  guias: GuiaRemisionApi[] = [];
  bienes: BienTransportar[] = [];

  cargando = false;
  guardando = false;
  procesandoGuiaId?: number;
  mensaje = '';
  error = '';

  idEmpresa?: number;
  idUsuario?: number;
  idCliente?: number;
  idSerie?: number;
  idGuiaEditando?: number;
  idComprobanteRelacionado?: number;
  clienteDocumento = '';
  clienteSeleccionado?: ClienteApi;

  fechaEmision = new Date().toISOString().slice(0, 10);
  fechaTraslado = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  motivoTraslado = '01 - Venta';
  modalidadTraslado = '02 - Transporte privado';
  direccionPartida = 'Av. Industrial 3318, Independencia, Lima';
  direccionLlegada = '';
  transportista = 'TRANSPORTES DE CARGA PESADA S.A.C.';
  documentoTransportista = '20512345678';
  placaVehiculo = 'F7H-890';
  observacion = '';

  productoSeleccionadoId?: number;
  cantidad = 1;
  peso = 0;

  ngOnInit(): void {
    this.cargarDatos();
  }

  get serieSeleccionada(): SerieComprobanteApi | undefined {
    return this.series.find(serie => serie.idSerie === this.idSerie);
  }

  get correlativoSiguiente(): number {
    return (this.serieSeleccionada?.correlativoActual || 0) + 1;
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';

    forkJoin({
      empresas: this.api.getEmpresas(),
      usuarios: this.api.getUsuarios(),
      clientes: this.api.getClientes(),
      productos: this.api.getProductosServicios(),
      comprobantes: this.api.getComprobantes(),
      series: this.api.getSeriesComprobante(),
      guias: this.api.getGuiasRemision()
    })
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: ({ empresas, usuarios, clientes, productos, comprobantes, series, guias }) => {
        this.empresas = empresas;
        this.idEmpresa = empresas[0]?.idEmpresa;
        this.usuarios = usuarios;
        this.idUsuario = usuarios[0]?.idUsuario;
        this.clientes = clientes;
        this.productos = productos;
        this.comprobantes = comprobantes;
        this.series = series.filter(serie => serie.tipoComprobante?.codigoSunat === '09');
        this.idSerie = this.series[0]?.idSerie;
        this.guias = guias;
      },
      error: () => this.failLoad('No se pudieron cargar los datos de la guia. Verifique que el backend este activo.')
    });
  }

  seleccionarCliente(): void {
    const cliente = this.clientes.find(item => item.idCliente === this.idCliente);
    this.clienteSeleccionado = cliente;
    this.clienteDocumento = cliente?.numeroDocumento || '';
    this.direccionLlegada = cliente?.direccion || this.direccionLlegada;
  }

  buscarCliente(): void {
    const cliente = this.clientes.find(item => item.numeroDocumento === this.clienteDocumento.trim());
    if (!cliente) {
      this.error = 'No se encontro un cliente con ese documento.';
      return;
    }
    this.idCliente = cliente.idCliente;
    this.seleccionarCliente();
    this.error = '';
  }

  seleccionarProducto(): void {
    const producto = this.productos.find(item => item.idProductoServicio === this.productoSeleccionadoId);
    this.peso = producto?.tipo === 'EQUIPO' ? 39000 : this.peso;
  }

  agregarBien(): void {
    const producto = this.productos.find(item => item.idProductoServicio === this.productoSeleccionadoId);
    if (!producto) {
      this.error = 'Seleccione un producto o servicio.';
      return;
    }
    if (this.cantidad <= 0 || this.peso < 0) {
      this.error = 'Revise cantidad y peso.';
      return;
    }

    this.bienes.push({
      producto,
      cantidad: this.cantidad,
      unidadMedida: producto.unidadMedida,
      descripcion: producto.nombre,
      peso: this.peso
    });

    this.productoSeleccionadoId = undefined;
    this.cantidad = 1;
    this.peso = 0;
    this.error = '';
  }

  quitarBien(index: number): void {
    this.bienes.splice(index, 1);
  }

  editarBorrador(guia: GuiaRemisionApi): void {
    if (!guia.idGuia || !this.puedeConvertirAEnvio(guia)) {
      return;
    }

    this.idGuiaEditando = guia.idGuia;
    this.idEmpresa = guia.empresa?.idEmpresa || this.idEmpresa;
    this.idUsuario = guia.usuario?.idUsuario || this.idUsuario;
    this.idCliente = guia.cliente?.idCliente;
    this.idSerie = guia.serieComprobante?.idSerie || this.series.find(serie => serie.serie === guia.serie)?.idSerie;
    this.idComprobanteRelacionado = guia.comprobanteRelacionado?.idComprobante;
    this.fechaEmision = guia.fechaEmision.slice(0, 10);
    this.fechaTraslado = guia.fechaTraslado.slice(0, 10);
    this.motivoTraslado = guia.motivoTraslado;
    this.modalidadTraslado = guia.modalidadTraslado;
    this.direccionPartida = guia.direccionPartida;
    this.direccionLlegada = guia.direccionLlegada;
    this.transportista = guia.transportista || '';
    this.documentoTransportista = guia.documentoTransportista || '';
    this.placaVehiculo = guia.placaVehiculo || '';
    this.observacion = guia.observacion || '';
    this.bienes = [];
    this.seleccionarCliente();
    this.mensaje = `Editando borrador ${this.formatSerieCorrelativo(guia)}.`;
    this.error = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion(): void {
    this.idGuiaEditando = undefined;
    this.bienes = [];
    this.mensaje = '';
    this.error = '';
  }

  guardarBorrador(): void {
    this.guardar('REGISTRADA');
  }

  enviarSunat(): void {
    this.guardar('PENDIENTE');
  }

  guardar(estado: string): void {
    this.error = '';
    this.mensaje = '';

    if (!this.idEmpresa || !this.idUsuario || !this.idCliente || !this.idSerie) {
      this.error = 'Complete empresa, usuario, cliente y serie.';
      return;
    }
    if (!this.idGuiaEditando && this.bienes.length === 0) {
      this.error = 'Agregue al menos un bien a transportar.';
      return;
    }

    this.guardando = true;
    const guia: GuiaRemisionApi = {
      empresa: { idEmpresa: this.idEmpresa } as EmpresaApi,
      usuario: { idUsuario: this.idUsuario } as UsuarioApi,
      cliente: { idCliente: this.idCliente } as ClienteApi,
      serieComprobante: { idSerie: this.idSerie } as SerieComprobanteApi,
      comprobanteRelacionado: this.idComprobanteRelacionado
        ? ({ idComprobante: this.idComprobanteRelacionado } as ComprobanteApi)
        : undefined,
      serie: this.serieSeleccionada?.serie || '',
      correlativo: this.correlativoSiguiente,
      fechaEmision: `${this.fechaEmision}T00:00:00`,
      fechaTraslado: this.fechaTraslado,
      motivoTraslado: this.motivoTraslado,
      modalidadTraslado: this.modalidadTraslado,
      direccionPartida: this.direccionPartida,
      direccionLlegada: this.direccionLlegada,
      transportista: this.transportista,
      documentoTransportista: this.documentoTransportista,
      placaVehiculo: this.placaVehiculo,
      estado,
      observacion: this.observacion
    };

    const request = this.idGuiaEditando
      ? this.api.updateGuiaRemision(this.idGuiaEditando, { ...guia, idGuia: this.idGuiaEditando })
      : this.api.createGuiaRemision(guia);

    request
      .pipe(
        switchMap(creada => {
          if (this.idGuiaEditando && this.bienes.length === 0) {
            return of(creada);
          }

          const detalleRequests = this.bienes.map(bien =>
            this.api.createDetalleGuiaRemision({
              guiaRemision: { idGuia: creada.idGuia } as GuiaRemisionApi,
              productoServicio: { idProductoServicio: bien.producto.idProductoServicio } as ProductoServicioApi,
              cantidad: bien.cantidad,
              unidadMedida: bien.unidadMedida,
              descripcion: bien.descripcion,
              peso: bien.peso
            })
          );

          return forkJoin(detalleRequests).pipe(switchMap(() => of(creada)));
        }),
        catchError(response => {
          this.error = this.getErrorMessage(response.error);
          return EMPTY;
        }),
        finalize(() => {
          this.guardando = false;
        })
      )
      .subscribe({
        next: () => {
          this.mensaje = this.idGuiaEditando
            ? 'Borrador de guia actualizado correctamente.'
            : estado === 'PENDIENTE'
              ? 'Guia registrada y lista para envio SUNAT simulado.'
              : 'Guia guardada como borrador.';
          this.bienes = [];
          this.idGuiaEditando = undefined;
          this.cargarDatos();
        }
      });
  }

  convertirBorradorAEnvio(guia: GuiaRemisionApi): void {
    if (!guia.idGuia || this.procesandoGuiaId) {
      return;
    }

    this.procesandoGuiaId = guia.idGuia;
    this.mensaje = '';
    this.error = '';

    this.api.updateGuiaRemision(guia.idGuia, { ...guia, estado: 'PENDIENTE' }).subscribe({
      next: () => {
        this.mensaje = `Guia ${this.formatSerieCorrelativo(guia)} marcada como pendiente de envio.`;
        this.procesandoGuiaId = undefined;
        this.cargarDatos();
      },
      error: response => {
        this.error = this.getErrorMessage(response.error);
        this.procesandoGuiaId = undefined;
      }
    });
  }

  enviarGuiaSunat(guia: GuiaRemisionApi): void {
    if (!guia.idGuia || this.procesandoGuiaId) {
      return;
    }

    this.procesandoGuiaId = guia.idGuia;
    this.mensaje = '';
    this.error = '';

    this.api.enviarGuiaSunatSimulado(guia.idGuia).subscribe({
      next: () => {
        this.mensaje = `Guia ${this.formatSerieCorrelativo(guia)} enviada y aceptada por SUNAT simulada.`;
        this.procesandoGuiaId = undefined;
        this.cargarDatos();
      },
      error: response => {
        this.error = this.getErrorMessage(response.error) || 'No se pudo enviar la guia a SUNAT simulada.';
        this.procesandoGuiaId = undefined;
      }
    });
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  }

  formatSerieCorrelativo(guia: GuiaRemisionApi): string {
    return `${guia.serie}-${String(guia.correlativo || 0).padStart(8, '0')}`;
  }

  estadoGuiaLabel(estado?: string): string {
    const normalized = estado?.toUpperCase();
    if (normalized === 'ACEPTADO') return 'Aceptado';
    if (normalized === 'RECHAZADO') return 'Rechazado';
    if (normalized === 'PENDIENTE') return 'Pendiente';
    return 'Borrador';
  }

  estadoGuiaClass(estado?: string): string {
    const label = this.estadoGuiaLabel(estado);
    const classes: Record<string, string> = {
      Aceptado: 'bg-emerald-100 text-emerald-700',
      Pendiente: 'bg-amber-100 text-amber-700',
      Rechazado: 'bg-red-100 text-red-600',
      Borrador: 'bg-slate-100 text-slate-600'
    };

    return classes[label];
  }

  puedeConvertirAEnvio(guia: GuiaRemisionApi): boolean {
    return this.estadoGuiaLabel(guia.estado) === 'Borrador';
  }

  puedeEnviarSunat(guia: GuiaRemisionApi): boolean {
    return this.estadoGuiaLabel(guia.estado) === 'Pendiente';
  }

  private failLoad(message: string): void {
    this.error = message;
  }

  private getErrorMessage(error: any): string {
    if (!error) {
      return 'No se pudo guardar la guia de remision.';
    }
    if (typeof error === 'string') {
      return error;
    }
    return Object.values(error).join(' ');
  }
}
