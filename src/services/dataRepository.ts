import { db } from "../db";
import type {
  Vehicle,
  OrdenTrabajo,
  Expense,
  Cheque,
  CuentaCorriente,
} from "../app/types";
import { enqueueOutbox, sync } from "./syncEngine";

function nowIso() {
  return new Date().toISOString();
}

function broadcastDataRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("app:refreshData"));
  }
}

export const dataRepository = {
  async saveVehicle(entity: Vehicle) {
    const updatedAt = nowIso();
    const record: Vehicle = {
      ...entity,
      updatedAt,
      deleted: entity.deleted ?? false,
    };
    await db.vehicles.put(record);
    await enqueueOutbox("vehicles", "upsert", record.id, record);
    if (navigator.onLine) void sync();
    broadcastDataRefresh();
    return record;
  },

  async deleteVehicle(id: string) {
    const existing = await db.vehicles.get(id);
    const updatedAt = nowIso();
    const record: Vehicle = {
      ...(existing as Vehicle),
      id,
      deleted: true,
      updatedAt,
    };
    await db.vehicles.put(record);
    await enqueueOutbox("vehicles", "delete", id, record);
    if (navigator.onLine) void sync();
    broadcastDataRefresh();
  },

  async saveOrdenTrabajo(entity: OrdenTrabajo) {
    const updatedAt = nowIso();
    const record: OrdenTrabajo = {
      ...entity,
      updatedAt,
      deleted: entity.deleted ?? false,
    };
    await db.ordenesTrabajo.put(record);
    await enqueueOutbox("ordenesTrabajo", "upsert", record.id, record);
    if (navigator.onLine) void sync();
    broadcastDataRefresh();
    return record;
  },

  async deleteOrdenTrabajo(id: string) {
    const existing = await db.ordenesTrabajo.get(id);
    const updatedAt = nowIso();
    const record: OrdenTrabajo = {
      ...(existing as OrdenTrabajo),
      id,
      deleted: true,
      updatedAt,
    };
    await db.ordenesTrabajo.put(record);
    await enqueueOutbox("ordenesTrabajo", "delete", id, record);
    if (navigator.onLine) void sync();
    broadcastDataRefresh();
  },

  async saveExpense(entity: Expense) {
    const updatedAt = nowIso();
    const record: Expense = {
      ...entity,
      updatedAt,
      deleted: entity.deleted ?? false,
    };
    await db.expenses.put(record);
    await enqueueOutbox("expenses", "upsert", record.id, record);
    if (navigator.onLine) void sync();
    broadcastDataRefresh();
    return record;
  },

  async deleteExpense(id: string) {
    const existing = await db.expenses.get(id);
    const updatedAt = nowIso();
    const record: Expense = {
      ...(existing as Expense),
      id,
      deleted: true,
      updatedAt,
    };
    await db.expenses.put(record);
    await enqueueOutbox("expenses", "delete", id, record);
    if (navigator.onLine) void sync();
    broadcastDataRefresh();
  },

  async saveCheque(entity: Cheque) {
    const updatedAt = nowIso();
    const record: Cheque = {
      ...entity,
      updatedAt,
      deleted: entity.deleted ?? false,
    };
    await db.cheques.put(record);
    await enqueueOutbox("cheques", "upsert", record.id, record);
    if (navigator.onLine) void sync();
    broadcastDataRefresh();
    return record;
  },

  async deleteCheque(id: string) {
    const existing = await db.cheques.get(id);
    const updatedAt = nowIso();
    const record: Cheque = {
      ...(existing as Cheque),
      id,
      deleted: true,
      updatedAt,
    };
    await db.cheques.put(record);
    await enqueueOutbox("cheques", "delete", id, record);
    if (navigator.onLine) void sync();
    broadcastDataRefresh();
  },

  async saveCuentaCorriente(entity: CuentaCorriente) {
    const updatedAt = nowIso();
    const record: CuentaCorriente = {
      ...entity,
      updatedAt,
      deleted: entity.deleted ?? false,
    };
    await db.cuentasCorrientes.put(record);
    await enqueueOutbox("cuentasCorrientes", "upsert", record.id, record);
    if (navigator.onLine) void sync();
    broadcastDataRefresh();
    return record;
  },

  async deleteCuentaCorriente(id: string) {
    const existing = await db.cuentasCorrientes.get(id);
    const updatedAt = nowIso();
    const record: CuentaCorriente = {
      ...(existing as CuentaCorriente),
      id,
      deleted: true,
      updatedAt,
    };
    await db.cuentasCorrientes.put(record);
    await enqueueOutbox("cuentasCorrientes", "delete", id, record);
    if (navigator.onLine) void sync();
    broadcastDataRefresh();
  },
};
