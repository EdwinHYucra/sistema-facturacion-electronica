import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ComprobanteApi, FacturacionApi, GuiaRemisionApi } from '../../core/api/facturacion-api';
import {
  LucideAngularModule,
  FileText,
  CheckCircle2,
  Clock3,
  XCircle,
  CircleDollarSign,
  Plus,
  UserPlus,
  Truck,
  Search,
  ArrowRight,
  Eye,
  Download
} from 'lucide-angular';

interface MetricCard {
  title: string;
  value: string;
  description: string;
  icon: any;
  iconClass: string;
}

interface DocumentItem {
  id?: number;
  tipo: string;
  serie: string;
  cliente: string;
  ruc: string;
  fecha: string;
  total: string;
  estado: 'Aceptado' | 'Pendiente' | 'Rechazado' | 'Borrador';
  ruta: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  private readonly api = inject(FacturacionApi);

  icons = {
    Plus,
    UserPlus,
    Truck,
    Search,
    ArrowRight,
    Eye,
    Download
  };

  metricCards: MetricCard[] = [
    {
      title: 'Comprobantes Emitidos',
      value: '0',
      description: 'Documentos registrados',
      icon: FileText,
      iconClass: 'text-blue-600'
    },
    {
      title: 'Aceptados',
      value: '0',
      description: 'Comprobantes aceptados por SUNAT',
      icon: CheckCircle2,
      iconClass: 'text-emerald-700'
    },
    {
      title: 'Pendientes',
      value: '0',
      description: 'Requieren atención',
      icon: Clock3,
      iconClass: 'text-amber-600'
    },
    {
      title: 'Rechazados',
      value: '0',
      description: 'Comprobantes con rechazo',
      icon: XCircle,
      iconClass: 'text-red-500'
    },
    {
      title: 'Total Facturado',
      value: 'S/ 0.00',
      description: 'Importe acumulado',
      icon: CircleDollarSign,
      iconClass: 'text-amber-500'
    }
  ];

  documents: DocumentItem[] = [];
  aceptados = 0;
  pendientes = 0;
  rechazados = 0;
  borradores = 0;
  totalDocumentos = 0;
  tasaAceptacion = '0.0';
  distributionStyle = 'background: conic-gradient(#e2e8f0 0deg 360deg);';

  ngOnInit(): void {
    forkJoin({
      resumen: this.api.getDashboardResumen(),
      comprobantes: this.api.getComprobantes(),
      guias: this.api.getGuiasRemision()
    }).subscribe({
      next: ({ resumen, comprobantes, guias }) => {
        this.metricCards = [
          {
            title: 'Comprobantes Emitidos',
            value: this.formatNumber(resumen.comprobantesEmitidos),
            description: 'Documentos registrados',
            icon: FileText,
            iconClass: 'text-blue-600'
          },
          {
            title: 'Aceptados',
            value: this.formatNumber(resumen.aceptados),
            description: 'Comprobantes aceptados por SUNAT',
            icon: CheckCircle2,
            iconClass: 'text-emerald-700'
          },
          {
            title: 'Pendientes',
            value: this.formatNumber(resumen.pendientes),
            description: 'Requieren atención',
            icon: Clock3,
            iconClass: 'text-amber-600'
          },
          {
            title: 'Rechazados',
            value: this.formatNumber(resumen.rechazados),
            description: 'Comprobantes con rechazo',
            icon: XCircle,
            iconClass: 'text-red-500'
          },
          {
            title: 'Total Facturado',
            value: `S/ ${this.formatMoney(resumen.totalFacturado)}`,
            description: 'Importe acumulado',
            icon: CircleDollarSign,
            iconClass: 'text-amber-500'
          }
        ];

        const documentos = [
          ...comprobantes.map(comprobante => this.fromComprobante(comprobante)),
          ...guias.map(guia => this.fromGuia(guia))
        ].sort((a, b) => b.fecha.localeCompare(a.fecha));

        this.documents = documentos.slice(0, 6);
        this.actualizarDistribucion(documentos);
      },
      error: () => {}
    });
  }

  getStatusClass(status: DocumentItem['estado']): string {
    const classes = {
      Aceptado: 'bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full',
      Pendiente: 'bg-amber-100 text-amber-700 px-3 py-1 rounded-full',
      Rechazado: 'bg-red-100 text-red-500 px-3 py-1 rounded-full',
      Borrador: 'bg-slate-100 text-slate-600 px-3 py-1 rounded-full'
    };

    return classes[status];
  }

  private fromComprobante(comprobante: ComprobanteApi): DocumentItem {
    return {
      id: comprobante.idComprobante,
      tipo: comprobante.tipoComprobante?.nombre || 'Comprobante',
      serie: `${comprobante.serie}-${String(comprobante.correlativo).padStart(8, '0')}`,
      cliente: comprobante.cliente?.razonSocial || '-',
      ruc: comprobante.cliente?.numeroDocumento || '-',
      fecha: comprobante.fechaEmision?.slice(0, 10) || '-',
      total: `${comprobante.moneda === 'USD' ? 'USD' : 'S/'} ${this.formatMoney(comprobante.total)}`,
      estado: this.toEstado(comprobante.estado),
      ruta: comprobante.idComprobante ? `/comprobantes/${comprobante.idComprobante}` : '/comprobantes'
    };
  }

  private fromGuia(guia: GuiaRemisionApi): DocumentItem {
    return {
      id: guia.idGuia,
      tipo: 'Guía de remisión',
      serie: `${guia.serie}-${String(guia.correlativo).padStart(8, '0')}`,
      cliente: guia.cliente?.razonSocial || '-',
      ruc: guia.cliente?.numeroDocumento || '-',
      fecha: guia.fechaEmision.slice(0, 10),
      total: '-',
      estado: this.toEstado(guia.estado),
      ruta: '/guias-remision'
    };
  }

  private actualizarDistribucion(documentos: DocumentItem[]): void {
    this.aceptados = documentos.filter(documento => documento.estado === 'Aceptado').length;
    this.pendientes = documentos.filter(documento => documento.estado === 'Pendiente').length;
    this.rechazados = documentos.filter(documento => documento.estado === 'Rechazado').length;
    this.borradores = documentos.filter(documento => documento.estado === 'Borrador').length;
    this.totalDocumentos = documentos.length;

    if (this.totalDocumentos === 0) {
      this.tasaAceptacion = '0.0';
      this.distributionStyle = 'background: conic-gradient(#e2e8f0 0deg 360deg);';
      return;
    }

    const aceptadoDeg = (this.aceptados / this.totalDocumentos) * 360;
    const pendienteDeg = aceptadoDeg + (this.pendientes / this.totalDocumentos) * 360;
    const rechazadoDeg = pendienteDeg + (this.rechazados / this.totalDocumentos) * 360;

    this.tasaAceptacion = ((this.aceptados / this.totalDocumentos) * 100).toFixed(1);
    this.distributionStyle = `background: conic-gradient(#16a34a 0deg ${aceptadoDeg}deg, #f59e0b ${aceptadoDeg}deg ${pendienteDeg}deg, #ef4444 ${pendienteDeg}deg ${rechazadoDeg}deg, #64748b ${rechazadoDeg}deg 360deg);`;
  }

  private toEstado(estado: string): DocumentItem['estado'] {
    const normalized = estado?.toUpperCase();
    if (normalized === 'REGISTRADA') return 'Borrador';
    if (normalized === 'RECHAZADO') return 'Rechazado';
    if (normalized === 'PENDIENTE') return 'Pendiente';
    return 'Aceptado';
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('es-PE').format(value || 0);
  }

  private formatMoney(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  }
}
