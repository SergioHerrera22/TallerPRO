import type { OrdenTrabajo, Vehicle } from "../../types";

export type OrderFormData = Omit<OrdenTrabajo, "id" | "createdAt" | "numeroOT">;

export type OrderFormSubmit = (data: OrderFormData) => void;

export type OrderFormInitialData = OrdenTrabajo | undefined;

export type OrderFormVehicles = Vehicle[];

