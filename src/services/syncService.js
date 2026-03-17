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

  const ordersAdapted = orders.map((o, index) => {
    // 1. CORRECCIÓN DE FECHA: De DD/MM/YYYY a YYYY-MM-DD
    let fechaFormateada = o.fecha;
    if (o.fecha && o.fecha.includes("/")) {
      const [day, month, year] = o.fecha.split("/");
      fechaFormateada = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    return {
      id: o.id,
      // 2. CORRECCIÓN DE DUPLICADOS:
      // Si el numeroOT es igual, le pegamos el ID para que sea único en la nube
      // mientras arreglas la lógica de generación de números.
      numeroOT:
        o.numeroOT === "OT-001" ? `OT-001-${o.id.slice(0, 4)}` : o.numeroOT,

      vehicleId: o.vehicleId,
      patente: o.patente,
      cliente: o.cliente,
      fecha: fechaFormateada,
      monto: Number(o.monto) || 0,
      total: Number(o.total) || Number(o.monto) || 0,
      saldoPendiente: Number(o.saldoPendiente) || 0,
      estado: o.estado?.toLowerCase() || "pendiente",
      tecnico: o.tecnico || "",
      lavado: o.lavado === "Si" || o.lavado === true, // Mapeo de "Si/No" a Boolean
      entregasCuenta: Array.isArray(o.entregasCuenta) ? o.entregasCuenta : [],
    };
  });

  const { error } = await supabase
    .from("ordenesTrabajo")
    .upsert(ordersAdapted, { onConflict: "id" });

  if (error) {
    console.error("Error al subir OT corregidas:", error.message);
    throw error;
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
