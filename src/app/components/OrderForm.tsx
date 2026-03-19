import React from "react";
import type { OrdenTrabajo, Vehicle } from "../types";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { toast } from "sonner";
import { useOrderForm } from "./order-form/useOrderForm";
import { VehicleSection } from "./order-form/VehicleSection";
import { PartsSection } from "./order-form/PartsSection";
import { LaborAndTotalSection } from "./order-form/LaborAndTotalSection";
import { DescriptionSection } from "./order-form/DescriptionSection";
import { PaymentAndStatusSection } from "./order-form/PaymentAndStatusSection";
import { ObservationsSection } from "./order-form/ObservationsSection";

interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<OrdenTrabajo, "id" | "createdAt" | "numeroOT">) => void;
  vehicles: Vehicle[];
  initialData?: OrdenTrabajo;
}

export function OrderForm({
  isOpen,
  onClose,
  onSubmit,
  vehicles,
  initialData,
}: OrderFormProps) {
  const {
    formData,
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
  } = useOrderForm({ isOpen, vehicles, initialData });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.vehicleId ||
      !formData.fecha ||
      !formData.descripcion ||
      !formData.tecnico
    ) {
      toast.error("Complete los campos obligatorios");
      return;
    }

    if (formData.monto < 0) {
      toast.error("El monto no puede ser negativo");
      return;
    }

    onSubmit(formData);
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Orden de Trabajo" : "Nueva Orden de Trabajo"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <VehicleSection
            vehicles={vehicles}
            vehicleId={formData.vehicleId}
            fecha={formData.fecha}
            patente={formData.patente}
            cliente={formData.cliente}
            telefono={formData.telefono}
            tecnico={formData.tecnico}
            onVehicleChange={handleVehicleChange}
            onFechaChange={(v) => setField("fecha", v)}
            onTecnicoChange={(v) => setField("tecnico", v)}
          />

          <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-lg">Detalles de Trabajo</h3>

            <PartsSection
              repuestos={formData.repuestos || []}
              subtotal={repuestosSubtotal}
              onAdd={addRepuesto}
              onUpdate={updateRepuesto}
              onRemove={removeRepuesto}
            />

            <LaborAndTotalSection
              manoDeObra={formData.manoDeObra}
              total={formData.monto}
              onManoDeObraChange={updateManoDeObra}
            />
          </div>

          <DescriptionSection
            descripcion={formData.descripcion}
            onChange={(v) => setField("descripcion", v)}
          />

          <PaymentAndStatusSection
            saldoPendiente={formData.saldoPendiente}
            estado={formData.estado}
            lavado={formData.lavado}
            entregasCuenta={formData.entregasCuenta || []}
            onEstadoChange={(v) => setField("estado", v)}
            onLavadoChange={(v) => setField("lavado", v)}
            onAddEntrega={addEntrega}
            onUpdateEntrega={updateEntrega}
            onRemoveEntrega={removeEntrega}
          />

          <ObservationsSection
            observaciones={formData.observaciones}
            onChange={(v) => setField("observaciones", v)}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {initialData ? "Actualizar" : "Crear"} Orden
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
