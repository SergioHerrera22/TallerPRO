export interface Vehicle {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  cliente: string;
  telefono: string;
  createdAt: string;
}

export interface Service {
  id: string;
  vehicleId: string;
  fecha: string;
  tipo: string;
  descripcion: string;
  kilometraje: number;
  costo: number;
  tecnico: string;
  observaciones?: string;
}

export interface Expense {
  id: string;
  fecha: string;
  categoria: string;
  descripcion: string;
  monto: number;
  iva: number;
  total: number;
  proveedor?: string;
  metodoPago: string;
}

export interface OrdenTrabajo {
  id: string;
  numeroOT: string;
  vehicleId: string;
  patente: string;
  cliente: string;
  fecha: string;
  descripcion: string;
  monto: number;
  tecnico: string;
  lavado: boolean;
  estado: "pendiente" | "en-progreso" | "completada";
  observaciones?: string;
  createdAt: string;
}

export interface CuentaCorriente {
  id: string;
  entidad: string; // Nombre de la empresa/banco/proveedor
  tipo: "banco" | "proveedor" | "otro";
  saldo: number; // Positivo: dinero disponible, Negativo: deuda
  limiteCredito?: number; // Para proveedores
  updatedAt: string;
}

export interface Cheque {
  id: string;
  fechaRecepcion: string;
  fechaCobro: string;
  emisor: string;
  destino: string;
  estado: "en-cartera" | "entregado" | "cobrado";
  monto: number;
  numero?: string;
  observaciones?: string;
  createdAt: string;
}
