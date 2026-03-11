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