import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Building2,
  FileDigit,
  SlidersHorizontal,
  Save,
  Plus,
  X
} from 'lucide-angular';
import {
  EmpresaApi,
  FacturacionApi,
  SerieComprobanteApi,
  TipoComprobanteApi
} from '../../core/api/facturacion-api';

type ConfigTab = 'empresa' | 'series' | 'parametros';

interface ConfiguracionMenu {
  id: ConfigTab;
  label: string;
  icon: any;
}

interface ParametrosSistema {
  entornoSunat: string;
  modoEnvio: string;
  igv: number;
  moneda: string;
}

@Component({
  selector: 'app-configuracion',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css'
})
export class Configuracion implements OnInit {
  private readonly api = inject(FacturacionApi);

  activeTab: ConfigTab = 'empresa';
  cargando = false;
  guardando = false;
  mostrarSerieModal = false;
  mensaje = '';
  error = '';

  icons = {
    Save,
    Plus,
    X
  };

  empresa: EmpresaApi = this.emptyEmpresa();
  series: SerieComprobanteApi[] = [];
  tiposComprobante: TipoComprobanteApi[] = [];
  serieForm: SerieComprobanteApi = this.emptySerie();

  parametros: ParametrosSistema = {
    entornoSunat: 'Beta / Pruebas',
    modoEnvio: 'SUNAT simulado',
    igv: 18,
    moneda: 'PEN'
  };

  menuItems: ConfiguracionMenu[] = [
    {
      id: 'empresa',
      label: 'Datos de la Empresa',
      icon: Building2
    },
    {
      id: 'series',
      label: 'Series y Correlativos',
      icon: FileDigit
    },
    {
      id: 'parametros',
      label: 'Parámetros del Sistema',
      icon: SlidersHorizontal
    }
  ];

  ngOnInit(): void {
    this.cargarConfiguracion();
  }

  setActiveTab(tab: ConfigTab): void {
    this.activeTab = tab;
    this.mensaje = '';
    this.error = '';
  }

  cargarConfiguracion(): void {
    this.cargando = true;
    this.api.getEmpresas().subscribe({
      next: empresas => {
        this.empresa = empresas[0] || this.emptyEmpresa();
        this.cargarSeries();
      },
      error: () => {
        this.error = 'No se pudo cargar la empresa. Verifique que el backend este activo.';
        this.cargando = false;
      }
    });
  }

  cargarSeries(): void {
    this.api.getTiposComprobante().subscribe({
      next: tipos => {
        this.tiposComprobante = tipos;
        this.api.getSeriesComprobante().subscribe({
          next: series => {
            this.series = series;
            this.cargando = false;
          },
          error: () => {
            this.error = 'No se pudieron cargar las series.';
            this.cargando = false;
          }
        });
      },
      error: () => {
        this.error = 'No se pudieron cargar los tipos de comprobante.';
        this.cargando = false;
      }
    });
  }

  guardarEmpresa(): void {
    if (!this.empresa.idEmpresa) {
      this.error = 'No existe empresa registrada para actualizar.';
      return;
    }

    this.guardando = true;
    this.api.updateEmpresa(this.empresa.idEmpresa, this.empresa).subscribe({
      next: empresa => {
        this.empresa = empresa;
        this.guardando = false;
        this.mensaje = 'Datos de empresa actualizados correctamente.';
      },
      error: response => {
        this.guardando = false;
        this.error = this.getErrorMessage(response.error);
      }
    });
  }

  abrirNuevaSerie(): void {
    this.serieForm = {
      ...this.emptySerie(),
      empresa: { idEmpresa: this.empresa.idEmpresa } as EmpresaApi,
      tipoComprobante: this.tiposComprobante[0]
        ? ({ idTipoComprobante: this.tiposComprobante[0].idTipoComprobante } as TipoComprobanteApi)
        : undefined
    };
    this.mostrarSerieModal = true;
    this.mensaje = '';
    this.error = '';
  }

  guardarSerie(): void {
    this.guardando = true;
    this.api.createSerieComprobante(this.serieForm).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarSerieModal = false;
        this.mensaje = 'Serie registrada correctamente.';
        this.cargarSeries();
      },
      error: response => {
        this.guardando = false;
        this.error = this.getErrorMessage(response.error);
      }
    });
  }

  tipoNombre(serie: SerieComprobanteApi): string {
    return serie.tipoComprobante?.nombre || '-';
  }

  private emptyEmpresa(): EmpresaApi {
    return {
      ruc: '',
      razonSocial: '',
      nombreComercial: '',
      direccionFiscal: '',
      telefono: '',
      correo: '',
      estado: 'ACTIVO'
    };
  }

  private emptySerie(): SerieComprobanteApi {
    return {
      serie: '',
      correlativoActual: 0,
      estado: 'ACTIVO'
    };
  }

  private getErrorMessage(error: any): string {
    if (!error) {
      return 'No se pudo guardar la configuracion.';
    }
    if (typeof error === 'string') {
      return error;
    }
    return Object.values(error).join(' ');
  }
}
