import React from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function LaborAndTotalSection(props: {
  manoDeObra: number;
  total: number;
  onManoDeObraChange: (value: number) => void;
}) {
  const { manoDeObra, total, onManoDeObraChange } = props;

  return (
    <>
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
          value={manoDeObra}
          onChange={(e) => onManoDeObraChange(parseFloat(e.target.value) || 0)}
          className="mt-2"
        />
      </div>

      <div className="border-t pt-4 bg-white p-3 rounded text-right">
        <div className="text-lg font-bold text-blue-600">
          Total: ${total.toFixed(2)}
        </div>
      </div>
    </>
  );
}

