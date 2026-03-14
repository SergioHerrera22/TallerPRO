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
  telefono?: string;
  fecha: string;
  descripcion: string;
  monto: number;
  entregasCuenta?: number[]; // Array de entregas a cuenta
  saldoPendiente: number; // Monto total - sumatoria de entregas a cuenta
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
  gastos?: GastoProveedor[]; // Solo para proveedores
  updatedAt: string;
}

export interface GastoProveedor {
  id: string;
  fecha: string;
  detalleProducto: string;
  iva: number;
  total: number;
  createdAt: string;
}

export interface Cheque {
  id: string;
  fechaRecepcion: string;
  fechaCobro: string;
  emisor: string;
  destino: string;
  estado: "en-cartera" | "entregado" | "cobrado" | "imputado";
  monto: number;
  numero?: string;
  observaciones?: string;
  clienteId?: string; // ID del cliente (viene de vehicles) para imputación
  fechaImputacion?: string; // Fecha cuando se imputó el cheque
  createdAt: string;
}
