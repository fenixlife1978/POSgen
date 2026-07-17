
export interface Product {
  codigo: string;
  descripcion: string;
  nombre: string;
  barcode?: string;
  referencia?: string;
  marca: string;
  unidad: string;
  moneda: 'base' | 'alterna';
  departamento: string;
  categoria: string;
  grupo?: string;
  subgrupo?: string;
  ubicacion: string;
  costoAnterior: number;
  costoActual: number;
  costoPromedio: number;
  utilidadPorcentaje: number;
  precio1: number; // Detal
  precio2: number; // Mayor
  precio3: number; // Promocion
  precio4: number; // Costo (Referencial)
  ivaAlicuota: number;
  permiteDescuento: boolean;
  activo: boolean;
  manejaSeriales: boolean;
  manejaLotes: boolean;
  fechaVencimiento?: string;
  manejaTallasColores: boolean;
  capacidadContenido?: number;
  manejaPeso: boolean;
  isKit: boolean;
  stockPropio: boolean;
  kitComponents: KitComponent[];
  isService?: boolean;
  serviceType?: string;
  stock: number;
  stockMin: number;
  iva: number;
  exento: boolean;
}

export interface KitComponent {
  codigo: string;
  cantidad: number;
}

export interface Client {
  tipoRif: string;
  rifNum: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  tipo: string;
  credito: number;
  saldo: number;
}

export interface Provider {
  id: string;
  rif: string;
  nombre: string;
  direccion: string;
  contacto: string;
  telefono: string;
}

export interface CartItem {
  productIndex: number;
  codigo: string;
  descripcion: string;
  precioUsd: number;
  iva: number;
  cantidad: number;
  categoria: string;
  isKit?: boolean;
  stockPropio?: boolean;
}

export interface Sale {
  numero: string;
  fecha: string;
  cliente: string;
  rif: string;
  vendedor: string;
  items: CartItem[];
  subtotal: number;
  iva: number;
  totalUsd: number;
  totalBs: number;
  pago: string;
  recibidoUsd: number;
  recibidoBs: number;
  cambioUsd: number;
  referencia: string;
  credito: boolean;
  estado: 'Completada' | 'Anulada' | 'Devuelta';
  detallesPago?: { method: string, usd: number, bs: number }[];
}

export interface Account {
  id: string;
  entidad: string;
  rif: string;
  montoTotal: number;
  montoPagado: number;
  fechaEmision: string;
  estado: 'Pendiente' | 'Parcial' | 'Pagada';
  referencia: string;
  tipo: 'CXC' | 'CXP';
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  email?: string;
  role: 'Administrador' | 'Supervisor' | 'Cajero';
  active: boolean;
}

export type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'VENTA' | 'ANULACION' | 'DEVOLUCION';

export interface InventoryMovement {
  id: string;
  fecha: string;
  codigoProducto: string;
  tipo: MovementType;
  cantidad: number;
  stockPrevio: number;
  stockNuevo: number;
  costo: number;
  referencia: string;
  comentario: string;
  usuario: string;
}

export interface CashMovement {
  id: string;
  fecha: string;
  tipo: 'INGRESO' | 'EGRESO';
  montoUsd: number;
  montoBs: number;
  metodo: string;
  referencia: string;
  concepto: string;
  usuario: string;
}

export interface ReportZRecord {
  id: string;
  numero: number;
  fecha: string;
  vendedor: string;
  facturaInicio: string;
  facturaFin: string;
  ventaBruta: number;
  ventaNeta: number;
  ivaTotal: number;
  igtfTotal: number;
  exentoTotal: number;
  anulaciones: number;
  gastosTotal: number;
  trasladosTotal: number;
  grandTotalAcumulado: number;
  desglosePagos: { method: string, usd: number, bs: number }[];
}
