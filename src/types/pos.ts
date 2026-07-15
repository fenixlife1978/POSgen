
export interface Product {
  codigo: string;
  descripcion: string;
  categoria: string;
  marca: string;
  modelo: string;
  precioUsd: number;
  costoUsd: number;
  iva: number;
  stock: number;
  stockMin: number;
  unidad: string;
  ubicacion: string;
  activo: boolean;
  margen?: number;
  isKit?: boolean;
  hasOwnStock?: boolean;
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
