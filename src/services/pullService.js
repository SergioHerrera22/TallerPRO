import { supabase } from "../lib/supabase";
import { db } from "../db";

export async function pullFromSupabase() {
  try {
    console.log("Descargando datos desde Supabase...");

    // 1. Descargar todo en paralelo para mayor velocidad
    const [
      { data: v },
      { data: ot },
      { data: exp },
      { data: cc },
      { data: ch },
    ] = await Promise.all([
      supabase.from("vehicles").select("*"),
      supabase.from("ordenesTrabajo").select("*"),
      supabase.from("expenses").select("*"),
      supabase.from("cuentasCorrientes").select("*"),
      supabase.from("cheques").select("*"),
    ]);

    // 2. Guardar en IndexedDB (solo si hay datos)
    if (v) {
      const vAdapted = v
        .filter((i) => !i.deleted)
        .map((i) => ({ ...i, kilometros: Number(i.kilometros) || 0 }));
      await db.vehicles.bulkPut(vAdapted);
    }

    if (ot) await db.ordenesTrabajo.bulkPut(ot);
    if (exp) await db.expenses.bulkPut(exp);
    if (cc) await db.cuentasCorrientes.bulkPut(cc);
    if (ch) await db.cheques.bulkPut(ch);

    console.log("Datos locales actualizados correctamente");
    return { success: true };
  } catch (error) {
    console.error("Error en el pull de datos:", error);
    return { success: false, error };
  }
}
