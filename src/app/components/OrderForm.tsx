import { useState, useEffect } from "react";
import { OrdenTrabajo, Vehicle, LineaRepuesto } from "../types";
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
    repuestos: [],
    manoDeObra: 0,
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
    } else if (vehicles.length === 1) {
      // Si solo hay un vehículo, preseleccionarlo
      const vehicle = vehicles[0];
      setFormData((prev) => ({
        ...prev,
        vehicleId: vehicle.id,
        patente: vehicle.patente,
        cliente: vehicle.cliente,
        telefono: vehicle.telefono,
        repuestos: [],
        manoDeObra: 0,
        monto: 0,
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
        repuestos: [],
        manoDeObra: 0,
        monto: 0,
        entregasCuenta: [],
        saldoPendiente: 0,
      });
    }
  };

  const calcularTotalRepuestos = (repuestos: LineaRepuesto[]) => {
    return repuestos.reduce((sum, item) => sum + item.precio, 0);
  };

  const calcularMontoTotal = (
    repuestos: LineaRepuesto[],
    manoDeObra: number,
  ) => {
    return calcularTotalRepuestos(repuestos) + manoDeObra;
  };

  const agregarRepuesto = () => {
    const newRepuestos = [
      ...(formData.repuestos || []),
      { detalle: "", precio: 0 },
    ];
    const newMonto = calcularMontoTotal(newRepuestos, formData.manoDeObra);
    const totalEntregas = (formData.entregasCuenta || []).reduce(
      (sum, entrega) => sum + entrega,
      0,
    );
    setFormData({
      ...formData,
      repuestos: newRepuestos,
      monto: newMonto,
      saldoPendiente: newMonto - totalEntregas,
    });
  };

  const actualizarRepuesto = (
    index: number,
    field: "detalle" | "precio",
    value: string | number,
  ) => {
    const newRepuestos = [...(formData.repuestos || [])];
    if (field === "precio") {
      newRepuestos[index].precio = parseFloat(value.toString()) || 0;
    } else {
      newRepuestos[index].detalle = value.toString();
    }
    const newMonto = calcularMontoTotal(newRepuestos, formData.manoDeObra);
    const totalEntregas = (formData.entregasCuenta || []).reduce(
      (sum, entrega) => sum + entrega,
      0,
    );
    setFormData({
      ...formData,
      repuestos: newRepuestos,
      monto: newMonto,
      saldoPendiente: newMonto - totalEntregas,
    });
  };

  const eliminarRepuesto = (index: number) => {
    const newRepuestos = (formData.repuestos || []).filter(
      (_, i) => i !== index,
    );
    const newMonto = calcularMontoTotal(newRepuestos, formData.manoDeObra);
    const totalEntregas = (formData.entregasCuenta || []).reduce(
      (sum, entrega) => sum + entrega,
      0,
    );
    setFormData({
      ...formData,
      repuestos: newRepuestos,
      monto: newMonto,
      saldoPendiente: newMonto - totalEntregas,
    });
  };

  const actualizarManoDeObra = (value: number) => {
    const newMonto = calcularMontoTotal(formData.repuestos || [], value);
    const totalEntregas = (formData.entregasCuenta || []).reduce(
      (sum, entrega) => sum + entrega,
      0,
    );
    setFormData({
      ...formData,
      manoDeObra: value,
      monto: newMonto,
      saldoPendiente: newMonto - totalEntregas,
    });
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
      repuestos: [],
      manoDeObra: 0,
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
          </div>

          <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-lg">Detalles de Trabajo</h3>

            {/* Sección de Repuestos */}
            <div className="space-y-3">
              <Label className="font-semibold">Repuestos Utilizados</Label>
              {formData.repuestos && formData.repuestos.length > 0 ? (
                <div className="space-y-2">
                  {formData.repuestos.map((repuesto, index) => (
                    <div
                      key={index}
                      className="flex gap-2 items-end bg-white p-3 rounded border"
                    >
                      <div className="flex-1">
                        <Label className="text-xs">Detalle</Label>
                        <Input
                          placeholder="Descripción del repuesto"
                          value={repuesto.detalle}
                          onChange={(e) =>
                            actualizarRepuesto(index, "detalle", e.target.value)
                          }
                        />
                      </div>
                      <div className="w-32">
                        <Label className="text-xs">Precio $</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={repuesto.precio}
                          onChange={(e) =>
                            actualizarRepuesto(
                              index,
                              "precio",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => eliminarRepuesto(index)}
                        className="text-red-500 hover:bg-red-50"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                  <div className="text-right text-sm font-semibold text-gray-700">
                    Subtotal Repuestos: $
                    {calcularTotalRepuestos(formData.repuestos || []).toFixed(
                      2,
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Sin repuestos agregados
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={agregarRepuesto}
                className="w-full"
              >
                + Agregar Repuesto
              </Button>
            </div>

            {/* Sección de Mano de Obra */}
            <div className="border-t pt-4">
              <Label htmlFor="manoDeObra" className="font-semibold">
                Mano de Obra $
              </Label>
              <Input
                id="manoDeObra"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.manoDeObra}
                onChange={(e) =>
                  actualizarManoDeObra(parseFloat(e.target.value) || 0)
                }
                className="mt-2"
              />
            </div>

            {/* Total */}
            <div className="border-t pt-4 bg-white p-3 rounded text-right">
              <div className="text-lg font-bold text-blue-600">
                Total: ${formData.monto.toFixed(2)}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción General *</Label>
            <Textarea
              placeholder="Descripción del trabajo realizado"
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              className="min-h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
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
                      const newEntregas = [...(formData.entregasCuenta || [])];
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
