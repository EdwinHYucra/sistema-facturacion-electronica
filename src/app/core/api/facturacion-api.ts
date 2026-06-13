import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';

export interface ClienteApi {
  idCliente?: number;
  tipoDocumento: string;
  numeroDocumento: string;
  razonSocial: string;
  nombreComercial?: string;
  direccion?: string;
  correo?: string;
  telefono?: string;
  estado: string;
}

export interface ProductoServicioApi {
  idProductoServicio?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  unidadMedida: string;
  precioUnitario: number;
  estado: string;
}

export interface TipoComprobanteApi {
  idTipoComprobante?: number;
  codigoSunat: string;
  nombre: string;
  descripcion?: string;
}

export interface ComprobanteApi {
  idComprobante?: number;
  cliente?: ClienteApi;
  tipoComprobante?: TipoComprobanteApi;
  serie: string;
  correlativo: number;
  fechaEmision: string;
  moneda: string;
  subtotal: number;
  descuentoTotal: number;
  igv: number;
  total: number;
  estado: string;
  observacion?: string;
  empresa?: EmpresaApi;
  usuario?: UsuarioApi;
  serieComprobante?: SerieComprobanteApi;
}

export interface DetalleComprobanteApi {
  idDetalle?: number;
  comprobante?: ComprobanteApi;
  productoServicio?: ProductoServicioApi;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  valorVenta: number;
  igv: number;
  totalLinea: number;
}

export interface GuiaRemisionApi {
  idGuia?: number;
  empresa?: EmpresaApi;
  cliente?: ClienteApi;
  usuario?: UsuarioApi;
  serieComprobante?: SerieComprobanteApi;
  comprobanteRelacionado?: ComprobanteApi;
  serie: string;
  correlativo: number;
  fechaEmision: string;
  fechaTraslado: string;
  motivoTraslado: string;
  modalidadTraslado: string;
  direccionPartida: string;
  direccionLlegada: string;
  transportista?: string;
  documentoTransportista?: string;
  placaVehiculo?: string;
  estado: string;
  observacion?: string;
}

export interface DetalleGuiaRemisionApi {
  idDetalleGuia?: number;
  guiaRemision?: GuiaRemisionApi;
  productoServicio?: ProductoServicioApi;
  cantidad: number;
  unidadMedida: string;
  descripcion?: string;
  peso?: number;
}

export interface NotaCreditoDebitoApi {
  idNota?: number;
  comprobanteReferencia?: ComprobanteApi;
  comprobanteNota?: ComprobanteApi;
  tipoNota: string;
  motivo: string;
  descripcion?: string;
  fechaEmision: string;
  estado: string;
}

export interface DashboardResumenApi {
  comprobantesEmitidos: number;
  clientes: number;
  productosServicios: number;
  aceptados: number;
  pendientes: number;
  rechazados: number;
  observados: number;
  respuestasSunatAceptadas: number;
  totalFacturado: number;
}

export interface RespuestaSunatApi {
  idRespuestaSunat?: number;
  comprobante?: ComprobanteApi;
  guiaRemision?: any;
  codigoRespuesta?: string;
  descripcionRespuesta?: string;
  estadoRespuesta?: string;
  nombreArchivoXml?: string;
  nombreArchivoCdr?: string;
  fechaEnvio?: string;
  fechaRespuesta?: string;
}

export interface EmpresaApi {
  idEmpresa?: number;
  ruc: string;
  razonSocial: string;
  nombreComercial?: string;
  direccionFiscal?: string;
  telefono?: string;
  correo?: string;
  estado: string;
}

export interface RolApi {
  idRol?: number;
  nombreRol: string;
  descripcion?: string;
  estado: string;
}

export interface UsuarioApi {
  idUsuario?: number;
  empresa?: EmpresaApi;
  rol?: RolApi;
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
  estado: string;
  fechaCreacion?: string;
}

export interface SerieComprobanteApi {
  idSerie?: number;
  empresa?: EmpresaApi;
  tipoComprobante?: TipoComprobanteApi;
  serie: string;
  correlativoActual: number;
  estado: string;
}

@Injectable({ providedIn: 'root' })
export class FacturacionApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api';
  private readonly getRetry = { count: 3, delay: 500 };

  getDashboardResumen(): Observable<DashboardResumenApi> {
    return this.http.get<DashboardResumenApi>(`${this.baseUrl}/dashboard/resumen`).pipe(retry(this.getRetry));
  }

  getClientes(): Observable<ClienteApi[]> {
    return this.http.get<ClienteApi[]>(`${this.baseUrl}/clientes`).pipe(retry(this.getRetry));
  }

  createCliente(cliente: ClienteApi): Observable<ClienteApi> {
    return this.http.post<ClienteApi>(`${this.baseUrl}/clientes`, cliente);
  }

  updateCliente(id: number, cliente: ClienteApi): Observable<ClienteApi> {
    return this.http.put<ClienteApi>(`${this.baseUrl}/clientes/${id}`, cliente);
  }

  deleteCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/clientes/${id}`);
  }

  getProductosServicios(): Observable<ProductoServicioApi[]> {
    return this.http.get<ProductoServicioApi[]>(`${this.baseUrl}/productos-servicios`).pipe(retry(this.getRetry));
  }

  createProductoServicio(producto: ProductoServicioApi): Observable<ProductoServicioApi> {
    return this.http.post<ProductoServicioApi>(`${this.baseUrl}/productos-servicios`, producto);
  }

  updateProductoServicio(id: number, producto: ProductoServicioApi): Observable<ProductoServicioApi> {
    return this.http.put<ProductoServicioApi>(`${this.baseUrl}/productos-servicios/${id}`, producto);
  }

  deleteProductoServicio(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/productos-servicios/${id}`);
  }

  getComprobantes(): Observable<ComprobanteApi[]> {
    return this.http.get<ComprobanteApi[]>(`${this.baseUrl}/comprobantes`).pipe(retry(this.getRetry));
  }

  getComprobante(id: number): Observable<ComprobanteApi> {
    return this.http.get<ComprobanteApi>(`${this.baseUrl}/comprobantes/${id}`).pipe(retry(this.getRetry));
  }

  createComprobante(comprobante: ComprobanteApi): Observable<ComprobanteApi> {
    return this.http.post<ComprobanteApi>(`${this.baseUrl}/comprobantes`, comprobante);
  }

  enviarSunatSimulado(id: number): Observable<RespuestaSunatApi> {
    return this.http.post<RespuestaSunatApi>(`${this.baseUrl}/comprobantes/${id}/enviar-sunat-simulado`, {});
  }

  createDetalleComprobante(detalle: DetalleComprobanteApi): Observable<DetalleComprobanteApi> {
    return this.http.post<DetalleComprobanteApi>(`${this.baseUrl}/detalles-comprobante`, detalle);
  }

  getDetallesComprobante(idComprobante: number): Observable<DetalleComprobanteApi[]> {
    return this.http
      .get<DetalleComprobanteApi[]>(`${this.baseUrl}/detalles-comprobante/comprobante/${idComprobante}`)
      .pipe(retry(this.getRetry));
  }

  getGuiasRemision(): Observable<GuiaRemisionApi[]> {
    return this.http.get<GuiaRemisionApi[]>(`${this.baseUrl}/guias-remision`).pipe(retry(this.getRetry));
  }

  createGuiaRemision(guia: GuiaRemisionApi): Observable<GuiaRemisionApi> {
    return this.http.post<GuiaRemisionApi>(`${this.baseUrl}/guias-remision`, guia);
  }

  updateGuiaRemision(id: number, guia: GuiaRemisionApi): Observable<GuiaRemisionApi> {
    return this.http.put<GuiaRemisionApi>(`${this.baseUrl}/guias-remision/${id}`, guia);
  }

  enviarGuiaSunatSimulado(id: number): Observable<RespuestaSunatApi> {
    return this.http.post<RespuestaSunatApi>(`${this.baseUrl}/guias-remision/${id}/enviar-sunat-simulado`, {});
  }

  createDetalleGuiaRemision(detalle: DetalleGuiaRemisionApi): Observable<DetalleGuiaRemisionApi> {
    return this.http.post<DetalleGuiaRemisionApi>(`${this.baseUrl}/detalles-guia-remision`, detalle);
  }

  getNotasCreditoDebito(): Observable<NotaCreditoDebitoApi[]> {
    return this.http.get<NotaCreditoDebitoApi[]>(`${this.baseUrl}/notas-credito-debito`).pipe(retry(this.getRetry));
  }

  createNotaCreditoDebito(nota: NotaCreditoDebitoApi): Observable<NotaCreditoDebitoApi> {
    return this.http.post<NotaCreditoDebitoApi>(`${this.baseUrl}/notas-credito-debito`, nota);
  }

  getRespuestasSunat(): Observable<RespuestaSunatApi[]> {
    return this.http.get<RespuestaSunatApi[]>(`${this.baseUrl}/respuestas-sunat`).pipe(retry(this.getRetry));
  }

  getEmpresas(): Observable<EmpresaApi[]> {
    return this.http.get<EmpresaApi[]>(`${this.baseUrl}/empresas`).pipe(retry(this.getRetry));
  }

  updateEmpresa(id: number, empresa: EmpresaApi): Observable<EmpresaApi> {
    return this.http.put<EmpresaApi>(`${this.baseUrl}/empresas/${id}`, empresa);
  }

  getRoles(): Observable<RolApi[]> {
    return this.http.get<RolApi[]>(`${this.baseUrl}/roles`).pipe(retry(this.getRetry));
  }

  getUsuarios(): Observable<UsuarioApi[]> {
    return this.http.get<UsuarioApi[]>(`${this.baseUrl}/usuarios`).pipe(retry(this.getRetry));
  }

  createUsuario(usuario: UsuarioApi): Observable<UsuarioApi> {
    return this.http.post<UsuarioApi>(`${this.baseUrl}/usuarios`, usuario);
  }

  updateUsuario(id: number, usuario: UsuarioApi): Observable<UsuarioApi> {
    return this.http.put<UsuarioApi>(`${this.baseUrl}/usuarios/${id}`, usuario);
  }

  deleteUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/usuarios/${id}`);
  }

  getSeriesComprobante(): Observable<SerieComprobanteApi[]> {
    return this.http.get<SerieComprobanteApi[]>(`${this.baseUrl}/series-comprobante`).pipe(retry(this.getRetry));
  }

  createSerieComprobante(serie: SerieComprobanteApi): Observable<SerieComprobanteApi> {
    return this.http.post<SerieComprobanteApi>(`${this.baseUrl}/series-comprobante`, serie);
  }

  updateSerieComprobante(id: number, serie: SerieComprobanteApi): Observable<SerieComprobanteApi> {
    return this.http.put<SerieComprobanteApi>(`${this.baseUrl}/series-comprobante/${id}`, serie);
  }

  getTiposComprobante(): Observable<TipoComprobanteApi[]> {
    return this.http.get<TipoComprobanteApi[]>(`${this.baseUrl}/tipos-comprobante`).pipe(retry(this.getRetry));
  }
}
