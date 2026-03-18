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
import { dataRepository } from "../../services/dataRepository";

export function CheckManagement() {
  // --- Estados Principales ---
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenTrabajo[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState<any[]>([]);

  // --- Estados de UI ---
  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showImputacionModal, setShowImputacionModal] = useState(false);
  const [editingCheque, setEditingCheque] = useState<Cheque | undefined>();
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);

  // --- Filtros e Imputación ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("all");
  const [selectedDestinoTipo, setSelectedDestinoTipo] = useState<string>("");
  const [selectedClienteId, setSelectedClienteId] = useState("");
  const [selectedCuentaId, setSelectedCuentaId] = useState("");

  const loadData = async () => {
    const [c, ot, v, cc] = await Promise.all([
      db.cheques.toArray(),
      db.ordenesTrabajo.toArray(),
      db.vehicles.toArray(),
      db.cuentasCorrientes.toArray(),
    ]);
    setCheques(c.filter((ch) => !ch.deleted));
    setOrdenesTrabajo(ot.filter((o) => !o.deleted));
    setVehicles(v.filter((veh) => !veh.deleted));
    setCuentasCorrientes(cc.filter((cuenta) => !cuenta.deleted));
  };

  // --- Carga de Datos ---
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    window.addEventListener("app:refreshData", loadData);
    return () => window.removeEventListener("app:refreshData", loadData);
  }, []);

  // --- Lógica de Imputación (Corregida) ---
  const handleImputarCheque = async () => {
    if (!selectedCheque) return;

    // ESCENARIO A: CUENTA CORRIENTE
    if (selectedDestinoTipo === "cuentaCorriente") {
      if (!selectedCuentaId) return;

      const empresa = cuentasCorrientes.find((c) => c.id === selectedCuentaId);
      if (!empresa) {
        toast.error("Cuenta corriente no encontrada");
        return;
      }

      const nuevoSaldo =
        parseFloat(empresa.saldo) - parseFloat(String(selectedCheque.monto));
      const empresaActualizada = {
        ...empresa,
        saldo: nuevoSaldo,
        updatedAt: new Date().toISOString(),
      };

      // Actualizar DB y Estado
      await dataRepository.saveCuentaCorriente(empresaActualizada);

      const updatedCheques = cheques.map((c) =>
        c.id === selectedCheque.id
          ? {
              ...c,
              estado: "imputado" as const,
              fechaImputacion: new Date().toISOString(),
              observaciones:
                `${c.observaciones || ""} Imputado a CC: ${empresa.entidad}`.trim(),
            }
          : c,
      );

      await Promise.all(updatedCheques.map((c) => dataRepository.saveCheque(c)));
      setCheques(updatedCheques);
      setCuentasCorrientes((prev) =>
        prev.map((item) =>
          item.id === selectedCuentaId ? empresaActualizada : item,
        ),
      );

      toast.success(`Cheque imputado a ${empresa.entidad}`);
      finalizarImputacion();
    }

    // ESCENARIO B: CLIENTE
    if (selectedDestinoTipo === "cliente") {
      if (!selectedClienteId) return;
      const clienteSeleccionado = vehicles.find(
        (v) => v.id === selectedClienteId,
      );
      if (!clienteSeleccionado) return;

      const ordenesDeuda = ordenesTrabajo
        .filter(
          (o) =>
            o.cliente === clienteSeleccionado.cliente && o.saldoPendiente > 0,
        )
        .sort(
          (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
        );

      const deudaTotal = ordenesDeuda.reduce(
        (sum, o) => sum + o.saldoPendiente,
        0,
      );

      if (selectedCheque.monto > deudaTotal) {
        toast.error("El monto excede la deuda total del cliente");
        return;
      }

      let montoRestante = selectedCheque.monto;
      const updatedOrdenes = ordenesTrabajo.map((orden) => {
        if (
          orden.cliente === clienteSeleccionado.cliente &&
          orden.saldoPendiente > 0 &&
          montoRestante > 0
        ) {
          const pago = Math.min(montoRestante, orden.saldoPendiente);
          montoRestante -= pago;
          return {
            ...orden,
            entregasCuenta: [...(orden.entregasCuenta || []), pago],
            saldoPendiente: orden.saldoPendiente - pago,
          };
        }
        return orden;
      });

      const updatedCheques = cheques.map((c) =>
        c.id === selectedCheque.id
          ? {
              ...c,
              estado: "imputado" as const,
              clienteId: selectedClienteId,
              fechaImputacion: new Date().toISOString(),
              observaciones:
                `${c.observaciones || ""} Imputado a cliente ${clienteSeleccionado.cliente}`.trim(),
            }
          : c,
      );

      await Promise.all(updatedCheques.map((c) => dataRepository.saveCheque(c)));
      await Promise.all(updatedOrdenes.map((o) => dataRepository.saveOrdenTrabajo(o)));
      setCheques(updatedCheques);
      setOrdenesTrabajo(updatedOrdenes);

      toast.success(`Imputado a ${clienteSeleccionado.cliente}`);
      finalizarImputacion();
    }
  };

  const finalizarImputacion = () => {
    setShowImputacionModal(false);
    setShowDetailModal(false);
    setSelectedClienteId("");
    setSelectedCuentaId("");
    setSelectedDestinoTipo("");
  };

  // --- CRUD Básico ---
  const handleCreateCheque = async (data: any) => {
    const newCheque = { ...data, id: crypto.randomUUID() };
    await dataRepository.saveCheque(newCheque);
    setCheques([...cheques, newCheque]);
    setShowForm(false);
    toast.success("Cheque registrado");
  };

  const handleUpdateCheque = async (data: any) => {
    await dataRepository.saveCheque(data);
    setCheques(cheques.map((c) => (c.id === data.id ? data : c)));
    setShowForm(false);
    setEditingCheque(undefined);
    toast.success("Cheque actualizado");
  };

  const handleDeleteCheque = async (id: string) => {
    await dataRepository.deleteCheque(id);
    setCheques(cheques.filter((c) => c.id !== id));
    setShowDetailModal(false);
    toast.success("Cheque eliminado");
  };

  // --- Helpers UI ---
  const getClientesConDeuda = () => {
    const clientesConDeuda = new Set(
      ordenesTrabajo.filter((o) => o.saldoPendiente > 0).map((o) => o.cliente),
    );
    return vehicles.filter((v) => clientesConDeuda.has(v.cliente));
  };

  const filteredCheques = cheques.filter((cheque) => {
    const matchesSearch =
      cheque.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cheque.emisor.toLowerCase().includes(searchTerm.toLowerCase());
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
    const labels: Record<string, string> = {
      cobrado: "Cobrado",
      entregado: "Entregado",
      imputado: "Imputado",
      "en-cartera": "En Cartera",
    };
    return labels[estado] || "En Cartera";
  };

  const totalMonto = filteredCheques.reduce((sum, c) => sum + c.monto, 0);

  return (
    <div className="px-4 sm:px-0 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Gestión de Cheques
        </h1>
        <p className="text-gray-600">
          Registre y controle los cheques del taller
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Registrado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMonto.toFixed(2)}</div>
          </CardContent>
        </Card>
        {/* Agrega aquí el resto de tus cards de stats si lo deseas */}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por número o emisor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="en-cartera">En Cartera</option>
              <option value="imputado">Imputado</option>
              <option value="cobrado">Cobrado</option>
            </select>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Nuevo Cheque
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Cheques</CardTitle>
          <CardDescription>
            {filteredCheques.length} cheques encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Emisor</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCheques.map((cheque) => (
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
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCheque(cheque);
                            setShowForm(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* --- MODALES --- */}

      {/* Formulario Crear/Editar */}
      <ChequeForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingCheque(undefined);
        }}
        onSubmit={editingCheque ? handleUpdateCheque : handleCreateCheque}
        initialData={editingCheque}
      />

      {/* Detalle del Cheque */}
      {selectedCheque && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Detalle del Cheque {selectedCheque.numero}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Monto</p>
                  <p className="font-bold">
                    ${selectedCheque.monto.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Emisor</p>
                  <p>{selectedCheque.emisor}</p>
                </div>
              </div>
              <Badge className={getStatusColor(selectedCheque.estado)}>
                {getStatusLabel(selectedCheque.estado)}
              </Badge>
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => handleDeleteCheque(selectedCheque.id)}
              >
                Eliminar
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

      {/* Modal Imputación (Corregido) */}
      {selectedCheque && (
        <Dialog
          open={showImputacionModal}
          onOpenChange={setShowImputacionModal}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" /> Imputar Cheque
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <p>
                  <strong>Monto:</strong> ${selectedCheque.monto.toFixed(2)}
                </p>
                <p>
                  <strong>Emisor:</strong> {selectedCheque.emisor}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Destino de la imputación
                </label>
                <Select
                  value={selectedDestinoTipo}
                  onValueChange={setSelectedDestinoTipo}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">
                      Cliente (Deuda de OT)
                    </SelectItem>
                    <SelectItem value="cuentaCorriente">
                      Cuenta Corriente (Proveedor/Empresa)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedDestinoTipo === "cliente" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Seleccionar Cliente
                  </label>
                  <Select
                    value={selectedClienteId}
                    onValueChange={setSelectedClienteId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Elegir cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getClientesConDeuda().map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.cliente}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedDestinoTipo === "cuentaCorriente" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Seleccionar Cuenta Corriente
                  </label>
                  <Select
                    value={selectedCuentaId}
                    onValueChange={setSelectedCuentaId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Elegir empresa..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cuentasCorrientes.map((cc) => (
                        <SelectItem key={cc.id} value={cc.id}>
                          {cc.entidad} (Saldo: ${cc.saldo.toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowImputacionModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImputarCheque}
                disabled={
                  !selectedDestinoTipo ||
                  (selectedDestinoTipo === "cliente" && !selectedClienteId) ||
                  (selectedDestinoTipo === "cuentaCorriente" &&
                    !selectedCuentaId)
                }
              >
                Confirmar Imputación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
