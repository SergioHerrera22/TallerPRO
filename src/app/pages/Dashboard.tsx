import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Vehicle } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { VehicleForm } from "../components/VehicleForm";
import { Search, Plus, Car, FileText } from "lucide-react";
import { toast } from "sonner";

export function Dashboard() {
  const navigate = useNavigate();
  const [searchPatente, setSearchPatente] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [foundVehicle, setFoundVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = () => {
    const stored = localStorage.getItem("vehicles");
    if (stored) {
      setVehicles(JSON.parse(stored));
    }
  };

  const handleSearch = () => {
    if (!searchPatente.trim()) {
      toast.error("Ingrese una patente para buscar");
      return;
    }

    const vehicle = vehicles.find(
      (v) => v.patente.toUpperCase() === searchPatente.toUpperCase()
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

  const handleRegisterVehicle = (vehicleData: Omit<Vehicle, "id" | "createdAt">) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updatedVehicles = [...vehicles, newVehicle];
    localStorage.setItem("vehicles", JSON.stringify(updatedVehicles));
    setVehicles(updatedVehicles);
    setShowVehicleForm(false);
    toast.success("Vehículo registrado exitosamente");
    navigate(`/vehiculo/${newVehicle.id}`);
  };

  const recentVehicles = [...vehicles]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
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
                  No se encontró ningún vehículo con la patente <strong>{searchPatente}</strong>
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

        <Card>
          <CardHeader>
            <CardTitle>Estadísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Car className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Vehículos</p>
                  <p className="text-2xl font-semibold text-gray-900">{vehicles.length}</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setShowVehicleForm(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Vehículo
            </Button>
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
                      <p className="font-semibold text-gray-900">{vehicle.patente}</p>
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
