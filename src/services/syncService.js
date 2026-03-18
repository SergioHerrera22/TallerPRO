export { sync } from "./syncEngine";

// Backwards-compatible export (viejo nombre)
export async function syncAll() {
  return await sync();
}
