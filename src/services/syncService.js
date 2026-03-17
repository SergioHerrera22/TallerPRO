import { db } from "../db";
import { supabase } from "../lib/supabase";

export async function syncAll() {
  try {
    console.log("Iniciando sincronización masiva...");

    await syncVehicles();
    await syncOrdenesTrabajo();
    await syncExpenses();
    await syncCheques();
    await syncCuentasCorrientes();

    console.log("Sincronización completa");
    return { success: true };
  } catch (error) {
    console.error("Error en sincronización:", error);
    return { success: false, error };
  }
}

async function syncVehicles() {
  const vehicles = await db.vehicles.toArray();
  const vehiclesAdapted = vehicles.map((v) => ({
    ...v,
    kilometros: Number(v.kilometros) || 0,
  }));
  const { error } = await supabase
    .from("vehicles")
    .upsert(vehiclesAdapted, { onConflict: "id" });
  if (error) throw new Error(`Vehicles: ${error.message}`);
}

async function syncOrdenesTrabajo() {
  const orders = await db.ordenesTrabajo.toArray();

  // ELIMINAMOS el campo 'total' antes de enviar a Supabase para evitar el error
  const ordersAdapted = orders.map(({ total, ...rest }) => ({
    ...rest,
    // Asegúrate de que los nombres de abajo coincidan con tu tabla en Supabase
    saldoPendiente: Number(rest.saldoPendiente) || 0,
    // Si en Supabase la columna se llama diferente, ejemplo 'monto_total', asígnala aquí:
    // monto_total: Number(total) || 0
  }));

  const { error } = await supabase
    .from("ordenesTrabajo")
    .upsert(ordersAdapted, { onConflict: "id" });

  if (error) {
    console.error("Error crítico en ordenesTrabajo:", error.message);
    throw new Error(`Ordenes: ${error.message}`);
  }
}

async function syncExpenses() {
  const expenses = await db.expenses.toArray();
  const expensesAdapted = expenses.map((e) => ({
    ...e,
    monto: Number(e.monto) || 0,
  }));

  const { error } = await supabase
    .from("expenses")
    .upsert(expensesAdapted, { onConflict: "id" });

  if (error) throw new Error(`Expenses: ${error.message}`);
}

async function syncCheques() {
  const cheques = await db.cheques.toArray();
  // Limpieza de datos antes de subir
  const chequesAdapted = cheques.map((c) => ({
    ...c,
    monto: Number(c.monto) || 0,
  }));

  const { error } = await supabase
    .from("cheques")
    .upsert(chequesAdapted, { onConflict: "id" });

  if (error) throw new Error(`Cheques: ${error.message}`);
}

async function syncCuentasCorrientes() {
  const cuentas = await db.cuentasCorrientes.toArray();
  const cuentasAdapted = cuentas.map((cc) => ({
    ...cc,
    saldo: Number(cc.saldo) || 0,
  }));

  const { error } = await supabase
    .from("cuentasCorrientes")
    .upsert(cuentasAdapted, { onConflict: "id" });

  if (error) throw new Error(`Cuentas: ${error.message}`);
}
