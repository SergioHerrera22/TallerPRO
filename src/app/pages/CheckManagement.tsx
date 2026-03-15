import { useState, useEffect } from "react";
import { Cheque, OrdenTrabajo, Vehicle } from "../types";
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

import { Badge } from "../components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

import { ChequeForm } from "../components/ChequeForm";

import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  DollarSign,
} from "lucide-react";

import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export function CheckManagement() {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenTrabajo[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCheque, setEditingCheque] = useState<Cheque | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showImputacionModal, setShowImputacionModal] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<string>("");

  useEffect(() => {
    loadCheques();
  }, []);

  const loadCheques = async () => {
    const chequesDB = await db.cheques.toArray();
    const ordenesDB = await db.ordenesTrabajo.toArray();
    const vehiclesDB = await db.vehicles.toArray();

    setCheques(chequesDB);
    setOrdenesTrabajo(ordenesDB);
    setVehicles(vehiclesDB);
  };

  const handleCreateCheque = async (data: Omit<Cheque, "id" | "createdAt">) => {
    const newCheque: Cheque = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    await db.cheques.add(newCheque);

    setCheques([...cheques, newCheque]);
    setShowForm(false);
    setEditingCheque(undefined);

    toast.success("Cheque registrado exitosamente");
  };

  const handleUpdateCheque = async (data: Omit<Cheque, "id" | "createdAt">) => {
    if (!editingCheque) return;

    const updatedCheque = {
      ...editingCheque,
      ...data,
    };

    await db.cheques.put(updatedCheque);

    const updated = cheques.map((c) =>
      c.id === editingCheque.id ? updatedCheque : c,
    );

    setCheques(updated);
    setShowForm(false);
    setEditingCheque(undefined);

    toast.success("Cheque actualizado exitosamente");
  };

  const handleDeleteCheque = async (chequeId: string) => {
    if (confirm("¿Confirmá que querés eliminar este cheque?")) {
      await db.cheques.delete(chequeId);

      const updated = cheques.filter((c) => c.id !== chequeId);
      setCheques(updated);

      setShowDetailModal(false);

      toast.success("Cheque eliminado exitosamente");
    }
  };

  const handleImputarCheque = async () => {
    if (!selectedCheque || !selectedClienteId) return;

    const clienteSeleccionado = vehicles.find(
      (v) => v.id === selectedClienteId,
    );

    if (!clienteSeleccionado) {
      toast.error("Cliente no encontrado");
      return;
    }

    const ordenesClienteConDeuda = ordenesTrabajo
      .filter(
        (orden) =>
          orden.cliente === clienteSeleccionado.cliente &&
          orden.saldoPendiente > 0,
      )
      .sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
      );

    if (ordenesClienteConDeuda.length === 0) {
      toast.error("El cliente seleccionado no tiene deudas pendientes");
      return;
    }

    const deudaTotalCliente = ordenesClienteConDeuda.reduce(
      (sum, orden) => sum + orden.saldoPendiente,
      0,
    );

    if (selectedCheque.monto > deudaTotalCliente) {
      toast.error(
        `El monto del cheque ($${selectedCheque.monto.toFixed(
          2,
        )}) excede la deuda total del cliente ($${deudaTotalCliente.toFixed(
          2,
        )})`,
      );
      return;
    }

    let montoRestante = selectedCheque.monto;

    const updatedOrdenes = ordenesTrabajo.map((orden) => {
      if (
        orden.cliente === clienteSeleccionado.cliente &&
        orden.saldoPendiente > 0 &&
        montoRestante > 0
      ) {
        const pagoAplicado = Math.min(montoRestante, orden.saldoPendiente);

        montoRestante -= pagoAplicado;

        return {
          ...orden,
          entregasCuenta: [...(orden.entregasCuenta || []), pagoAplicado],
          saldoPendiente: orden.saldoPendiente - pagoAplicado,
        };
      }

      return orden;
    });

    const updatedCheques = cheques.map((cheque) =>
      cheque.id === selectedCheque.id
        ? {
            ...cheque,
            estado: "imputado" as const,
            clienteId: selectedClienteId,
            fechaImputacion: new Date().toISOString(),
            observaciones: `${
              cheque.observaciones || ""
            } Imputado a cliente ${clienteSeleccionado.cliente}`.trim(),
          }
        : cheque,
    );

    await db.cheques.bulkPut(updatedCheques);
    await db.ordenesTrabajo.bulkPut(updatedOrdenes);

    setCheques(updatedCheques);
    setOrdenesTrabajo(updatedOrdenes);

    setShowImputacionModal(false);
    setSelectedClienteId("");
    setShowDetailModal(false);

    toast.success(
      `Cheque imputado exitosamente a ${clienteSeleccionado.cliente}`,
    );
  };

  const getClientesConDeuda = () => {
    const clientesConDeuda = new Set<string>();

    ordenesTrabajo.forEach((orden) => {
      if (orden.saldoPendiente > 0) {
        clientesConDeuda.add(orden.cliente);
      }
    });

    return vehicles.filter((vehicle) => clientesConDeuda.has(vehicle.cliente));
  };

  const filteredCheques = cheques.filter((cheque) => {
    const matchesSearch =
      cheque.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cheque.emisor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cheque.destino.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado =
      filterEstado === "all" || cheque.estado === filterEstado;

    return matchesSearch && matchesEstado;
  });

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "cobrado":
        return "bg-green-100 text-green-800";
      case "entregado":
        return "bg-blue-100 text-blue-800";
      case "imputado":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusLabel = (estado: string) => {
    switch (estado) {
      case "cobrado":
        return "Cobrado";
      case "entregado":
        return "Entregado";
      case "imputado":
        return "Imputado";
      default:
        return "En Cartera";
    }
  };

  const totalMonto = filteredCheques.reduce((sum, c) => sum + c.monto, 0);
  const chequesEnCartera = filteredCheques.filter(
    (c) => c.estado === "en-cartera",
  ).length;
  const chequesCobrados = filteredCheques.filter(
    (c) => c.estado === "cobrado",
  ).length;
  const chequesImputados = filteredCheques.filter(
    (c) => c.estado === "imputado",
  ).length;

  const handleEditCheque = (cheque: Cheque) => {
    setEditingCheque(cheque);
    setShowForm(true);
  };

  return (
    <div className="px-4 sm:px-0 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Gestión de Cheques
        </h1>
        <p className="text-gray-600">
          Registre y controle los cheques recibidos y entregados
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Registrado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMonto.toFixed(2)}</div>
            <p className="text-xs text-gray-500">en cheques</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En Cartera</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {chequesEnCartera}
            </div>
            <p className="text-xs text-gray-500">por cobrar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cobrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {chequesCobrados}
            </div>
            <p className="text-xs text-gray-500">completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Imputados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {chequesImputados}
            </div>
            <p className="text-xs text-gray-500">a deudas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cheques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCheques.length}</div>
            <p className="text-xs text-gray-500">registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda y Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por número, emisor o destino..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="en-cartera">En Cartera</option>
              <option value="entregado">Entregado</option>
              <option value="imputado">Imputado</option>
              <option value="cobrado">Cobrado</option>
            </select>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Cheque
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de cheques */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Cheques</CardTitle>
          <CardDescription>
            {filteredCheques.length} cheque
            {filteredCheques.length !== 1 ? "s" : ""} encontrado
            {filteredCheques.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Emisor</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>F. Recepción</TableHead>
                  <TableHead>F. Cobro</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCheques.length > 0 ? (
                  filteredCheques.map((cheque) => (
                    <TableRow
                      key={cheque.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSelectedCheque(cheque);
                        setShowDetailModal(true);
                      }}
                    >
                      <TableCell className="font-medium">
                        {cheque.numero || "—"}
                      </TableCell>
                      <TableCell>{cheque.emisor}</TableCell>
                      <TableCell>{cheque.destino}</TableCell>
                      <TableCell>
                        {new Date(cheque.fechaRecepcion).toLocaleDateString(
                          "es-AR",
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(cheque.fechaCobro).toLocaleDateString(
                          "es-AR",
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${cheque.monto.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(cheque.estado)}>
                          {getStatusLabel(cheque.estado)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {cheque.estado === "en-cartera" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCheque(cheque);
                                setShowImputacionModal(true);
                              }}
                              title="Imputar a deuda"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCheque(cheque);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-gray-500">
                        No hay cheques que coincidan con los filtros
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
      <ChequeForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingCheque(undefined);
        }}
        onSubmit={editingCheque ? handleUpdateCheque : handleCreateCheque}
        initialData={editingCheque}
      />

      {/* Modal de detalle */}
      {selectedCheque && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Detalle del Cheque {selectedCheque.numero}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Número</p>
                  <p className="font-semibold">
                    {selectedCheque.numero || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monto</p>
                  <p className="font-semibold">
                    ${selectedCheque.monto.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Fechas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Recepción</p>
                    <p className="font-semibold">
                      {new Date(
                        selectedCheque.fechaRecepcion,
                      ).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cobro (Vencimiento)</p>
                    <p className="font-semibold">
                      {new Date(selectedCheque.fechaCobro).toLocaleDateString(
                        "es-AR",
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Partes Involucradas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Emisor</p>
                    <p className="font-semibold">{selectedCheque.emisor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Destino</p>
                    <p className="font-semibold">{selectedCheque.destino}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Estado</h3>
                <Badge className={getStatusColor(selectedCheque.estado)}>
                  {getStatusLabel(selectedCheque.estado)}
                </Badge>
              </div>

              {selectedCheque.observaciones && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Observaciones</h3>
                  <p className="text-sm">{selectedCheque.observaciones}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => handleDeleteCheque(selectedCheque.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
              <Button
                variant="outline"
                onClick={() => handleEditCheque(selectedCheque)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDetailModal(false)}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de imputación */}
      {selectedCheque && (
        <Dialog
          open={showImputacionModal}
          onOpenChange={setShowImputacionModal}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Imputar Cheque
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Cheque seleccionado
                </h3>
                <p className="text-sm text-blue-700">
                  Número: {selectedCheque.numero || "Sin número"}
                </p>
                <p className="text-sm text-blue-700">
                  Monto: ${selectedCheque.monto.toFixed(2)}
                </p>
                <p className="text-sm text-blue-700">
                  Emisor: {selectedCheque.emisor}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar cliente con deuda pendiente
                </label>
                <Select
                  value={selectedClienteId}
                  onValueChange={setSelectedClienteId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Elegir cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getClientesConDeuda().map((vehicle) => {
                      // Calcular deuda total del cliente
                      const deudaCliente = ordenesTrabajo
                        .filter(
                          (orden) =>
                            orden.cliente === vehicle.cliente &&
                            orden.saldoPendiente > 0,
                        )
                        .reduce((sum, orden) => sum + orden.saldoPendiente, 0);

                      return (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.cliente} - ${deudaCliente.toFixed(2)}{" "}
                          pendiente
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedClienteId && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    Al imputar este cheque, se aplicará el pago a las deudas
                    pendientes del cliente seleccionado, empezando por las
                    órdenes más antiguas.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowImputacionModal(false);
                  setSelectedClienteId("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImputarCheque}
                disabled={!selectedClienteId}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Imputar Cheque
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
