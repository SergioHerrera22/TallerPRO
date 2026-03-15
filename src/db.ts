import Dexie from "dexie";
import type { Table } from "dexie";
// Importa el tipo Table para definir las tablas de la base de datos

import {
  Vehicle,
  Service,
  Expense,
  OrdenTrabajo,
  CuentaCorriente,
  Cheque,
} from "./app/types/index";

class TallerDB extends Dexie {
  vehicles!: Table<Vehicle>;
  services!: Table<Service>;
  expenses!: Table<Expense>;
  ordenesTrabajo!: Table<OrdenTrabajo>;
  cuentasCorrientes!: Table<CuentaCorriente>;
  cheques!: Table<Cheque>;

  constructor() {
    super("TallerPro");

    this.version(1).stores({
      vehicles: `
        id,
        patente,
        cliente,
        marca,
        modelo
      `,

      services: `
        id,
        vehicleId,
        fecha,
        tipo,
        tecnico
      `,

      ordenesTrabajo: `
        id,
        numeroOT,
        vehicleId,
        patente,
        cliente,
        fecha,
        estado,
        tecnico
      `,

      expenses: `
        id,
        fecha,
        categoria,
        proveedor
      `,

      cuentasCorrientes: `
        id,
        entidad,
        tipo
      `,

      cheques: `
        id,
        fechaCobro,
        estado,
        clienteId
      `,
    });
  }
}

export const db = new TallerDB();
