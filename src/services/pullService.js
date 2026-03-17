import { supabase } from "../lib/supabase.js";
import { db } from "../db.ts";

export async function pullFromSupabase() {
  console.log("Descargando datos...");

  const { data: vehicles } = await supabase.from("vehicles").select("*");

  if (vehicles) {
    // Asegurar que cada vehículo tenga el campo kilometros
    const vehiclesAdapted = vehicles.map((v) => ({
      ...v,
      kilometros: typeof v.kilometros === "number" ? v.kilometros : 0,
    }));
    await db.vehicles.bulkPut(vehiclesAdapted);
  }

  const { data: ordenes } = await supabase.from("ordenesTrabajo").select("*");

  if (ordenes) {
    await db.ordenesTrabajo.bulkPut(ordenes);
  }

  const { data: expenses } = await supabase.from("expenses").select("*");

  if (expenses) {
    await db.expenses.bulkPut(expenses);
  }

  const { data: cuentas } = await supabase
    .from("cuentasCorrientes")
    .select("*");

  if (cuentas) {
    await db.cuentasCorrientes.bulkPut(cuentas);
  }

  const { data: cheques } = await supabase.from("cheques").select("*");

  if (cheques) {
    await db.cheques.bulkPut(cheques);
  }

  console.log("Datos descargados");
}
