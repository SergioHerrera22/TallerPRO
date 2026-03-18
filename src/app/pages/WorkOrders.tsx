import { useState, useEffect } from "react";
import { OrdenTrabajo, Vehicle } from "../types";
import { db } from "../../db";
import { createId } from "../../utils";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";

import { Badge } from "../components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

import { OrderForm } from "../components/OrderForm";
import { OrderDetailModal } from "../components/OrderDetailModal";

import { Plus, Search, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { dataRepository } from "../../services/dataRepository";
import { generateNextOTNumber } from "../../services/orderNumberService";

export function WorkOrders() {
  const [orders, setOrders] = useState<OrdenTrabajo[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrdenTrabajo | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrdenTrabajo | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedOrders = await db.ordenesTrabajo.toArray();
    console.log(savedOrders);
    const savedVehicles = await db.vehicles.toArray();

    setOrders(savedOrders.filter((o) => !o.deleted));
    setVehicles(savedVehicles);
  };

  useEffect(() => {
    const handler = () => {
      loadData();
    };
    window.addEventListener("app:refreshData", handler);
    return () => window.removeEventListener("app:refreshData", handler);
  }, []);

  const handleCreateOrder = async (
    data: Omit<OrdenTrabajo, "id" | "createdAt" | "numeroOT">,
  ) => {
    const vehicle = vehicles.find((v) => v.id === data.vehicleId);

    const telefono = vehicle?.telefono || "";
    const numeroOT = await generateNextOTNumber();

    const newOrder: OrdenTrabajo = {
      ...data,
      id: createId(),
      numeroOT,
      telefono,
      createdAt: new Date().toISOString(),
    };

    await dataRepository.saveOrdenTrabajo(newOrder);

    setOrders([...orders, newOrder]);

    setShowForm(false);
    setEditingOrder(undefined);

    toast.success("Orden de trabajo creada exitosamente");
  };

  const handleUpdateOrder = async (
    data: Omit<OrdenTrabajo, "id" | "createdAt" | "numeroOT">,
  ) => {
    if (!editingOrder) return;

    const updatedOrder = {
      ...editingOrder,
      ...data,
    };

    await dataRepository.saveOrdenTrabajo(updatedOrder);

    setOrders(orders.map((o) => (o.id === editingOrder.id ? updatedOrder : o)));

    setShowForm(false);
    setEditingOrder(undefined);

    toast.success("Orden actualizada exitosamente");
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("¿Confirmá que querés eliminar esta orden de trabajo?"))
      return;

    await dataRepository.deleteOrdenTrabajo(orderId);

    setOrders(orders.filter((o) => o.id !== orderId));

    setShowDetailModal(false);

    toast.success("Orden eliminada exitosamente");
  };

  const handleEditOrder = (order: OrdenTrabajo) => {
    setEditingOrder(order);
    setShowDetailModal(false);
    setShowForm(true);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.numeroOT.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.cliente.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado =
      filterEstado === "all" || order.estado === filterEstado;

    return matchesSearch && matchesEstado;
  });

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

  const totalLavados = orders.filter((o) => o.lavado).length;
  return (
    <div className="px-4 sm:px-0 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Órdenes de Trabajo
        </h1>
        <p className="text-gray-600">
          Gestione todas las órdenes de trabajo del taller
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total OT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-gray-500">órdenes registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Con Lavado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLavados}</div>
            <p className="text-xs text-gray-500">autos lavados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o) => o.estado === "en-progreso").length}
            </div>
            <p className="text-xs text-gray-500">trabajos activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por OT, patente o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="en-progreso">En Progreso</option>
                <option value="completada">Completada</option>
              </select>
            </div>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva OT
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de órdenes */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Órdenes</CardTitle>
          <CardDescription>
            {filteredOrders.length} orden
            {filteredOrders.length !== 1 ? "es" : ""} encontrada
            {filteredOrders.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OT</TableHead>
                  <TableHead>Patente</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Lavado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDetailModal(true);
                      }}
                    >
                      <TableCell className="font-medium">
                        {order.numeroOT}
                      </TableCell>
                      <TableCell>{order.patente}</TableCell>
                      <TableCell>{order.cliente}</TableCell>
                      <TableCell>
                        {new Date(order.fecha).toLocaleDateString("es-AR")}
                      </TableCell>
                      <TableCell>${order.monto.toFixed(2)}</TableCell>
                      <TableCell>
                        {order.lavado ? (
                          <Badge className="bg-blue-100 text-blue-800">
                            Sí
                          </Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.estado)}>
                          {order.estado.charAt(0).toUpperCase() +
                            order.estado.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditOrder(order);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-gray-500">
                        No hay órdenes que coincidan con los filtros
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modales */}
      <OrderForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingOrder(undefined);
        }}
        onSubmit={editingOrder ? handleUpdateOrder : handleCreateOrder}
        vehicles={vehicles}
        initialData={editingOrder}
      />

      <OrderDetailModal
        order={selectedOrder}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onEdit={handleEditOrder}
        onDelete={handleDeleteOrder}
      />
    </div>
  );
}
