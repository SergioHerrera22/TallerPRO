import { supabase } from "../lib/supabase";
import { db, OutboxEntry, OutboxOperation } from "../db";

const OUTBOX_TABLES = [
  "vehicles",
  "ordenesTrabajo",
  "expenses",
  "cheques",
  "cuentasCorrientes",
] as const;

type OutboxTable = (typeof OUTBOX_TABLES)[number];

function nowIso() {
  return new Date().toISOString();
}

async function getOrCreateClientId(): Promise<string> {
  const existing = await db.sync_meta.get("clientId");
  if (existing?.value) return existing.value;

  const id = crypto.randomUUID();
  await db.sync_meta.put({ key: "clientId", value: id });
  return id;
}

function toServerRecord(table: OutboxTable, payload: any) {
  const updated_at = payload.updatedAt ?? nowIso();
  const base = { ...payload };
  delete base.updatedAt;

  return { ...base, updated_at };
}

function fromServerRecord(row: any) {
  if (!row) return row;
  const { updated_at, ...rest } = row;
  return { ...rest, updatedAt: updated_at };
}

async function getLastPullAt(table: OutboxTable): Promise<string> {
  const meta = await db.sync_meta.get(`lastPullAt:${table}`);
  return meta?.value ?? "1970-01-01T00:00:00.000Z";
}

async function setLastPullAt(table: OutboxTable, value: string) {
  await db.sync_meta.put({ key: `lastPullAt:${table}`, value });
}

let syncInFlight: Promise<{ success: boolean; error?: unknown }> | null = null;

export async function sync(): Promise<{ success: boolean; error?: unknown }> {
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    try {
      if (!navigator.onLine) return { success: true };

      await getOrCreateClientId();
      await pushOutbox();
      await pullIncremental();
      await db.sync_meta.put({ key: "lastSyncOkAt", value: nowIso() });
      await db.sync_meta.put({ key: "lastSyncError", value: "" });
      await db.sync_meta.put({ key: "lastSyncErrorAt", value: "" });
      return { success: true };
    } catch (error) {
      console.error("sync() error", error);
      const message =
        (error as any)?.message ? String((error as any).message) : String(error);
      await db.sync_meta.put({ key: "lastSyncError", value: message });
      await db.sync_meta.put({ key: "lastSyncErrorAt", value: nowIso() });
      return { success: false, error };
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}

export async function enqueueOutbox(
  table: OutboxTable,
  op: OutboxOperation,
  entityId: string,
  payload: unknown,
) {
  const entry: OutboxEntry = {
    id: crypto.randomUUID(),
    table,
    op,
    entityId,
    payload,
    createdAt: nowIso(),
    tries: 0,
  };
  await db.outbox.add(entry);
}

async function pushOutbox() {
  const pending = await db.outbox.orderBy("createdAt").toArray();
  if (pending.length === 0) return;

  const clientId = await getOrCreateClientId();

  for (const item of pending) {
    try {
      const table = item.table as OutboxTable;
      const payload: any = item.payload ?? {};

      if (item.op === "delete") {
        const deleteRecord = toServerRecord(table, {
          ...payload,
          id: item.entityId,
          deleted: true,
          client_id: clientId,
          updatedAt: payload.updatedAt ?? nowIso(),
        });

        const { error } = await supabase
          .from(table)
          .upsert(deleteRecord, { onConflict: "id" });

        if (error) throw error;
      } else {
        const upsertRecord = toServerRecord(table, {
          ...payload,
          id: item.entityId,
          deleted: payload.deleted ?? false,
          client_id: clientId,
          updatedAt: payload.updatedAt ?? nowIso(),
        });

        const { error } = await supabase
          .from(table)
          .upsert(upsertRecord, { onConflict: "id" });

        if (error) throw error;
      }

      await db.outbox.delete(item.id);
    } catch (error: any) {
      const message = error?.message ? String(error.message) : String(error);
      await db.outbox.update(item.id, {
        tries: (item.tries ?? 0) + 1,
        lastError: message,
      });

      // Cortar para evitar martillar cuando hay un error de schema/auth
      throw error;
    }
  }
}

async function pullIncremental() {
  for (const table of OUTBOX_TABLES) {
    const lastPullAt = await getLastPullAt(table);

    const { data, error } = await supabase
      .from(table)
      .select("*")
      .gt("updated_at", lastPullAt)
      .order("updated_at", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) continue;

    const adapted = data.map(fromServerRecord);

    // Merge LWW: Dexie bulkPut pisa por PK, pero la fuente ya es incremental y ordenada.
    // Si existieran cambios locales más nuevos, volverán a salir por outbox en el próximo push.
    // @ts-expect-error: acceso dinámico por nombre de tabla
    await db[table].bulkPut(adapted);

    const maxUpdatedAt = String(data[data.length - 1].updated_at ?? nowIso());
    await setLastPullAt(table, maxUpdatedAt);
  }
}

