import { useState, useEffect } from "react";
import { OrdenTrabajo, Vehicle } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { toast } from "sonner";

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
  const [formData, setFormData] = useState<
    Omit<OrdenTrabajo, "id" | "createdAt" | "numeroOT">
  >({
    vehicleId: "",
    patente: "",
    cliente: "",
    telefono: "",
    fecha: new Date().toISOString().split("T")[0],
    descripcion: "",
    monto: 0,
    entregasCuenta: [],
    saldoPendiente: 0,
    tecnico: "",
    lavado: false,
    estado: "pendiente",
    observaciones: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        vehicleId: initialData.vehicleId,
        patente: initialData.patente,
        cliente: initialData.cliente,
        telefono: initialData.telefono || "",
        fecha: initialData.fecha,
        descripcion: initialData.descripcion,
        monto: initialData.monto,
        entregasCuenta: initialData.entregasCuenta || [],
        saldoPendiente: initialData.saldoPendiente || initialData.monto,
        tecnico: initialData.tecnico,
        lavado: initialData.lavado,
        estado: initialData.estado,
        observaciones: initialData.observaciones || "",
      });
    } else if (vehicles.length === 1) {
      // Si solo hay un vehículo, preseleccionarlo
      const vehicle = vehicles[0];
      setFormData((prev) => ({
        ...prev,
        vehicleId: vehicle.id,
        patente: vehicle.patente,
        cliente: vehicle.cliente,
        telefono: vehicle.telefono,
        entregasCuenta: [],
        saldoPendiente: 0,
      }));
    }
  }, [initialData, isOpen, vehicles]);

  const handleVehicleChange = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      setFormData({
        ...formData,
        vehicleId,
        patente: vehicle.patente,
        cliente: vehicle.cliente,
        telefono: vehicle.telefono,
        entregasCuenta: [],
        saldoPendiente: 0,
      });
    }
  };

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
    setFormData({
      vehicleId: "",
      patente: "",
      cliente: "",
      fecha: new Date().toISOString().split("T")[0],
      descripcion: "",
      monto: 0,
      tecnico: "",
      lavado: false,
      estado: "pendiente",
      observaciones: "",
    });
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
          <div className="grid grid-cols-2 gap-4">
            {vehicles.length > 1 ? (
              <div>
                <Label htmlFor="vehicle">Vehículo *</Label>
                <Select
                  value={formData.vehicleId}
                  onValueChange={handleVehicleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione vehículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.patente} - {v.marca} {v.modelo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label>Vehículo</Label>
                <Input
                  value={`${vehicles[0]?.patente} - ${vehicles[0]?.marca} ${vehicles[0]?.modelo}`}
                  disabled
                />
              </div>
            )}

            <div>
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                type="date"
                value={formData.fecha}
                onChange={(e) =>
                  setFormData({ ...formData, fecha: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="patente">Patente</Label>
              <Input value={formData.patente} disabled />
            </div>

            <div>
              <Label htmlFor="cliente">Cliente</Label>
              <Input value={formData.cliente} disabled />
            </div>

            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input value={formData.telefono} disabled />
            </div>

            <div>
              <Label htmlFor="tecnico">Técnico *</Label>
              <Input
                placeholder="Técnico responsable"
                value={formData.tecnico}
                onChange={(e) =>
                  setFormData({ ...formData, tecnico: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="monto">Monto Total $</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.monto}
                onChange={(e) => {
                  const newMonto = parseFloat(e.target.value) || 0;
                  const totalEntregas = (formData.entregasCuenta || []).reduce(
                    (sum, entrega) => sum + entrega,
                    0,
                  );
                  setFormData({
                    ...formData,
                    monto: newMonto,
                    saldoPendiente: newMonto - totalEntregas,
                  });
                }}
              />
            </div>

            {/* Entregas a cuenta */}
            <div className="space-y-2">
              <Label>Entregas a Cuenta</Label>
              {formData.entregasCuenta &&
                formData.entregasCuenta.map((entrega, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={entrega}
                      onChange={(e) => {
                        const newEntregas = [
                          ...(formData.entregasCuenta || []),
                        ];
                        newEntregas[index] = parseFloat(e.target.value) || 0;
                        const totalEntregas = newEntregas.reduce(
                          (sum, ent) => sum + ent,
                          0,
                        );
                        setFormData({
                          ...formData,
                          entregasCuenta: newEntregas,
                          saldoPendiente: formData.monto - totalEntregas,
                        });
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newEntregas = (
                          formData.entregasCuenta || []
                        ).filter((_, i) => i !== index);
                        const totalEntregas = newEntregas.reduce(
                          (sum, ent) => sum + ent,
                          0,
                        );
                        setFormData({
                          ...formData,
                          entregasCuenta: newEntregas,
                          saldoPendiente: formData.monto - totalEntregas,
                        });
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData({
                    ...formData,
                    entregasCuenta: [...(formData.entregasCuenta || []), 0],
                  });
                }}
              >
                + Agregar Entrega
              </Button>
            </div>

            <div>
              <Label>Saldo Pendiente $</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.saldoPendiente}
                disabled
                className={
                  formData.saldoPendiente > 0
                    ? "border-red-300 bg-red-50"
                    : "border-green-300 bg-green-50"
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.saldoPendiente > 0
                  ? `El cliente debe $${formData.saldoPendiente.toFixed(2)}`
                  : "Pago completo"}
              </p>
            </div>

            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, estado: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en-progreso">En Progreso</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="lavado"
                checked={formData.lavado}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, lavado: checked as boolean })
                }
              />
              <Label htmlFor="lavado" className="cursor-pointer">
                Incluir Lavado
              </Label>
            </div>
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              placeholder="Descripción del trabajo realizado"
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              className="min-h-24"
            />
          </div>

          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              placeholder="Observaciones adicionales"
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
              className="min-h-16"
            />
          </div>

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
