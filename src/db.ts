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

export type OutboxOperation = "upsert" | "delete";

export interface OutboxEntry {
  id: string;
  table:
    | "vehicles"
    | "services"
    | "expenses"
    | "ordenesTrabajo"
    | "cuentasCorrientes"
    | "cheques";
  op: OutboxOperation;
  entityId: string;
  payload: unknown;
  createdAt: string;
  tries: number;
  lastError?: string;
}

export interface SyncMeta {
  key: string;
  value: string;
}

class TallerDB extends Dexie {
  vehicles!: Table<Vehicle>;
  services!: Table<Service>;
  expenses!: Table<Expense>;
  ordenesTrabajo!: Table<OrdenTrabajo>;
  cuentasCorrientes!: Table<CuentaCorriente>;
  cheques!: Table<Cheque>;
  outbox!: Table<OutboxEntry>;
  sync_meta!: Table<SyncMeta>;

  constructor() {
    super("TallerPro");

    this.version(1).stores({
      vehicles: `
        id,
        patente,
        cliente,
        marca,
        modelo,
        anio,
        color,
        telefono,
        kilometros,
        createdAt,
        deleted
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

    // v2: agrega outbox + meta para sincronización robusta
    this.version(2).stores({
      vehicles: `
        id,
        patente,
        cliente,
        marca,
        modelo,
        anio,
        color,
        telefono,
        kilometros,
        createdAt,
        updatedAt,
        deleted
      `,

      services: `
        id,
        vehicleId,
        fecha,
        tipo,
        tecnico,
        updatedAt,
        deleted
      `,

      ordenesTrabajo: `
        id,
        numeroOT,
        vehicleId,
        patente,
        cliente,
        fecha,
        estado,
        tecnico,
        updatedAt,
        deleted
      `,

      expenses: `
        id,
        fecha,
        categoria,
        proveedor,
        updatedAt,
        deleted
      `,

      cuentasCorrientes: `
        id,
        entidad,
        tipo,
        updatedAt,
        deleted
      `,

      cheques: `
        id,
        fechaCobro,
        estado,
        clienteId,
        updatedAt,
        deleted
      `,

      outbox: `
        id,
        table,
        op,
        entityId,
        createdAt,
        tries
      `,

      sync_meta: `
        key
      `,
    });
  }
}

export const db = new TallerDB();
