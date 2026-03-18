import { db } from "../db";
import type { OrdenTrabajo } from "../app/types";

function parseNumeroOT(numeroOT: string): number {
  const match = numeroOT?.match(/OT-(\d+)/i);
  if (!match) return 0;
  const parsed = parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function generateNextOTNumber(): Promise<string> {
  const all: OrdenTrabajo[] = await db.ordenesTrabajo.toArray();

  const max = all.reduce((currentMax, ot) => {
    const value = parseNumeroOT(ot.numeroOT);
    return value > currentMax ? value : currentMax;
  }, 0);

  const next = max + 1;
  return `OT-${String(next).padStart(3, "0")}`;
}

