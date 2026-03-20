import { useState } from "react";
import { Vehicle } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { X } from "lucide-react";

interface VehicleFormProps {
  patente?: string;
  initialData?: Vehicle;
  onSubmit: (vehicle: Omit<Vehicle, "id" | "createdAt">) => void;
  onCancel: () => void;
}

export function VehicleForm({
  patente = "",
  initialData,
  onSubmit,
  onCancel,
}: VehicleFormProps) {
  const [formData, setFormData] = useState({
    patente: (initialData?.patente ?? patente).toUpperCase(),
    marca: initialData?.marca ?? "",
    modelo: initialData?.modelo ?? "",
    anio: initialData?.anio ?? new Date().getFullYear(),
    color: initialData?.color ?? "",
    cliente: initialData?.cliente ?? "",
    telefono: initialData?.telefono ?? "",
    kilometros: initialData?.kilometros ?? 0,
  });

  const isEditMode = Boolean(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "patente" ? value.toUpperCase() : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold">
            {isEditMode ? "Editar Vehículo" : "Registrar Nuevo Vehículo"}
          </h2>
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
              <Label htmlFor="patente">Patente *</Label>
              <Input
                id="patente"
                name="patente"
                value={formData.patente}
                onChange={handleChange}
                placeholder="ABC123"
                required
                className="uppercase"
              />
            </div>
            <div>
              <Label htmlFor="marca">Marca *</Label>
              <Input
                id="marca"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                placeholder="Toyota"
                required
              />
            </div>
            <div>
              <Label htmlFor="modelo">Modelo *</Label>
              <Input
                id="modelo"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                placeholder="Corolla"
                required
              />
            </div>
            <div>
              <Label htmlFor="anio">Año *</Label>
              <Input
                id="anio"
                name="anio"
                type="number"
                value={formData.anio}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                required
              />
            </div>
            <div>
              <Label htmlFor="color">Color *</Label>
              <Input
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="Blanco"
                required
              />
            </div>
            <div>
              <Label htmlFor="cliente">Cliente *</Label>
              <Input
                id="cliente"
                name="cliente"
                value={formData.cliente}
                onChange={handleChange}
                placeholder="Nombre del propietario"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                name="telefono"
                type="tel"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="011-4444-5555"
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="kilometros">Kilómetros *</Label>
              <Input
                id="kilometros"
                name="kilometros"
                type="number"
                value={formData.kilometros}
                onChange={handleChange}
                placeholder="Ej: 120000"
                min="0"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditMode ? "Guardar Cambios" : "Registrar Vehículo"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
