import { supabase } from "../supabaseClient";
import { db } from "../dexieDB";

export async function pullFromSupabase() {
  console.log("Descargando datos...");

  const { data: vehicles } = await supabase.from("vehicles").select("*");

  if (vehicles) {
    await db.vehicles.bulkPut(vehicles);
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
