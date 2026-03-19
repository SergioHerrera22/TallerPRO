import React from "react";
import type { LineaRepuesto } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function PartsSection(props: {
  repuestos: LineaRepuesto[];
  subtotal: number;
  onAdd: () => void;
  onUpdate: (
    index: number,
    field: "detalle" | "precio",
    value: string | number,
  ) => void;
  onRemove: (index: number) => void;
}) {
  const { repuestos, subtotal, onAdd, onUpdate, onRemove } = props;

  return (
    <div className="space-y-3">
      <Label className="font-semibold">Repuestos Utilizados</Label>

      {repuestos && repuestos.length > 0 ? (
        <div className="space-y-2">
          {repuestos.map((repuesto, index) => (
            <div
              key={index}
              className="flex gap-2 items-end bg-white p-3 rounded border"
            >
              <div className="flex-1">
                <Label className="text-xs">Detalle</Label>
                <Input
                  placeholder="Descripción del repuesto"
                  value={repuesto.detalle}
                  onChange={(e) => onUpdate(index, "detalle", e.target.value)}
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
                    onUpdate(index, "precio", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRemove(index)}
                className="text-red-500 hover:bg-red-50"
              >
                ✕
              </Button>
            </div>
          ))}

          <div className="text-right text-sm font-semibold text-gray-700">
            Subtotal Repuestos: ${subtotal.toFixed(2)}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">Sin repuestos agregados</p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="w-full"
      >
        + Agregar Repuesto
      </Button>
    </div>
  );
}

