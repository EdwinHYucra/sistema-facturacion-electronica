import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EMPTY, forkJoin, of } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import {
  LucideAngularModule,
  Search,
  RotateCcw,
  Save,
  Send,
  FileText,
  ArrowRight,
  Clock3,
  CheckCircle2,
  Plus,
  Minus,
  ExternalLink
} from 'lucide-angular';
import {
  ComprobanteApi,
  EmpresaApi,
  FacturacionApi,
  NotaCreditoDebitoApi,
  SerieComprobanteApi,
  TipoComprobanteApi,
  UsuarioApi
} from '../../core/api/facturacion-api';

type TipoNota = 'CREDITO' | 'DEBITO';

interface ItemAfectado {
  seleccionado: boolean;
  codigo: string;
  descripcion: string;
  cantidadOriginal: string;
  cantidadAfectar: number;
  valorUnitario: number;
  subtotal: number;
}

interface HistorialNota {
  idComprobanteNota?: number;
  fecha: string;
  tipo: string;
  numero: string;
  motivo: string;
  monto: string;
  estadoSunat: 'Aceptado' | 'Pendiente' | 'Rechazado';
}

@Component({
  selector: 'app-notas',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './notas.html',
  styleUrl: './notas.css'
})
export class Notas implements OnInit {
  private readonly api = inject(FacturacionApi);

  icons = {
    Search,
    RotateCcw,
    Save,
    Send,
    FileText,
    ArrowRight,
    Clock3,
    CheckCircle2,
    Plus,
    Minus,
    ExternalLink
  };

  comprobantes: ComprobanteApi[] = [];
  notas: NotaCreditoDebitoApi[] = [];
  usuarios: UsuarioApi[] = [];
  series: SerieComprobanteApi[] = [];
  tiposComprobante: TipoComprobanteApi[] = [];
  comprobanteOriginal?: ComprobanteApi;
  itemsAfectados: ItemAfectado[] = [];
  historial: HistorialNota[] = [];

  cargando = false;
  guardando = false;
  enviandoNotaId?: number;
  mensaje = '';
  error = '';

  busqueda = '';
  tipoNota: TipoNota = 'CREDITO';
  motivo = '07 - Devolucion por item';
  descripcion = 'Ajuste documentario generado desde el prototipo academico.';

  ngOnInit(): void {
    this.cargarDatos();
  }

  get tipoComprobanteNota(): TipoComprobanteApi | undefined {
    const codigo = this.tipoNota === 'CREDITO' ? '07' : '08';
    return this.tiposComprobante.find(tipo => tipo.codigoSunat === codigo);
  }

  get serieNota(): SerieComprobanteApi | undefined {
    const idTipo = this.tipoComprobanteNota?.idTipoComprobante;
    return this.series.find(serie => serie.tipoComprobante?.idTipoComprobante === idTipo);
  }

  get correlativoNota(): number {
    return (this.serieNota?.correlativoActual || 0) + 1;
  }

  get subtotalNota(): number {
    return this.itemsAfectados
      .filter(item => item.seleccionado)
      .reduce((total, item) => total + item.subtotal, 0);
  }

  get igvNota(): number {
    return Number((this.subtotalNota * 0.18).toFixed(2));
  }

  get totalNota(): number {
    return Number((this.subtotalNota + this.igvNota).toFixed(2));
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';

    forkJoin({
      comprobantes: this.api.getComprobantes(),
      tipos: this.api.getTiposComprobante(),
      series: this.api.getSeriesComprobante(),
      usuarios: this.api.getUsuarios(),
      notas: this.api.getNotasCreditoDebito()
    })
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: ({ comprobantes, tipos, series, usuarios, notas }) => {
          this.comprobantes = comprobantes;
          this.tiposComprobante = tipos;
          this.series = series;
          this.usuarios = usuarios;
          this.setHistorial(notas);
        },
        error: () => this.failLoad('No se pudieron cargar los datos para notas.')
      });
  }

  cargarHistorial(): void {
    this.api.getNotasCreditoDebito().subscribe({
      next: notas => this.setHistorial(notas),
      error: () => (this.historial = [])
    });
  }

  buscarDocumento(): void {
    const texto = this.busqueda.trim().toUpperCase();
    const comprobante = this.comprobantes.find(item =>
      `${item.serie}-${item.correlativo}`.toUpperCase() === texto ||
      `${item.serie}-${String(item.correlativo).padStart(8, '0')}`.toUpperCase() === texto ||
      item.cliente?.numeroDocumento === this.busqueda.trim()
    );

    if (!comprobante) {
      this.error = 'No se encontro el comprobante original.';
      return;
    }

    this.comprobanteOriginal = comprobante;
    this.itemsAfectados = [
      {
        seleccionado: true,
        codigo: comprobante.serie,
        descripcion: `Afectacion del comprobante ${comprobante.serie}-${comprobante.correlativo}`,
        cantidadOriginal: '1 DOC',
        cantidadAfectar: 1,
        valorUnitario: comprobante.subtotal || comprobante.total || 0,
        subtotal: comprobante.subtotal || comprobante.total || 0
      }
    ];
    this.error = '';
  }

  seleccionarComprobante(id?: number): void {
    const comprobante = this.comprobantes.find(item => item.idComprobante === id);
    if (!comprobante) return;

    this.busqueda = `${comprobante.serie}-${comprobante.correlativo}`;
    this.comprobanteOriginal = comprobante;
    this.buscarDocumento();
  }

  setTipoNota(tipo: TipoNota): void {
    this.tipoNota = tipo;
  }

  recalcularItem(item: ItemAfectado): void {
    item.subtotal = item.seleccionado ? Number((item.cantidadAfectar * item.valorUnitario).toFixed(2)) : 0;
  }

  restaurarOriginales(): void {
    if (this.comprobanteOriginal) this.buscarDocumento();
  }

  generarNota(enviarSunat: boolean): void {
    this.error = '';
    this.mensaje = '';

    if (!this.comprobanteOriginal?.idComprobante) {
      this.error = 'Seleccione un comprobante original.';
      return;
    }
    if (!this.tipoComprobanteNota || !this.serieNota) {
      this.error = 'Debe existir una serie configurada para nota de credito o debito.';
      return;
    }
    if (this.totalNota <= 0) {
      this.error = 'Seleccione al menos un item afectado.';
      return;
    }

    const usuario = this.usuarios[0];
    if (!usuario?.idUsuario) {
      this.error = 'No hay usuario disponible para emitir la nota.';
      return;
    }

    this.guardando = true;

    const comprobanteNota: ComprobanteApi = {
      empresa: { idEmpresa: this.comprobanteOriginal.empresa?.idEmpresa } as EmpresaApi,
      cliente: { idCliente: this.comprobanteOriginal.cliente?.idCliente } as any,
      usuario: { idUsuario: usuario.idUsuario } as UsuarioApi,
      tipoComprobante: { idTipoComprobante: this.tipoComprobanteNota.idTipoComprobante } as TipoComprobanteApi,
      serieComprobante: { idSerie: this.serieNota.idSerie } as SerieComprobanteApi,
      serie: this.serieNota.serie,
      correlativo: this.correlativoNota,
      fechaEmision: `${new Date().toISOString().slice(0, 10)}T00:00:00`,
      moneda: this.comprobanteOriginal.moneda || 'PEN',
      subtotal: Number(this.subtotalNota.toFixed(2)),
      descuentoTotal: 0,
      igv: this.igvNota,
      total: this.totalNota,
      estado: 'PENDIENTE',
      observacion: this.descripcion
    };

    this.api.createComprobante(comprobanteNota)
      .pipe(
        switchMap(creado =>
          this.api.createNotaCreditoDebito({
            comprobanteReferencia: { idComprobante: this.comprobanteOriginal?.idComprobante } as ComprobanteApi,
            comprobanteNota: { idComprobante: creado.idComprobante } as ComprobanteApi,
            tipoNota: this.tipoNota,
            motivo: this.motivo,
            descripcion: this.descripcion,
            fechaEmision: `${new Date().toISOString().slice(0, 10)}T00:00:00`,
            estado: 'REGISTRADA'
          }).pipe(switchMap(() => of(creado)))
        ),
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
        next: () => {
          this.mensaje = enviarSunat
            ? 'Nota generada y enviada a SUNAT simulado.'
            : 'Nota generada correctamente.';
          this.cargarDatos();
        }
      });
  }

  enviarNotaSunat(item: HistorialNota): void {
    if (!item.idComprobanteNota || item.estadoSunat !== 'Pendiente' || this.enviandoNotaId) {
      return;
    }

    this.enviandoNotaId = item.idComprobanteNota;
    this.mensaje = '';
    this.error = '';

    this.api.enviarSunatSimulado(item.idComprobanteNota).subscribe({
      next: () => {
        this.mensaje = `Nota ${item.numero} enviada y aceptada por SUNAT simulada.`;
        this.enviandoNotaId = undefined;
        this.cargarDatos();
      },
      error: response => {
        this.error = this.getErrorMessage(response.error);
        this.enviandoNotaId = undefined;
      }
    });
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  }

  getEstadoClass(estado: HistorialNota['estadoSunat']): string {
    const classes = {
      Aceptado: 'bg-emerald-100 text-emerald-700',
      Pendiente: 'bg-amber-100 text-amber-700',
      Rechazado: 'bg-red-100 text-red-600'
    };

    return classes[estado];
  }

  private failLoad(message: string): void {
    this.error = message;
  }

  private setHistorial(notas: NotaCreditoDebitoApi[]): void {
    this.notas = notas;
    this.historial = notas.map(nota => ({
      idComprobanteNota: nota.comprobanteNota?.idComprobante,
      fecha: nota.fechaEmision?.slice(0, 10) || '-',
      tipo: nota.tipoNota === 'CREDITO' ? 'Nota de Credito' : 'Nota de Debito',
      numero: `${nota.comprobanteNota?.serie || '-'}-${nota.comprobanteNota?.correlativo || '-'}`,
      motivo: nota.motivo,
      monto: `PEN ${this.formatMoney(nota.comprobanteNota?.total || 0)}`,
      estadoSunat: this.toEstadoSunat(nota.comprobanteNota?.estado || nota.estado)
    }));
  }

  private toEstadoSunat(estado?: string): HistorialNota['estadoSunat'] {
    const normalized = estado?.toUpperCase();
    if (normalized === 'ACEPTADO') return 'Aceptado';
    if (normalized === 'RECHAZADO') return 'Rechazado';
    return 'Pendiente';
  }

  private getErrorMessage(error: any): string {
    if (!error) return 'No se pudo generar la nota.';
    if (typeof error === 'string') return error;
    return Object.values(error).join(' ');
  }
}
