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

import { Search, Plus, Car, FileText, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createId } from "../../utils";
import { dataRepository } from "../../services/dataRepository";

export function Dashboard() {
  const ITEMS_PER_PAGE = 6;

  const navigate = useNavigate();

  const [searchPatente, setSearchPatente] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [foundVehicle, setFoundVehicle] = useState<Vehicle | null>(null);
  const [deudaCuentasCorrientes, setDeudaCuentasCorrientes] = useState(0);
  const [egresosTotales, setEgresosTotales] = useState(0);
  const [listSearchTerm, setListSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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
    setVehicles(vehiclesDB.filter((vehicle) => !vehicle.deleted));
  };

  const loadDeudaCuentasCorrientes = async () => {
    const cuentas: CuentaCorriente[] = await db.cuentasCorrientes.toArray();
    const totalDeuda = cuentas
      .filter((c) => c.saldo < 0)
      .reduce((sum, c) => sum + c.saldo, 0);
    setDeudaCuentasCorrientes(totalDeuda);
  };

  const loadEgresosTotales = async () => {
    const egresos: Expense[] = await db.expenses.toArray();
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

    await dataRepository.saveVehicle(newVehicle);

    setVehicles((prev) => [...prev, newVehicle]);
    setShowVehicleForm(false);
    setEditingVehicle(null);

    toast.success("Vehículo registrado exitosamente");

    navigate(`/vehiculo/${newVehicle.id}`);
  };

  const handleUpdateVehicle = async (
    vehicleData: Omit<Vehicle, "id" | "createdAt">,
  ) => {
    if (!editingVehicle) return;

    const updatedVehicle: Vehicle = {
      ...editingVehicle,
      ...vehicleData,
    };

    await dataRepository.saveVehicle(updatedVehicle);

    setVehicles((prev) =>
      prev.map((vehicle) =>
        vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle,
      ),
    );

    setShowVehicleForm(false);
    setEditingVehicle(null);
    toast.success("Vehículo actualizado exitosamente");
  };

  const handleOpenCreateVehicle = () => {
    setEditingVehicle(null);
    setShowVehicleForm(true);
  };

  const handleOpenEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowVehicleForm(true);
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    const shouldDelete = window.confirm(
      `¿Seguro que querés eliminar el vehículo ${vehicle.patente}?`,
    );

    if (!shouldDelete) return;

    await dataRepository.deleteVehicle(vehicle.id);

    setVehicles((prev) => prev.filter((item) => item.id !== vehicle.id));

    if (editingVehicle?.id === vehicle.id) {
      setEditingVehicle(null);
      setShowVehicleForm(false);
    }

    toast.success("Vehículo eliminado exitosamente");
  };

  const normalizedListSearchTerm = listSearchTerm.trim().toLowerCase();

  const filteredVehicles = [...vehicles]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .filter((vehicle) => {
      if (!normalizedListSearchTerm) return true;

      const searchableText = [
        vehicle.patente,
        vehicle.cliente,
        vehicle.marca,
        vehicle.modelo,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedListSearchTerm);
    });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedVehicles = filteredVehicles.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [listSearchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
                onClick={handleOpenCreateVehicle}
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar nuevo auto
              </Button>
            </div>
          </CardContent>
        </Card>

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
                  onClick={handleOpenCreateVehicle}
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

      {vehicles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vehículos Cargados</CardTitle>
            <CardDescription>
              Visualización paginada con búsqueda por patente, cliente y modelo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
              <Input
                placeholder="Filtrar por patente, cliente o vehículo"
                value={listSearchTerm}
                onChange={(e) => setListSearchTerm(e.target.value)}
                className="sm:max-w-sm"
              />
              <p className="text-sm text-gray-600">
                Mostrando {paginatedVehicles.length} de{" "}
                {filteredVehicles.length} vehículos
              </p>
            </div>

            <div className="space-y-3">
              {paginatedVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Car className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">
                        {vehicle.patente}
                      </p>
                      <p className="text-sm text-gray-600">
                        {vehicle.marca} {vehicle.modelo} ({vehicle.anio})
                      </p>
                      <p className="text-sm text-gray-500">{vehicle.cliente}</p>
                      <p className="text-xs text-gray-500">
                        Registrado:{" "}
                        {new Date(vehicle.createdAt).toLocaleDateString(
                          "es-AR",
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditVehicle(vehicle)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/vehiculo/${vehicle.id}`)}
                    >
                      <FileText className="h-4 w-4" />
                      Ver
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => void handleDeleteVehicle(vehicle)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredVehicles.length === 0 && (
              <p className="text-sm text-gray-600 mt-4">
                No hay vehículos que coincidan con el filtro.
              </p>
            )}

            {filteredVehicles.length > ITEMS_PER_PAGE && (
              <div className="mt-6 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={safeCurrentPage === 1}
                >
                  Anterior
                </Button>
                <p className="text-sm text-gray-600">
                  Página {safeCurrentPage} de {totalPages}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={safeCurrentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showVehicleForm && (
        <VehicleForm
          patente={searchPatente}
          initialData={editingVehicle ?? undefined}
          onSubmit={
            editingVehicle ? handleUpdateVehicle : handleRegisterVehicle
          }
          onCancel={() => {
            setShowVehicleForm(false);
            setEditingVehicle(null);
          }}
        />
      )}
    </div>
  );
}
