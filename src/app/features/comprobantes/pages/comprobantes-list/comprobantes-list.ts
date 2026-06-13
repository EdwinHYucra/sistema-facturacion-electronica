import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FacturacionApi } from '../../../../core/api/facturacion-api';
import {
  LucideAngularModule,
  Plus,
  Search,
  Filter,
  Download,
  FileText,
  Calendar,
  MoreVertical,
  X,
  Eye,
  Send
} from 'lucide-angular';

type EstadoSunat = 'Aceptado' | 'Pendiente' | 'Observado' | 'Rechazado';

interface Comprobante {
  idComprobante?: number;
  fecha: string;
  tipo: string;
  serieCorrelativo: string;
  cliente: string;
  documentoCliente: string;
  total: string;
  estadoSunat: EstadoSunat;
}

@Component({
  selector: 'app-comprobantes-list',
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './comprobantes-list.html',
  styleUrl: './comprobantes-list.css'
})
export class ComprobantesList {
  private readonly api = inject(FacturacionApi);

  icons = {
    Plus,
    Search,
    Filter,
    Download,
    FileText,
    Calendar,
    MoreVertical,
    X,
    Eye,
    Send
  };

  enviandoId?: number;
  mensaje = '';
  error = '';

  filters = {
    fechaDesde: '',
    fechaHasta: '',
    tipo: 'Todos',
    cliente: '',
    estado: 'Todos',
    serie: '',
    correlativo: ''
  };

  comprobantes: Comprobante[] = [
    {
      idComprobante: 1,
      fecha: '2024-05-20',
      tipo: 'Factura',
      serieCorrelativo: 'F001-0004592',
      cliente: 'Minera Yanacocha S.R.L.',
      documentoCliente: '20137049221',
      total: 'USD 45,000.00',
      estadoSunat: 'Aceptado'
    },
    {
      idComprobante: 2,
      fecha: '2024-05-20',
      tipo: 'Factura',
      serieCorrelativo: 'F001-0004593',
      cliente: 'Constructora Graña y Montero S.A.A.',
      documentoCliente: '20100054521',
      total: 'S/ 12,500.50',
      estadoSunat: 'Aceptado'
    },
    {
      idComprobante: 3,
      fecha: '2024-05-19',
      tipo: 'Boleta',
      serieCorrelativo: 'B001-0001024',
      cliente: 'Juan Pérez',
      documentoCliente: '45678912',
      total: 'S/ 350.00',
      estadoSunat: 'Pendiente'
    },
    {
      idComprobante: 4,
      fecha: '2024-05-18',
      tipo: 'Factura',
      serieCorrelativo: 'F002-0000845',
      cliente: 'Transportes Cruz del Sur',
      documentoCliente: '20100234567',
      total: 'S/ 8,400.00',
      estadoSunat: 'Observado'
    },
    {
      idComprobante: 5,
      fecha: '2024-05-18',
      tipo: 'Nota de Crédito',
      serieCorrelativo: 'FC01-0000120',
      cliente: 'Minera Yanacocha S.R.L.',
      documentoCliente: '20137049221',
      total: '-USD 1,500.00',
      estadoSunat: 'Aceptado'
    },
    {
      idComprobante: 6,
      fecha: '2024-05-17',
      tipo: 'Factura',
      serieCorrelativo: 'F001-0004590',
      cliente: 'Aceros Arequipa S.A.',
      documentoCliente: '20100123456',
      total: 'S/ 24,500.00',
      estadoSunat: 'Rechazado'
    },
    {
      idComprobante: 7,
      fecha: '2024-05-16',
      tipo: 'Boleta',
      serieCorrelativo: 'B001-0001023',
      cliente: 'María López',
      documentoCliente: '76543210',
      total: 'S/ 120.00',
      estadoSunat: 'Aceptado'
    }
  ];

  ngOnInit(): void {
    this.cargarComprobantes();
  }

  cargarComprobantes(): void {
    this.error = '';
    this.api.getComprobantes().subscribe({
      next: comprobantes => {
        if (comprobantes.length > 0) {
          this.comprobantes = comprobantes.map(comprobante => ({
            idComprobante: comprobante.idComprobante,
            fecha: comprobante.fechaEmision?.slice(0, 10) || '-',
            tipo: comprobante.tipoComprobante?.nombre || 'Comprobante',
            serieCorrelativo: `${comprobante.serie}-${String(comprobante.correlativo).padStart(8, '0')}`,
            cliente: comprobante.cliente?.razonSocial || '-',
            documentoCliente: comprobante.cliente?.numeroDocumento || '-',
            total: `${comprobante.moneda === 'USD' ? 'USD' : 'S/'} ${new Intl.NumberFormat('es-PE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }).format(comprobante.total)}`,
            estadoSunat: this.toEstado(comprobante.estado)
          }));
        }
      },
      error: () => {
        this.error = 'No se pudieron cargar los comprobantes. Verifique que el backend este activo.';
      }
    });
  }

  enviarSunat(item: Comprobante): void {
    if (!item.idComprobante || item.estadoSunat !== 'Pendiente' || this.enviandoId) {
      return;
    }

    this.enviandoId = item.idComprobante;
    this.mensaje = '';
    this.error = '';

    this.api.enviarSunatSimulado(item.idComprobante).subscribe({
      next: () => {
        this.mensaje = `Comprobante ${item.serieCorrelativo} enviado y aceptado por SUNAT simulada.`;
        this.enviandoId = undefined;
        this.cargarComprobantes();
      },
      error: response => {
        this.error = this.getErrorMessage(response.error);
        this.enviandoId = undefined;
      }
    });
  }

  get filteredComprobantes(): Comprobante[] {
    return this.comprobantes.filter(item => {
      const seriePart = item.serieCorrelativo.split('-')[0] || '';
      const correlativoPart = item.serieCorrelativo.split('-')[1] || '';
      const clienteNeedle = this.filters.cliente.trim().toLowerCase();

      const matchesFechaDesde = !this.filters.fechaDesde || item.fecha >= this.filters.fechaDesde;
      const matchesFechaHasta = !this.filters.fechaHasta || item.fecha <= this.filters.fechaHasta;
      const matchesTipo = this.filters.tipo === 'Todos' || item.tipo === this.filters.tipo;
      const matchesEstado = this.filters.estado === 'Todos' || item.estadoSunat === this.filters.estado;
      const matchesCliente =
        !clienteNeedle ||
        item.cliente.toLowerCase().includes(clienteNeedle) ||
        item.documentoCliente.toLowerCase().includes(clienteNeedle);
      const matchesSerie = !this.filters.serie || seriePart.toLowerCase().includes(this.filters.serie.toLowerCase());
      const matchesCorrelativo =
        !this.filters.correlativo || correlativoPart.toLowerCase().includes(this.filters.correlativo.toLowerCase());

      return (
        matchesFechaDesde &&
        matchesFechaHasta &&
        matchesTipo &&
        matchesEstado &&
        matchesCliente &&
        matchesSerie &&
        matchesCorrelativo
      );
    });
  }

  clearFilters(): void {
    this.filters = {
      fechaDesde: '',
      fechaHasta: '',
      tipo: 'Todos',
      cliente: '',
      estado: 'Todos',
      serie: '',
      correlativo: ''
    };
  }

  private toEstado(estado: string): EstadoSunat {
    const normalized = estado?.toUpperCase();
    if (normalized === 'ACEPTADO') return 'Aceptado';
    if (normalized === 'OBSERVADO') return 'Observado';
    if (normalized === 'RECHAZADO') return 'Rechazado';
    return 'Pendiente';
  }

  getEstadoClass(estado: EstadoSunat): string {
    const classes = {
      Aceptado: 'text-slate-900',
      Pendiente: 'text-slate-900',
      Observado: 'text-slate-900',
      Rechazado: 'bg-red-100 text-red-500 px-3 py-1 rounded-full'
    };

    return classes[estado];
  }

  private getErrorMessage(error: any): string {
    if (!error) return 'No se pudo enviar el comprobante a SUNAT simulada.';
    if (typeof error === 'string') return error;
    return Object.values(error).join(' ');
  }
}
