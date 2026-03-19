import { useEffect, useMemo, useState } from "react";
import type { LineaRepuesto, OrdenTrabajo, Vehicle } from "../../types";
import type { OrderFormData } from "./types";

function emptyForm(): OrderFormData {
  return {
    vehicleId: "",
    patente: "",
    cliente: "",
    telefono: "",
    fecha: new Date().toISOString().split("T")[0],
    descripcion: "",
    repuestos: [],
    manoDeObra: 0,
    monto: 0,
    entregasCuenta: [],
    saldoPendiente: 0,
    tecnico: "",
    lavado: false,
    estado: "pendiente",
    observaciones: "",
  };
}

function totalRepuestos(repuestos: LineaRepuesto[]) {
  return repuestos.reduce((sum, item) => sum + (Number(item.precio) || 0), 0);
}

function montoTotal(repuestos: LineaRepuesto[], manoDeObra: number) {
  return totalRepuestos(repuestos) + (Number(manoDeObra) || 0);
}

function totalEntregas(entregas: number[]) {
  return entregas.reduce((sum, e) => sum + (Number(e) || 0), 0);
}

export function useOrderForm(params: {
  isOpen: boolean;
  vehicles: Vehicle[];
  initialData?: OrdenTrabajo;
}) {
  const { isOpen, vehicles, initialData } = params;
  const [formData, setFormData] = useState<OrderFormData>(emptyForm());

  // Init/reset when opening or when initialData changes.
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData({
        vehicleId: initialData.vehicleId,
        patente: initialData.patente,
        cliente: initialData.cliente,
        telefono: initialData.telefono || "",
        fecha: initialData.fecha,
        descripcion: initialData.descripcion,
        repuestos: initialData.repuestos || [],
        manoDeObra: initialData.manoDeObra || 0,
        monto: initialData.monto,
        entregasCuenta: initialData.entregasCuenta || [],
        saldoPendiente: initialData.saldoPendiente || initialData.monto,
        tecnico: initialData.tecnico,
        lavado: initialData.lavado,
        estado: initialData.estado,
        observaciones: initialData.observaciones || "",
      });
      return;
    }

    if (vehicles.length === 1) {
      const v = vehicles[0];
      setFormData((prev) => ({
        ...prev,
        vehicleId: v.id,
        patente: v.patente,
        cliente: v.cliente,
        telefono: v.telefono,
        repuestos: [],
        manoDeObra: 0,
        monto: 0,
        entregasCuenta: [],
        saldoPendiente: 0,
      }));
      return;
    }

    setFormData(emptyForm());
  }, [initialData, isOpen, vehicles]);

  const repuestosSubtotal = useMemo(
    () => totalRepuestos(formData.repuestos || []),
    [formData.repuestos],
  );

  const recomputeTotals = (next: OrderFormData): OrderFormData => {
    const repuestos = next.repuestos || [];
    const entregas = next.entregasCuenta || [];
    const monto = montoTotal(repuestos, next.manoDeObra);
    const saldoPendiente = monto - totalEntregas(entregas);
    return { ...next, monto, saldoPendiente };
  };

  const setField = <K extends keyof OrderFormData>(
    key: K,
    value: OrderFormData[K],
  ) => {
    setFormData((prev) => recomputeTotals({ ...prev, [key]: value }));
  };

  const handleVehicleChange = (vehicleId: string) => {
    const v = vehicles.find((x) => x.id === vehicleId);
    if (!v) return;

    setFormData((prev) =>
      recomputeTotals({
        ...prev,
        vehicleId,
        patente: v.patente,
        cliente: v.cliente,
        telefono: v.telefono,
        repuestos: [],
        manoDeObra: 0,
        entregasCuenta: [],
        observaciones: prev.observaciones,
        descripcion: prev.descripcion,
        tecnico: prev.tecnico,
        lavado: prev.lavado,
        estado: prev.estado,
      }),
    );
  };

  // Repuestos
  const addRepuesto = () => {
    setFormData((prev) =>
      recomputeTotals({
        ...prev,
        repuestos: [...(prev.repuestos || []), { detalle: "", precio: 0 }],
      }),
    );
  };

  const updateRepuesto = (
    index: number,
    field: "detalle" | "precio",
    value: string | number,
  ) => {
    setFormData((prev) => {
      const repuestos = [...(prev.repuestos || [])];
      const current = repuestos[index] ?? { detalle: "", precio: 0 };
      repuestos[index] = {
        ...current,
        [field]:
          field === "precio" ? (Number(value) || 0) : String(value ?? ""),
      };
      return recomputeTotals({ ...prev, repuestos });
    });
  };

  const removeRepuesto = (index: number) => {
    setFormData((prev) =>
      recomputeTotals({
        ...prev,
        repuestos: (prev.repuestos || []).filter((_, i) => i !== index),
      }),
    );
  };

  const updateManoDeObra = (value: number) => {
    setFormData((prev) => recomputeTotals({ ...prev, manoDeObra: value || 0 }));
  };

  // Entregas
  const addEntrega = () => {
    setFormData((prev) =>
      recomputeTotals({
        ...prev,
        entregasCuenta: [...(prev.entregasCuenta || []), 0],
      }),
    );
  };

  const updateEntrega = (index: number, value: number) => {
    setFormData((prev) => {
      const entregas = [...(prev.entregasCuenta || [])];
      entregas[index] = value || 0;
      return recomputeTotals({ ...prev, entregasCuenta: entregas });
    });
  };

  const removeEntrega = (index: number) => {
    setFormData((prev) =>
      recomputeTotals({
        ...prev,
        entregasCuenta: (prev.entregasCuenta || []).filter((_, i) => i !== index),
      }),
    );
  };

  const reset = () => setFormData(emptyForm());

  return {
    formData,
    setFormData,
    setField,
    handleVehicleChange,
    repuestosSubtotal,
    addRepuesto,
    updateRepuesto,
    removeRepuesto,
    updateManoDeObra,
    addEntrega,
    updateEntrega,
    removeEntrega,
    reset,
  };
}

