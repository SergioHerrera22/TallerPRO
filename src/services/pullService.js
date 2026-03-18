import { sync } from "./syncEngine";

// Backwards-compatible: antes era un "pull" completo. Ahora hace sync robusto (push+pull).
export async function pullFromSupabase() {
  return await sync();
}
