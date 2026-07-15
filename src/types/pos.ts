
export interface Product {
  codigo: string;
  descripcion: string;
  barcode?: string;
  referencia?: string;
  marca: string;
  unidad: string;
  moneda: 'base' | 'alterna';
  
  // Clasificación
  departamento: string;
  grupo?: string;
  subgrupo?: string;
  ubicacion: string;
  
  // Costos y Precios
  costoAnterior: number;
  costoActual: number;
  costoPromedio: number; // CPP
  utilidadPorcentaje: number; // % utilidad financiera
  precio1: number; // Detal
  precio2: number; // Mayor
  precio3: number; // Corporativo
  ivaAlicuota: number;
  
  // Controles
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
  
  // Existencias
  stock: number;
  stockMin: number;
  categoria: string; // Para compatibilidad con modulos existentes
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

export interface CartItem {
  productIndex: number;
  codigo: string;
  descripcion: string;
  precioUsd: number;
  iva: number;
  cantidad: number;
  categoria: string;
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
  estado: 'Completada' | 'Anulada';
}

export interface Account {
  id: string;
  entidad: string;
  montoTotal: number;
  montoPagado: number;
  fechaEmision: string;
  estado: 'Pendiente' | 'Parcial' | 'Pagada';
  referencia: string;
  tipo: 'CXC' | 'CXP';
}

export interface Presupuesto {
  numero: string;
  fecha: string;
  cliente: string;
  items: CartItem[];
  totalUsd: number;
  estado: 'Pendiente' | 'Aprobado';
}
