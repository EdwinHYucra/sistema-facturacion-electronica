import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ComprobanteApi,
  DetalleComprobanteApi,
  FacturacionApi,
  RespuestaSunatApi
} from '../../../../core/api/facturacion-api';
import {
  LucideAngularModule,
  ArrowLeft,
  FileText,
  Download,
  ReceiptText,
  ClipboardCheck,
  Send,
  Building2,
  Clock3,
  CalendarDays,
  CreditCard,
  Banknote,
  Server,
  ExternalLink
} from 'lucide-angular';

@Component({
  selector: 'app-comprobante-detail',
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './comprobante-detail.html',
  styleUrl: './comprobante-detail.css'
})
export class ComprobanteDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(FacturacionApi);

  icons = {
    ArrowLeft,
    FileText,
    Download,
    ReceiptText,
    ClipboardCheck,
    Send,
    Building2,
    Clock3,
    CalendarDays,
    CreditCard,
    Banknote,
    Server,
    ExternalLink
  };

  comprobante?: ComprobanteApi;
  detalles: DetalleComprobanteApi[] = [];
  respuesta?: RespuestaSunatApi;
  loading = true;
  error = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.error = 'No se encontro el comprobante solicitado.';
      this.loading = false;
      return;
    }

    this.api.getComprobante(id).subscribe({
      next: comprobante => {
        this.comprobante = comprobante;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el comprobante.';
        this.loading = false;
      }
    });

    this.api.getDetallesComprobante(id).subscribe({
      next: detalles => {
        this.detalles = detalles;
      },
      error: () => {
        this.detalles = [];
      }
    });

    this.api.getRespuestasSunat().subscribe({
      next: respuestas => {
        this.respuesta = respuestas.find(item => item.comprobante?.idComprobante === id);
      },
      error: () => {
        this.respuesta = undefined;
      }
    });
  }

  get serieCorrelativo(): string {
    if (!this.comprobante) return '-';
    return `${this.comprobante.serie}-${String(this.comprobante.correlativo).padStart(8, '0')}`;
  }

  get tituloComprobante(): string {
    const tipo = this.comprobante?.tipoComprobante?.nombre || 'Comprobante';
    return `${tipo} ${this.serieCorrelativo}`;
  }

  get simboloMoneda(): string {
    return this.comprobante?.moneda === 'USD' ? 'USD' : 'S/';
  }

  formatMoney(value?: number): string {
    const amount = Number(value || 0);
    return `${this.simboloMoneda} ${new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)}`;
  }

  formatDiscount(value?: number): string {
    const amount = Number(value || 0);
    return amount > 0 ? `- ${this.formatMoney(amount)}` : this.formatMoney(0);
  }

  formatDate(value?: string): string {
    if (!value) return '-';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(value));
  }

  formatDateTime(value?: string): string {
    if (!value) return '-';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }

  estadoLabel(): string {
    const estado = this.comprobante?.estado || 'PENDIENTE';
    if (estado === 'ACEPTADO') return 'Aceptado SUNAT';
    if (estado === 'RECHAZADO') return 'Rechazado SUNAT';
    if (estado === 'OBSERVADO') return 'Observado SUNAT';
    if (estado === 'ANULADO') return 'Anulado';
    return 'Pendiente SUNAT';
  }

  estadoClass(): string {
    const estado = this.comprobante?.estado || 'PENDIENTE';
    if (estado === 'ACEPTADO') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    if (estado === 'RECHAZADO') return 'border-red-200 bg-red-50 text-red-600';
    if (estado === 'OBSERVADO') return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-slate-300 bg-white text-slate-800';
  }
}
