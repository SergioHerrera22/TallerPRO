import React from "react";
import type { Vehicle } from "../../types";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function VehicleSection(props: {
  vehicles: Vehicle[];
  vehicleId: string;
  fecha: string;
  patente: string;
  cliente: string;
  telefono: string;
  tecnico: string;
  onVehicleChange: (vehicleId: string) => void;
  onFechaChange: (value: string) => void;
  onTecnicoChange: (value: string) => void;
}) {
  const {
    vehicles,
    vehicleId,
    fecha,
    patente,
    cliente,
    telefono,
    tecnico,
    onVehicleChange,
    onFechaChange,
    onTecnicoChange,
  } = props;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {vehicles.length > 1 ? (
        <div>
          <Label htmlFor="vehicle">Vehículo *</Label>
          <Select value={vehicleId} onValueChange={onVehicleChange}>
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
            value={
              vehicles[0]
                ? `${vehicles[0].patente} - ${vehicles[0].marca} ${vehicles[0].modelo}`
                : ""
            }
            disabled
          />
        </div>
      )}

      <div>
        <Label htmlFor="fecha">Fecha *</Label>
        <Input type="date" value={fecha} onChange={(e) => onFechaChange(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="patente">Patente</Label>
        <Input value={patente} disabled />
      </div>

      <div>
        <Label htmlFor="cliente">Cliente</Label>
        <Input value={cliente} disabled />
      </div>

      <div>
        <Label htmlFor="telefono">Teléfono</Label>
        <Input value={telefono} disabled />
      </div>

      <div>
        <Label htmlFor="tecnico">Técnico *</Label>
        <Input
          placeholder="Técnico responsable"
          value={tecnico}
          onChange={(e) => onTecnicoChange(e.target.value)}
        />
      </div>
    </div>
  );
}

