import React from "react";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

export function DescriptionSection(props: {
  descripcion: string;
  onChange: (value: string) => void;
}) {
  const { descripcion, onChange } = props;

  return (
    <div>
      <Label htmlFor="descripcion">Descripción General *</Label>
      <Textarea
        placeholder="Descripción del trabajo realizado"
        value={descripcion}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-24"
      />
    </div>
  );
}

