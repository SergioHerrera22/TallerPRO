import { useState, useEffect } from "react";
import { Cheque, Vehicle } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
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

interface ChequeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Cheque, "id" | "createdAt">) => void;
  initialData?: Cheque;
}

export function ChequeForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: ChequeFormProps) {
  const [formData, setFormData] = useState<Omit<Cheque, "id" | "createdAt">>({
    fechaRecepcion: new Date().toISOString().split("T")[0],
    fechaCobro: new Date().toISOString().split("T")[0],
    emisor: "",
    destino: "",
    estado: "en-cartera",
    monto: 0,
    numero: "",
    observaciones: "",
    clienteId: undefined,
  });

  const [clientes, setClientes] = useState<string[]>([]);

  useEffect(() => {
    // Cargar lista de clientes únicos de los vehículos registrados
    const storedVehicles = localStorage.getItem("vehicles");
    if (storedVehicles) {
      const vehicles: Vehicle[] = JSON.parse(storedVehicles);
      const clientesUnicos = [
        ...new Set(vehicles.map((v) => v.cliente)),
      ].sort();
      setClientes(clientesUnicos);
    }
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        fechaRecepcion: initialData.fechaRecepcion,
        fechaCobro: initialData.fechaCobro,
        emisor: initialData.emisor,
        destino: initialData.destino,
        estado: initialData.estado,
        monto: initialData.monto,
        numero: initialData.numero || "",
        observaciones: initialData.observaciones || "",
        clienteId: initialData.clienteId,
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.destino) {
      toast.error("Complete el campo destino");
      return;
    }

    if (formData.monto < 0) {
      toast.error("El monto no puede ser negativo");
      return;
    }

    onSubmit(formData);
    setFormData({
      fechaRecepcion: new Date().toISOString().split("T")[0],
      fechaCobro: new Date().toISOString().split("T")[0],
      emisor: "",
      destino: "",
      estado: "en-cartera",
      monto: 0,
      numero: "",
      observaciones: "",
      clienteId: undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Cheque" : "Registrar Cheque"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero">Número de Cheque</Label>
              <Input
                placeholder="Ej: 123456"
                value={formData.numero}
                onChange={(e) =>
                  setFormData({ ...formData, numero: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="monto">Monto $</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.monto}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    monto: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="fechaRecepcion">Fecha de Recepción *</Label>
              <Input
                type="date"
                value={formData.fechaRecepcion}
                onChange={(e) =>
                  setFormData({ ...formData, fechaRecepcion: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="fechaCobro">Fecha de Cobro (Vencimiento) *</Label>
              <Input
                type="date"
                value={formData.fechaCobro}
                onChange={(e) =>
                  setFormData({ ...formData, fechaCobro: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="emisor">Emisor (Quién lo entregó)</Label>
              <Select
                value={formData.emisor}
                onValueChange={(value) => {
                  // Si el valor está en la lista de clientes, buscar el id correspondiente
                  const storedVehicles = localStorage.getItem("vehicles");
                  let clienteId = undefined;
                  if (storedVehicles) {
                    const vehicles = JSON.parse(storedVehicles);
                    const clienteEncontrado = vehicles.find(
                      (v: any) => v.cliente === value,
                    );
                    if (clienteEncontrado) {
                      clienteId = clienteEncontrado.id;
                    }
                  }

                  setFormData({
                    ...formData,
                    emisor: value,
                    clienteId: clienteId,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente o ingresar manualmente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente} value={cliente}>
                      {cliente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Selecciona un cliente registrado o deja vacío para ingresar
                manualmente
              </p>
            </div>

            <div>
              <Label htmlFor="destino">Destino (A quién lo entregué) *</Label>
              <Input
                placeholder="Nombre del beneficiario"
                value={formData.destino}
                onChange={(e) =>
                  setFormData({ ...formData, destino: e.target.value })
                }
              />
            </div>

            <div className="col-span-2">
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
                  <SelectItem value="en-cartera">En Cartera</SelectItem>
                  <SelectItem value="entregado">Entregado</SelectItem>
                  <SelectItem value="cobrado">Cobrado</SelectItem>
                  <SelectItem value="imputado">Imputado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              placeholder="Observaciones adicionales"
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
              className="min-h-20"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {initialData ? "Actualizar" : "Registrar"} Cheque
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
