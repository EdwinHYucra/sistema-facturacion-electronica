import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FacturacionApi } from '../../core/api/facturacion-api';
import {
  LucideAngularModule,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock3,
  Search,
  Filter,
  Eye,
  Route
} from 'lucide-angular';

type EstadoSunat = 'Aceptado' | 'Observado' | 'Rechazado' | 'Pendiente';

interface ResumenSunat {
  titulo: string;
  valor: string;
  estado: EstadoSunat;
  icon: any;
  iconClass: string;
  bgClass: string;
}

interface RegistroSunat {
  idComprobante?: number;
  documento: string;
  tipo: string;
  cliente: string;
  documentoCliente: string;
  fechaEnvio: string;
  estado: EstadoSunat;
  codigoRespuesta: string;
  descripcion: string;
}

@Component({
  selector: 'app-sunat-cdr',
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './sunat-cdr.html',
  styleUrl: './sunat-cdr.css'
})
export class SunatCdr implements OnInit {
  private readonly api = inject(FacturacionApi);

  icons = {
    Search,
    Filter,
    Eye,
    Route
  };

  filters = {
    busqueda: '',
    fecha: '',
    tipo: 'Todos',
    estado: 'Todos'
  };

  resumen: ResumenSunat[] = [
    {
      titulo: 'Aceptados',
      valor: '0',
      estado: 'Aceptado',
      icon: CheckCircle2,
      iconClass: 'text-emerald-700',
      bgClass: 'bg-emerald-100'
    },
    {
      titulo: 'Observados',
      valor: '0',
      estado: 'Observado',
      icon: AlertCircle,
      iconClass: 'text-amber-700',
      bgClass: 'bg-amber-100'
    },
    {
      titulo: 'Rechazados',
      valor: '0',
      estado: 'Rechazado',
      icon: XCircle,
      iconClass: 'text-red-700',
      bgClass: 'bg-red-100'
    },
    {
      titulo: 'Pendientes',
      valor: '0',
      estado: 'Pendiente',
      icon: Clock3,
      iconClass: 'text-slate-600',
      bgClass: 'bg-slate-100'
    }
  ];

  registros: RegistroSunat[] = [];

  ngOnInit(): void {
    this.api.getRespuestasSunat().subscribe({
      next: respuestas => {
        this.registros = respuestas.map(respuesta => {
          const comprobante = respuesta.comprobante;
          const cliente = comprobante?.cliente;
          const tipo = this.normalizeTipo(comprobante?.tipoComprobante?.nombre || 'Comprobante');
          const documento = comprobante
            ? `${comprobante.serie}-${String(comprobante.correlativo).padStart(8, '0')}`
            : 'Guia de Remision';

          return {
            idComprobante: comprobante?.idComprobante,
            documento,
            tipo,
            cliente: cliente?.razonSocial || '-',
            documentoCliente: cliente?.numeroDocumento || '-',
            fechaEnvio: respuesta.fechaEnvio?.replace('T', ' ').slice(0, 19) || '-',
            estado: this.toEstado(respuesta.estadoRespuesta || 'PENDIENTE'),
            codigoRespuesta: respuesta.codigoRespuesta || '-',
            descripcion: respuesta.descripcionRespuesta || '-'
          };
        });

        this.actualizarResumen();
      },
      error: () => {
        this.registros = [];
        this.actualizarResumen();
      }
    });
  }

  get filteredRegistros(): RegistroSunat[] {
    return this.registros.filter(item => {
      const needle = this.filters.busqueda.trim().toLowerCase();
      const fechaRegistro = item.fechaEnvio.slice(0, 10);
      const matchesBusqueda =
        !needle ||
        item.documento.toLowerCase().includes(needle) ||
        item.cliente.toLowerCase().includes(needle) ||
        item.documentoCliente.toLowerCase().includes(needle);
      const matchesFecha = !this.filters.fecha || fechaRegistro === this.filters.fecha;
      const matchesTipo = this.filters.tipo === 'Todos' || item.tipo === this.filters.tipo;
      const matchesEstado = this.filters.estado === 'Todos' || item.estado === this.filters.estado;

      return matchesBusqueda && matchesFecha && matchesTipo && matchesEstado;
    });
  }

  clearFilters(): void {
    this.filters = {
      busqueda: '',
      fecha: '',
      tipo: 'Todos',
      estado: 'Todos'
    };
  }

  private actualizarResumen(): void {
    const estados: EstadoSunat[] = ['Aceptado', 'Observado', 'Rechazado', 'Pendiente'];
    this.resumen = this.resumen
      .map(item => ({
        ...item,
        valor: this.registros.filter(registro => registro.estado === item.estado).length.toString()
      }))
      .sort((a, b) => estados.indexOf(a.estado) - estados.indexOf(b.estado));
  }

  private toEstado(estado: string): EstadoSunat {
    const normalized = estado.toUpperCase();
    if (normalized === 'ACEPTADO') return 'Aceptado';
    if (normalized === 'OBSERVADO') return 'Observado';
    if (normalized === 'RECHAZADO') return 'Rechazado';
    return 'Pendiente';
  }

  private normalizeTipo(tipo: string): string {
    return tipo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace('Electronica', 'Electronica')
      .trim();
  }

  getEstadoBadgeClass(estado: EstadoSunat): string {
    const classes = {
      Aceptado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      Observado: 'bg-amber-100 text-amber-700 border-amber-200',
      Rechazado: 'bg-red-100 text-red-700 border-red-200',
      Pendiente: 'bg-slate-100 text-slate-600 border-slate-200'
    };

    return classes[estado];
  }

  getEstadoIcon(estado: EstadoSunat): any {
    const icons = {
      Aceptado: CheckCircle2,
      Observado: AlertCircle,
      Rechazado: XCircle,
      Pendiente: Clock3
    };

    return icons[estado];
  }
}
