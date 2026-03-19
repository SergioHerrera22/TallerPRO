import React from "react";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function PaymentAndStatusSection(props: {
  saldoPendiente: number;
  estado: string;
  lavado: boolean;
  entregasCuenta: number[];
  onEstadoChange: (value: "pendiente" | "en-progreso" | "completada") => void;
  onLavadoChange: (checked: boolean) => void;
  onAddEntrega: () => void;
  onUpdateEntrega: (index: number, value: number) => void;
  onRemoveEntrega: (index: number) => void;
}) {
  const {
    saldoPendiente,
    estado,
    lavado,
    entregasCuenta,
    onEstadoChange,
    onLavadoChange,
    onAddEntrega,
    onUpdateEntrega,
    onRemoveEntrega,
  } = props;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div>
          <Label>Saldo Pendiente $</Label>
          <Input
            type="number"
            step="0.01"
            value={saldoPendiente}
            disabled
            className={
              saldoPendiente > 0
                ? "border-red-300 bg-red-50"
                : "border-green-300 bg-green-50"
            }
          />
          <p className="text-xs text-gray-500 mt-1">
            {saldoPendiente > 0
              ? `El cliente debe $${saldoPendiente.toFixed(2)}`
              : "Pago completo"}
          </p>
        </div>

        <div>
          <Label htmlFor="estado">Estado</Label>
          <Select
            value={estado}
            onValueChange={(value) =>
              onEstadoChange(value as "pendiente" | "en-progreso" | "completada")
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

        <div className="flex items-center space-x-2 sm:pt-8">
          <Checkbox
            id="lavado"
            checked={lavado}
            onCheckedChange={(checked) => onLavadoChange(Boolean(checked))}
          />
          <Label htmlFor="lavado" className="cursor-pointer">
            Incluir Lavado
          </Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Entregas a Cuenta</Label>
        {entregasCuenta &&
          entregasCuenta.map((entrega, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={entrega}
                onChange={(e) => onUpdateEntrega(index, parseFloat(e.target.value) || 0)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRemoveEntrega(index)}
              >
                ✕
              </Button>
            </div>
          ))}

        <Button type="button" variant="outline" size="sm" onClick={onAddEntrega}>
          + Agregar Entrega
        </Button>
      </div>
    </>
  );
}

