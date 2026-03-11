import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Vehicle, Service } from "../types";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { ServiceForm } from "../components/ServiceForm";
import {
  ArrowLeft,
  Plus,
  Wrench,
  Calendar,
  DollarSign,
  User,
} from "lucide-react";
import { toast } from "sonner";

export function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [showServiceForm, setShowServiceForm] = useState(false);

  useEffect(() => {
    loadVehicle();
    loadServices();
  }, [id]);

  const loadVehicle = () => {
    const stored = localStorage.getItem("vehicles");
    if (stored) {
      const vehicles: Vehicle[] = JSON.parse(stored);
      const found = vehicles.find((v) => v.id === id);
      setVehicle(found || null);
    }
  };

  const loadServices = () => {
    const stored = localStorage.getItem("services");
    if (stored) {
      const allServices: Service[] = JSON.parse(stored);
      const vehicleServices = allServices
        .filter((s) => s.vehicleId === id)
        .map((s) => ({
          ...s,
          // localStorage may hold strings, convert back to numbers
          costo: Number(s.costo),
          kilometraje: Number(s.kilometraje),
        }));
      setServices(
        vehicleServices.sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
        ),
      );
    }
  };

  const handleAddService = (serviceData: Omit<Service, "id">) => {
    const newService: Service = {
      ...serviceData,
      id: Date.now().toString(),
    };

    const stored = localStorage.getItem("services");
    const allServices = stored ? JSON.parse(stored) : [];
    const updatedServices = [...allServices, newService];
    localStorage.setItem("services", JSON.stringify(updatedServices));

    setServices([newService, ...services]);
    setShowServiceForm(false);
    toast.success("Servicio registrado exitosamente");
  };

  const totalGastado = services.reduce(
    (sum, service) => sum + Number(service.costo),
    0,
  );

  if (!vehicle) {
    return (
      <div className="px-4 sm:px-0">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Vehículo no encontrado</p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-1">
              {vehicle.patente}
            </h1>
            <p className="text-lg text-gray-600">
              {vehicle.marca} {vehicle.modelo} {vehicle.anio} - {vehicle.color}
            </p>
          </div>
          <Button onClick={() => setShowServiceForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Servicio
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Propietario</p>
              <p className="font-semibold">{vehicle.cliente}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Teléfono</p>
              <p className="font-semibold">{vehicle.telefono}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estadísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Total Servicios</p>
              <p className="text-2xl font-semibold">{services.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Gastado</p>
              <p className="text-2xl font-semibold text-green-600">
                $
                {totalGastado.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Último Servicio</CardTitle>
          </CardHeader>
          <CardContent>
            {services.length > 0 ? (
              <div className="space-y-2">
                <p className="font-semibold">{services[0].tipo}</p>
                <p className="text-sm text-gray-600">
                  {services[0].descripcion}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(services[0].fecha).toLocaleDateString("es-AR")}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">Sin servicios registrados</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Servicios</CardTitle>
          <CardDescription>
            Todos los mantenimientos y reparaciones realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                No hay servicios registrados para este vehículo
              </p>
              <Button onClick={() => setShowServiceForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primer Servicio
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{service.tipo}</h3>
                      <p className="text-gray-600">{service.descripcion}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">
                        $
                        {service.costo.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {new Date(service.fecha).toLocaleDateString("es-AR")}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-4 w-4" />
                      {service.tecnico}
                    </div>
                    {service.kilometraje > 0 && (
                      <div className="text-gray-600">
                        {service.kilometraje.toLocaleString()} km
                      </div>
                    )}
                  </div>
                  {service.observaciones && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-600">
                        <strong>Observaciones:</strong> {service.observaciones}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showServiceForm && (
        <ServiceForm
          vehicleId={vehicle.id}
          onSubmit={handleAddService}
          onCancel={() => setShowServiceForm(false)}
        />
      )}
    </div>
  );
}
