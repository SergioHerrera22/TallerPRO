import { useState } from "react";
import { Expense } from "../types";
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

interface ExpenseFormProps {
  onSubmit: (expense: Omit<Expense, "id">) => void;
  onCancel: () => void;
}

export function ExpenseForm({ onSubmit, onCancel }: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    categoria: "Herramientas",
    descripcion: "",
    monto: 0,
    proveedor: "",
    metodoPago: "Efectivo",
  });

  const IVA_RATE = 0.21;
  const base = formData.monto / (1 + IVA_RATE);
  const iva = formData.monto - base;
  const totalSinIva = formData.monto - iva;
  const total = formData.monto;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      iva,
      total,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? value === "" // empty string should map to 0
            ? 0
            : parseFloat(value)
          : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold">Registrar Gasto</h2>
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
              <Label htmlFor="categoria">Categoría *</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, categoria: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Herramientas">Herramientas</SelectItem>
                  <SelectItem value="Repuestos">Repuestos</SelectItem>
                  <SelectItem value="Servicios">Servicios</SelectItem>
                  <SelectItem value="Alquiler">Alquiler</SelectItem>
                  <SelectItem value="Servicios Públicos">
                    Servicios Públicos
                  </SelectItem>
                  <SelectItem value="Salarios">Salarios</SelectItem>
                  <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="Seguros">Seguros</SelectItem>
                  <SelectItem value="Impuestos">Impuestos</SelectItem>
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
                placeholder="Detalle del gasto"
                required
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="monto">Monto ($) *</Label>
              <Input
                id="monto"
                name="monto"
                type="number"
                value={formData.monto}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Monto sin IVA</p>
            </div>
            <div>
              <Label htmlFor="proveedor">Proveedor</Label>
              <Input
                id="proveedor"
                name="proveedor"
                value={formData.proveedor}
                onChange={handleChange}
                placeholder="Nombre del proveedor"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="metodoPago">Método de Pago *</Label>
              <Select
                value={formData.metodoPago}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, metodoPago: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                  <SelectItem value="Tarjeta de Débito">
                    Tarjeta de Débito
                  </SelectItem>
                  <SelectItem value="Tarjeta de Crédito">
                    Tarjeta de Crédito
                  </SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.monto > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Resumen del Gasto
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Monto sin IVA:</span>
                  <span className="font-semibold">
                    $
                    {totalSinIva.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA (21%):</span>
                  <span className="font-semibold text-blue-600">
                    $
                    {iva.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-blue-300">
                  <span className="font-semibold text-gray-900">
                    Total con IVA:
                  </span>
                  <span className="font-bold text-lg text-gray-900">
                    $
                    {total.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">Registrar Gasto</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
