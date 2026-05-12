export const createId = () => crypto.randomUUID();

/**
 * Formatea una cadena de fecha "YYYY-MM-DD" en formato local es-AR (DD/MM/YYYY)
 * sin el bug de UTC: new Date("2026-04-06") se interpreta como medianoche UTC
 * y en AR (UTC-3) retrocede un día. Esta función parsea la fecha en hora local.
 */
export const formatLocalDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-AR");
};

/** Devuelve la fecha de hoy en formato "YYYY-MM-DD" usando la hora local (no UTC). */
export const todayLocalISODate = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const formatCurrency = (
  amount: number,
  options?: Intl.NumberFormatOptions,
) => {
  if (!Number.isFinite(amount)) return "0,00";
  return amount.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
};

export const calculateIvaFromTotal = (total: number, rate = 0.21) => {
  if (!Number.isFinite(total) || total <= 0) return 0;

  return total - total / (1 + rate);
};
