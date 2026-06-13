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
  X,
  Download,
  Printer
} from 'lucide-angular';

@Component({
  selector: 'app-comprobante-preview',
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './comprobante-preview.html',
  styleUrl: './comprobante-preview.css'
})
export class ComprobantePreview implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(FacturacionApi);

  icons = {
    ArrowLeft,
    X,
    Download,
    Printer
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
        this.error = 'No se pudo cargar la vista previa.';
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

  print(): void {
    window.print();
  }

  get serieCorrelativo(): string {
    if (!this.comprobante) return '-';
    return `${this.comprobante.serie} - ${String(this.comprobante.correlativo).padStart(8, '0')}`;
  }

  get tipoDocumento(): string {
    return (this.comprobante?.tipoComprobante?.nombre || 'Comprobante electronico').toUpperCase();
  }

  get simboloMoneda(): string {
    return this.comprobante?.moneda === 'USD' ? 'USD' : 'S/';
  }

  get monedaTexto(): string {
    return this.comprobante?.moneda === 'USD' ? 'DOLARES AMERICANOS' : 'SOLES';
  }

  get totalEnLetras(): string {
    const total = Number(this.comprobante?.total || 0);
    const entero = Math.floor(total);
    const decimales = Math.round((total - entero) * 100);
    return `${this.numeroALetras(entero)} CON ${String(decimales).padStart(2, '0')}/100 ${this.monedaTexto}`;
  }

  formatMoney(value?: number): string {
    const amount = Number(value || 0);
    return `${this.simboloMoneda} ${new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)}`;
  }

  formatDate(value?: string): string {
    if (!value) return '-';
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));
  }

  private numeroALetras(value: number): string {
    if (value === 0) return 'CERO';
    if (value > 999999) return new Intl.NumberFormat('es-PE').format(value);

    const miles = Math.floor(value / 1000);
    const resto = value % 1000;
    const partes: string[] = [];

    if (miles > 0) {
      partes.push(miles === 1 ? 'MIL' : `${this.centenaALetras(miles)} MIL`);
    }

    if (resto > 0) {
      partes.push(this.centenaALetras(resto));
    }

    return partes.join(' ');
  }

  private centenaALetras(value: number): string {
    const unidades = [
      '',
      'UNO',
      'DOS',
      'TRES',
      'CUATRO',
      'CINCO',
      'SEIS',
      'SIETE',
      'OCHO',
      'NUEVE',
      'DIEZ',
      'ONCE',
      'DOCE',
      'TRECE',
      'CATORCE',
      'QUINCE',
      'DIECISEIS',
      'DIECISIETE',
      'DIECIOCHO',
      'DIECINUEVE'
    ];
    const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    if (value === 100) return 'CIEN';
    if (value < 20) return unidades[value];

    const centena = Math.floor(value / 100);
    const decena = Math.floor((value % 100) / 10);
    const unidad = value % 10;
    const words: string[] = [];

    if (centena > 0) words.push(centenas[centena]);

    if (decena === 2 && unidad > 0) {
      words.push(`VEINTI${unidades[unidad]}`);
    } else if (decena > 0) {
      words.push(decenas[decena]);
      if (unidad > 0) words.push(`Y ${unidades[unidad]}`);
    } else if (unidad > 0) {
      words.push(unidades[unidad]);
    }

    return words.join(' ');
  }
}
