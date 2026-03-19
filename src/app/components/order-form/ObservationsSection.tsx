import React from "react";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

export function ObservationsSection(props: {
  observaciones: string;
  onChange: (value: string) => void;
}) {
  const { observaciones, onChange } = props;

  return (
    <div>
      <Label htmlFor="observaciones">Observaciones</Label>
      <Textarea
        placeholder="Observaciones adicionales"
        value={observaciones}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-16"
      />
    </div>
  );
}

