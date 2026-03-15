import { db } from "../db";
import { supabase } from "../lib/supabase";

export async function syncAll() {
  try {
    console.log("Iniciando sincronización...");

    await syncVehicles();
    await syncOrdenesTrabajo();
    await syncExpenses();
    await syncCheques();
    await syncCuentasCorrientes();

    console.log("Sincronización completa");
  } catch (error) {
    console.error("Error en sincronización:", error);
  }
}

async function syncVehicles() {
  const vehicles = await db.vehicles.toArray();

  const { error } = await supabase
    .from("vehicles")
    .upsert(vehicles, { onConflict: "id" });

  if (error) console.error("Error vehicles:", error);
}

async function syncOrdenesTrabajo() {
  const orders = await db.ordenesTrabajo.toArray();

  const { error } = await supabase
    .from("ordenestrabajo")
    .upsert(orders, { onConflict: "id" });

  if (error) console.error("Error ordenes:", error);
}

async function syncExpenses() {
  const expenses = await db.expenses.toArray();

  const { error } = await supabase
    .from("expenses")
    .upsert(expenses, { onConflict: "id" });

  if (error) console.error("Error expenses:", error);
}

async function syncCheques() {
  const cheques = await db.cheques.toArray();

  const { error } = await supabase
    .from("cheques")
    .upsert(cheques, { onConflict: "id" });

  if (error) console.error("Error cheques:", error);
}

async function syncCuentasCorrientes() {
  const cuentas = await db.cuentasCorrientes.toArray();

  const { error } = await supabase
    .from("cuentasCorrientes")
    .upsert(cuentas, { onConflict: "id" });

  if (error) console.error("Error cuentas:", error);
}
