import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Vehicle, Expense, CuentaCorriente } from "../types";
import { db } from "../../db";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import { VehicleForm } from "../components/VehicleForm";

import { Search, Plus, Car, FileText } from "lucide-react";
import { toast } from "sonner";
import { createId } from "../../utils";
import { dataRepository } from "../../services/dataRepository";
export function Dashboard() {
  const navigate = useNavigate();

  const [searchPatente, setSearchPatente] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [foundVehicle, setFoundVehicle] = useState<Vehicle | null>(null);
  const [deudaCuentasCorrientes, setDeudaCuentasCorrientes] = useState(0);
  const [egresosTotales, setEgresosTotales] = useState(0);

  useEffect(() => {
    loadVehicles();
    loadDeudaCuentasCorrientes();
    loadEgresosTotales();
  }, []);

  useEffect(() => {
    const handler = () => {
      loadVehicles();
      loadDeudaCuentasCorrientes();
      loadEgresosTotales();
    };

    window.addEventListener("app:refreshData", handler);
    return () => window.removeEventListener("app:refreshData", handler);
  }, []);

  const loadVehicles = async () => {
    const vehiclesDB = await db.vehicles.toArray();
    setVehicles(vehiclesDB);
  };

  const loadDeudaCuentasCorrientes = async () => {
    const cuentas: CuentaCorriente[] = await db.cuentasCorrientes.toArray();
    // Sumar solo los saldos negativos (deuda)
    const totalDeuda = cuentas
      .filter((c) => c.saldo < 0)
      .reduce((sum, c) => sum + c.saldo, 0);
    setDeudaCuentasCorrientes(totalDeuda);
  };

  const loadEgresosTotales = async () => {
    const egresos: Expense[] = await db.expenses.toArray();
    // Sumar todos los gastos realizados
    const totalEgresos = egresos.reduce(
      (sum, e) => sum + (e.total || e.monto || 0),
      0,
    );
    setEgresosTotales(totalEgresos);
  };

  const handleSearch = () => {
    if (!searchPatente.trim()) {
      toast.error("Ingrese una patente para buscar");
      return;
    }

    const vehicle = vehicles.find(
      (v) => v.patente.toUpperCase() === searchPatente.toUpperCase(),
    );

    setSearchAttempted(true);
    setFoundVehicle(vehicle || null);

    if (vehicle) {
      navigate(`/vehiculo/${vehicle.id}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleRegisterVehicle = async (
    vehicleData: Omit<Vehicle, "id" | "createdAt">,
  ) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: createId(),
      createdAt: new Date().toISOString(),
    };

    // Guardar kilometros en supabase si corresponde
    // await supabase.from('vehicles').insert([{ ...newVehicle }]);

    await dataRepository.saveVehicle(newVehicle);

    setVehicles([...vehicles, newVehicle]);
    setShowVehicleForm(false);

    toast.success("Vehículo registrado exitosamente");

    navigate(`/vehiculo/${newVehicle.id}`);
  };

  const recentVehicles = [...vehicles]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);
  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Sistema de Gestión del Taller
        </h1>
        <p className="text-gray-600">
          Busque vehículos por patente o registre uno nuevo
        </p>
      </div>

      {/* Estadística de autos cargados y botón */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Autos cargados
            </CardTitle>
            <CardDescription className="text-white/80">
              Total de vehículos registrados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{vehicles.length}</span>
              <Button
                variant="secondary"
                className="bg-white text-blue-600 font-semibold"
                onClick={() => setShowVehicleForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar nuevo auto
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Buscador de vehículos */}
        <Card>
          <CardHeader>
            <CardTitle>Buscar Vehículo</CardTitle>
            <CardDescription>
              Ingrese la patente para ver el historial de servicios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Ej: ABC123"
                  value={searchPatente}
                  onChange={(e) => {
                    setSearchPatente(e.target.value.toUpperCase());
                    setSearchAttempted(false);
                  }}
                  onKeyPress={handleKeyPress}
                  className="uppercase text-lg"
                />
              </div>
              <Button onClick={handleSearch} size="lg">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>

            {searchAttempted && !foundVehicle && searchPatente && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 mb-3">
                  No se encontró ningún vehículo con la patente{" "}
                  <strong>{searchPatente}</strong>
                </p>
                <Button
                  onClick={() => setShowVehicleForm(true)}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar este vehículo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {recentVehicles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vehículos Recientes</CardTitle>
            <CardDescription>Últimos vehículos registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  onClick={() => navigate(`/vehiculo/${vehicle.id}`)}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Car className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {vehicle.patente}
                      </p>
                      <p className="text-sm text-gray-600">
                        {vehicle.marca} {vehicle.modelo} ({vehicle.anio})
                      </p>
                      <p className="text-sm text-gray-500">{vehicle.cliente}</p>
                    </div>
                  </div>
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showVehicleForm && (
        <VehicleForm
          patente={searchPatente}
          onSubmit={handleRegisterVehicle}
          onCancel={() => setShowVehicleForm(false)}
        />
      )}
    </div>
  );
}
