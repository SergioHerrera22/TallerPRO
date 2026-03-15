import { db } from "../db";
import { supabase } from "../supabase";

export const saveAndSync = async (tableName, data) => {
  try {
    // 1. Guardar en Dexie (Siempre primero para velocidad)
    await db[tableName].add(data);

    // 2. Intentar subir a Supabase
    const { error } = await supabase.from(tableName).insert([data]);

    if (error) {
      console.warn(
        "Guardado localmente. Falló sincronización: ",
        error.message,
      );
      // Aquí podrías marcar la fila en Dexie como "pendiente de sincronizar"
    }
  } catch (err) {
    console.error("Error crítico en saveAndSync:", err);
  }
};
