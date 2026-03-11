import { useState } from "react";
import { Service } from "../types";
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
import { X } from "lucide-react";

interface ServiceFormProps {
  vehicleId: string;
  onSubmit: (service: Omit<Service, "id">) => void;
  onCancel: () => void;
}

export function ServiceForm({
  vehicleId,
  onSubmit,
  onCancel,
}: ServiceFormProps) {
  const [formData, setFormData] = useState({
    vehicleId,
    fecha: new Date().toISOString().split("T")[0],
    tipo: "Mantenimiento",
    descripcion: "",
    kilometraje: 0,
    costo: 0,
    tecnico: "",
    observaciones: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? // ensure numeric fields are stored as numbers, defaulting to 0 when empty
            value === ""
            ? 0
            : parseFloat(value)
          : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold">Registrar Servicio</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                name="fecha"
                type="date"
                value={formData.fecha}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="tipo">Tipo de Servicio *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, tipo: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="Reparación">Reparación</SelectItem>
                  <SelectItem value="Chapa y Pintura">
                    Chapa y Pintura
                  </SelectItem>
                  <SelectItem value="Revisión">Revisión</SelectItem>
                  <SelectItem value="Cambio de Aceite">
                    Cambio de Aceite
                  </SelectItem>
                  <SelectItem value="Neumáticos">Neumáticos</SelectItem>
                  <SelectItem value="Frenos">Frenos</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Detalle del trabajo realizado"
                required
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="kilometraje">Kilometraje</Label>
              <Input
                id="kilometraje"
                name="kilometraje"
                type="number"
                value={formData.kilometraje}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="costo">Costo ($) *</Label>
              <Input
                id="costo"
                name="costo"
                type="number"
                value={formData.costo}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="tecnico">Técnico Responsable *</Label>
              <Input
                id="tecnico"
                name="tecnico"
                value={formData.tecnico}
                onChange={handleChange}
                placeholder="Nombre del técnico"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                placeholder="Notas adicionales"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">Registrar Servicio</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
