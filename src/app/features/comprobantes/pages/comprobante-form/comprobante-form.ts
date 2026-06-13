import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, forkJoin, of } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import {
  LucideAngularModule,
  Search,
  Save,
  Send,
  Calendar,
  FileText,
  Building2,
  Trash2,
  Plus,
  Info,
  AlertCircle
} from 'lucide-angular';
import {
  ClienteApi,
  ComprobanteApi,
  EmpresaApi,
  FacturacionApi,
  ProductoServicioApi,
  SerieComprobanteApi,
  TipoComprobanteApi,
  UsuarioApi
} from '../../../../core/api/facturacion-api';

interface DetalleView {
  producto: ProductoServicioApi;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  valorVenta: number;
  igv: number;
  totalLinea: number;
}

@Component({
  selector: 'app-comprobante-form',
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './comprobante-form.html',
  styleUrl: './comprobante-form.css'
})
export class ComprobanteForm implements OnInit {
  private readonly api = inject(FacturacionApi);
  private readonly router = inject(Router);

  icons = {
    Search,
    Save,
    Send,
    Calendar,
    FileText,
    Building2,
    Trash2,
    Plus,
    Info,
    AlertCircle
  };

  empresas: EmpresaApi[] = [];
  usuarios: UsuarioApi[] = [];
  clientes: ClienteApi[] = [];
  productos: ProductoServicioApi[] = [];
  tiposComprobante: TipoComprobanteApi[] = [];
  series: SerieComprobanteApi[] = [];
  detalles: DetalleView[] = [];

  cargando = false;
  guardando = false;
  mensaje = '';
  error = '';

  idEmpresa?: number;
  idUsuario?: number;
  idCliente?: number;
  idTipoComprobante?: number;
  idSerie?: number;
  fechaEmision = new Date().toISOString().slice(0, 10);
  moneda = 'PEN';
  observacion = '';

  clienteDocumento = '';
  clienteSeleccionado?: ClienteApi;

  productoSeleccionadoId?: number;
  cantidad = 1;
  precioUnitario = 0;
  descuento = 0;

  ngOnInit(): void {
    this.cargarDatos();
  }

  get seriesFiltradas(): SerieComprobanteApi[] {
    if (!this.idTipoComprobante) {
      return this.series;
    }

    return this.series.filter(serie => serie.tipoComprobante?.idTipoComprobante === this.idTipoComprobante);
  }

  get subtotal(): number {
    return this.detalles.reduce((total, item) => total + item.valorVenta, 0);
  }

  get descuentoTotal(): number {
    return this.detalles.reduce((total, item) => total + item.descuento, 0);
  }

  get igv(): number {
    return this.detalles.reduce((total, item) => total + item.igv, 0);
  }

  get total(): number {
    return this.detalles.reduce((total, item) => total + item.totalLinea, 0);
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
      tipos: this.api.getTiposComprobante(),
      series: this.api.getSeriesComprobante()
    })
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: ({ empresas, usuarios, clientes, productos, tipos, series }) => {
        this.empresas = empresas;
        this.idEmpresa = empresas[0]?.idEmpresa;
        this.usuarios = usuarios;
        this.idUsuario = usuarios[0]?.idUsuario;
        this.clientes = clientes;
        this.productos = productos;
        this.tiposComprobante = tipos.filter(tipo => ['01', '03'].includes(tipo.codigoSunat));
        this.idTipoComprobante = this.tiposComprobante[0]?.idTipoComprobante;
        this.series = series;
        this.idSerie = this.seriesFiltradas[0]?.idSerie;
      },
      error: () => this.failLoad('No se pudieron cargar los datos del comprobante. Verifique que el backend este activo.')
    });
  }

  onTipoChange(): void {
    this.idSerie = this.seriesFiltradas[0]?.idSerie;
  }

  seleccionarCliente(): void {
    const cliente = this.clientes.find(item => item.idCliente === this.idCliente);
    this.clienteSeleccionado = cliente;
    this.clienteDocumento = cliente?.numeroDocumento || '';
  }

  consultarCliente(): void {
    const documento = this.clienteDocumento.trim();
    const cliente = this.clientes.find(item => item.numeroDocumento === documento);
    if (!cliente) {
      this.error = 'No se encontro un cliente con ese documento.';
      return;
    }

    this.idCliente = cliente.idCliente;
    this.clienteSeleccionado = cliente;
    this.error = '';
  }

  seleccionarProducto(): void {
    const producto = this.productos.find(item => item.idProductoServicio === this.productoSeleccionadoId);
    this.precioUnitario = producto?.precioUnitario || 0;
  }

  agregarDetalle(): void {
    const producto = this.productos.find(item => item.idProductoServicio === this.productoSeleccionadoId);
    if (!producto) {
      this.error = 'Seleccione un producto o servicio.';
      return;
    }
    if (this.cantidad <= 0 || this.precioUnitario < 0 || this.descuento < 0) {
      this.error = 'Revise cantidad, precio y descuento.';
      return;
    }

    const base = Math.max((this.cantidad * this.precioUnitario) - this.descuento, 0);
    const igv = Number((base * 0.18).toFixed(2));
    const totalLinea = Number((base + igv).toFixed(2));

    this.detalles.push({
      producto,
      cantidad: this.cantidad,
      precioUnitario: this.precioUnitario,
      descuento: this.descuento,
      valorVenta: Number(base.toFixed(2)),
      igv,
      totalLinea
    });

    this.productoSeleccionadoId = undefined;
    this.cantidad = 1;
    this.precioUnitario = 0;
    this.descuento = 0;
    this.error = '';
  }

  quitarDetalle(index: number): void {
    this.detalles.splice(index, 1);
  }

  guardarBorrador(): void {
    this.guardar(false);
  }

  generarEnviarSunat(): void {
    this.guardar(true);
  }

  guardar(enviarSunat: boolean): void {
    this.error = '';
    this.mensaje = '';

    if (!this.idEmpresa || !this.idUsuario || !this.idCliente || !this.idTipoComprobante || !this.idSerie) {
      this.error = 'Complete empresa, usuario, cliente, tipo y serie.';
      return;
    }
    if (this.detalles.length === 0) {
      this.error = 'Agregue al menos una linea de detalle.';
      return;
    }

    this.guardando = true;
    const comprobante: ComprobanteApi = {
      empresa: { idEmpresa: this.idEmpresa } as EmpresaApi,
      usuario: { idUsuario: this.idUsuario } as UsuarioApi,
      cliente: { idCliente: this.idCliente } as ClienteApi,
      tipoComprobante: { idTipoComprobante: this.idTipoComprobante } as TipoComprobanteApi,
      serieComprobante: { idSerie: this.idSerie } as SerieComprobanteApi,
      serie: this.serieSeleccionada?.serie || '',
      correlativo: this.correlativoSiguiente,
      fechaEmision: `${this.fechaEmision}T00:00:00`,
      moneda: this.moneda,
      subtotal: Number(this.subtotal.toFixed(2)),
      descuentoTotal: Number(this.descuentoTotal.toFixed(2)),
      igv: Number(this.igv.toFixed(2)),
      total: Number(this.total.toFixed(2)),
      estado: 'PENDIENTE',
      observacion: this.observacion
    };

    this.api.createComprobante(comprobante)
      .pipe(
        switchMap(creado => {
          const detalleRequests = this.detalles.map(detalle =>
            this.api.createDetalleComprobante({
              comprobante: { idComprobante: creado.idComprobante } as ComprobanteApi,
              productoServicio: { idProductoServicio: detalle.producto.idProductoServicio } as ProductoServicioApi,
              cantidad: detalle.cantidad,
              precioUnitario: detalle.precioUnitario,
              descuento: detalle.descuento,
              valorVenta: detalle.valorVenta,
              igv: detalle.igv,
              totalLinea: detalle.totalLinea
            })
          );

          return forkJoin(detalleRequests).pipe(switchMap(() => of(creado)));
        }),
        switchMap(creado =>
          enviarSunat && creado.idComprobante
            ? this.api.enviarSunatSimulado(creado.idComprobante).pipe(switchMap(() => of(creado)))
            : of(creado)
        ),
        catchError(response => {
          this.error = this.getErrorMessage(response.error);
          return EMPTY;
        }),
        finalize(() => {
          this.guardando = false;
        })
      )
      .subscribe({
        next: () => this.router.navigate(['/comprobantes'])
      });
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  }

  private failLoad(message: string): void {
    this.error = message;
  }

  private getErrorMessage(error: any): string {
    if (!error) {
      return 'No se pudo guardar el comprobante.';
    }
    if (typeof error === 'string') {
      return error;
    }
    return Object.values(error).join(' ');
  }
}
