import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Vehicle, OrdenTrabajo } from "../types";
import { db } from "../../db";
import { createId } from "../../utils";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import { OrderForm } from "../components/OrderForm";
import { OrderDetailModal } from "../components/OrderDetailModal";

import { ArrowLeft, Plus, Wrench, Calendar, Edit2 } from "lucide-react";

import { Badge } from "../components/ui/badge";
import { toast } from "sonner";

export function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [orders, setOrders] = useState<OrdenTrabajo[]>([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrdenTrabajo | null>(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrdenTrabajo | undefined>();
  const [nextOTNumber, setNextOTNumber] = useState(1);

  useEffect(() => {
    loadVehicle();
    loadOrders();
  }, [id]);

  const loadVehicle = async () => {
    if (!id) return;

    const found = await db.vehicles.get(id);

    if (found) {
      setVehicle(found);
    } else {
      setVehicle(null);
    }
  };

  const loadOrders = async () => {
    if (!id) return;

    const vehicleOrders = await db.ordenesTrabajo
      .where("vehicleId")
      .equals(id)
      .reverse()
      .sortBy("fecha");

    setOrders(vehicleOrders);
  };

  const generateOTNumber = () => {
    const newNumber = nextOTNumber;

    setNextOTNumber(newNumber + 1);

    return `OT-${String(newNumber).padStart(3, "0")}`;
  };

  const handleAddOrder = async (
    orderData: Omit<OrdenTrabajo, "id" | "createdAt" | "numeroOT">,
  ) => {
    const newOrder: OrdenTrabajo = {
      ...orderData,
      id: createId(),
      numeroOT: generateOTNumber(),
      createdAt: new Date().toISOString(),
    };

    await db.ordenesTrabajo.add(newOrder);

    setOrders([newOrder, ...orders]);

    setShowOrderForm(false);

    toast.success("Orden de trabajo creada exitosamente");
  };

  const handleUpdateOrder = async (
    orderData: Omit<OrdenTrabajo, "id" | "createdAt" | "numeroOT">,
  ) => {
    if (!editingOrder) return;

    const updated = {
      ...editingOrder,
      ...orderData,
    };

    await db.ordenesTrabajo.put(updated);

    setOrders(orders.map((o) => (o.id === editingOrder.id ? updated : o)));

    setShowOrderForm(false);
    setEditingOrder(undefined);

    toast.success("Orden actualizada exitosamente");
  };

  const handleEditOrder = (order: OrdenTrabajo) => {
    setEditingOrder(order);
    setShowOrderDetailModal(false);
    setShowOrderForm(true);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("¿Confirmá que querés eliminar esta orden de trabajo?"))
      return;

    await db.ordenesTrabajo.delete(orderId);

    setOrders(orders.filter((o) => o.id !== orderId));

    setShowOrderDetailModal(false);

    toast.success("Orden eliminada exitosamente");
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "completada":
        return "bg-green-100 text-green-800";

      case "en-progreso":
        return "bg-blue-100 text-blue-800";

      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalGastado = orders.reduce((sum, order) => sum + order.monto, 0);

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
          <Button onClick={() => setShowOrderForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Orden de Trabajo
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
              <p className="text-sm text-gray-600">Total Órdenes</p>
              <p className="text-2xl font-semibold">{orders.length}</p>
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
            <CardTitle className="text-lg">Última Orden</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length > 0 ? (
              <div className="space-y-2">
                <p className="font-semibold">{orders[0].numeroOT}</p>
                <p className="text-sm text-gray-600">{orders[0].descripcion}</p>
                <p className="text-sm text-gray-500">
                  {new Date(orders[0].fecha).toLocaleDateString("es-AR")}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">Sin órdenes registradas</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Órdenes de Trabajo</CardTitle>
          <CardDescription>
            Todas las órdenes de trabajo realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                No hay órdenes registradas para este vehículo
              </p>
              <Button onClick={() => setShowOrderForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primera Orden
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowOrderDetailModal(true);
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {order.numeroOT}
                      </h3>
                      <p className="text-gray-600">{order.descripcion}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(order.estado)}>
                        {order.estado === "completada"
                          ? "Completada"
                          : order.estado === "en-progreso"
                            ? "En Progreso"
                            : "Pendiente"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditOrder(order);
                        }}
                        className="p-1 h-8 w-8"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <p className="text-lg font-semibold text-green-600">
                        $
                        {order.monto.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {new Date(order.fecha).toLocaleDateString("es-AR")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showOrderForm && (
        <OrderForm
          isOpen={showOrderForm}
          onClose={() => setShowOrderForm(false)}
          onSubmit={editingOrder ? handleUpdateOrder : handleAddOrder}
          vehicles={[vehicle]}
          initialData={editingOrder}
        />
      )}

      <OrderDetailModal
        order={selectedOrder}
        isOpen={showOrderDetailModal}
        onClose={() => setShowOrderDetailModal(false)}
        onEdit={handleEditOrder}
        onDelete={handleDeleteOrder}
      />
    </div>
  );
}
