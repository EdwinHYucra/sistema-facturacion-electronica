import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ComprobanteApi,
  FacturacionApi,
  RespuestaSunatApi
} from '../../../../core/api/facturacion-api';
import {
  LucideAngularModule,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Send,
  XCircle
} from 'lucide-angular';

interface TrackingEvent {
  titulo: string;
  descripcion: string;
  fecha: string;
  usuario: string;
  icon: any;
  done: boolean;
}

@Component({
  selector: 'app-comprobante-tracking',
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './comprobante-tracking.html',
  styleUrl: './comprobante-tracking.css'
})
export class ComprobanteTracking implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(FacturacionApi);

  icons = {
    ArrowLeft,
    Eye,
    Download,
    FileText
  };

  comprobante?: ComprobanteApi;
  respuesta?: RespuestaSunatApi;
  events: TrackingEvent[] = [];
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
        this.rebuildEvents();
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el seguimiento.';
        this.loading = false;
      }
    });

    this.api.getRespuestasSunat().subscribe({
      next: respuestas => {
        this.respuesta = respuestas.find(item => item.comprobante?.idComprobante === id);
        this.rebuildEvents();
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

  get estadoLabel(): string {
    const estado = this.comprobante?.estado || 'PENDIENTE';
    if (estado === 'ACEPTADO') return 'Aceptado';
    if (estado === 'RECHAZADO') return 'Rechazado';
    if (estado === 'OBSERVADO') return 'Observado';
    if (estado === 'ANULADO') return 'Anulado';
    return 'Pendiente';
  }

  get estadoBadgeClass(): string {
    const estado = this.comprobante?.estado || 'PENDIENTE';
    if (estado === 'ACEPTADO') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    if (estado === 'RECHAZADO') return 'border-red-200 bg-red-50 text-red-600';
    if (estado === 'OBSERVADO') return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-slate-200 bg-slate-50 text-slate-600';
  }

  formatMoney(value?: number): string {
    const symbol = this.comprobante?.moneda === 'USD' ? 'USD' : 'S/';
    return `${symbol} ${new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value || 0))}`;
  }

  formatDate(value?: string): string {
    if (!value) return '-';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));
  }

  formatDateTime(value?: string): string {
    if (!value) return '-';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }

  private rebuildEvents(): void {
    if (!this.comprobante) return;

    const enviado = Boolean(this.respuesta?.fechaEnvio);
    const respondido = Boolean(this.respuesta?.fechaRespuesta);
    const aceptado = this.comprobante.estado === 'ACEPTADO';
    const rechazado = this.comprobante.estado === 'RECHAZADO';

    this.events = [
      {
        titulo: 'Creado',
        descripcion: 'El comprobante fue registrado en el sistema.',
        fecha: this.formatDateTime(this.comprobante.fechaEmision),
        usuario: this.comprobante.usuario
          ? `${this.comprobante.usuario.nombres} ${this.comprobante.usuario.apellidos}`
          : 'Sistema',
        icon: FileText,
        done: true
      },
      {
        titulo: 'Generado XML',
        descripcion: enviado ? 'Archivo XML generado correctamente con firma digital simulada.' : 'Pendiente de generacion XML.',
        fecha: this.formatDateTime(this.respuesta?.fechaEnvio),
        usuario: 'Sistema',
        icon: FileCheck2,
        done: enviado
      },
      {
        titulo: 'Enviado a SUNAT',
        descripcion: enviado ? 'Documento enviado al servicio SUNAT simulado.' : 'Aun no fue enviado a SUNAT.',
        fecha: this.formatDateTime(this.respuesta?.fechaEnvio),
        usuario: 'Sistema',
        icon: Send,
        done: enviado
      },
      {
        titulo: rechazado ? 'Respuesta SUNAT - Rechazado' : aceptado ? 'Respuesta SUNAT - Aceptado' : 'Respuesta SUNAT',
        descripcion: this.respuesta?.descripcionRespuesta || 'Pendiente de respuesta SUNAT.',
        fecha: this.formatDateTime(this.respuesta?.fechaRespuesta),
        usuario: 'SUNAT',
        icon: rechazado ? XCircle : CheckCircle2,
        done: respondido
      },
      {
        titulo: 'CDR Recibido',
        descripcion: respondido ? 'Constancia de recepcion CDR registrada.' : 'Pendiente de constancia CDR.',
        fecha: this.formatDateTime(this.respuesta?.fechaRespuesta),
        usuario: 'Sistema',
        icon: Download,
        done: respondido && !rechazado
      },
      {
        titulo: 'Enviado al cliente',
        descripcion: aceptado ? `Correo electronico preparado para ${this.comprobante.cliente?.correo || 'el cliente'}.` : 'Disponible cuando el comprobante sea aceptado.',
        fecha: aceptado ? this.formatDateTime(this.respuesta?.fechaRespuesta) : '-',
        usuario: 'Sistema',
        icon: Clock3,
        done: aceptado
      }
    ];
  }
}
