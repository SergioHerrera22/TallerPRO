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
  // --- Estados faltantes agregados ---
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenTrabajo[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState<any[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showImputacionModal, setShowImputacionModal] = useState(false);

  const [editingCheque, setEditingCheque] = useState<Cheque | undefined>();
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("all");
  const [selectedDestinoTipo, setSelectedDestinoTipo] = useState<string>("");
  const [selectedClienteId, setSelectedClienteId] = useState("");
  const [selectedCuentaId, setSelectedCuentaId] = useState("");

  // Cargar datos iniciales (Simulado/Efecto)
  useEffect(() => {
    const fetchData = async () => {
      const c = await db.cheques.toArray();
      const ot = await db.ordenesTrabajo.toArray();
      const v = await db.vehicles.toArray();
      const cc = await db.cuentasCorrientes.toArray();
      setCheques(c);
      setOrdenesTrabajo(ot);
      setVehicles(v);
      setCuentasCorrientes(cc);
    };
    fetchData();
  }, []);

  // --- Funciones de Acción ---
  const handleCreateCheque = async (data: any) => {
    try {
      const newCheque = { ...data, id: crypto.randomUUID() };
      await db.cheques.add(newCheque);
      setCheques([...cheques, newCheque]);
      setShowForm(false);
      toast.success("Cheque creado");
    } catch (e) {
      toast.error("Error al crear");
    }
  };

  const handleUpdateCheque = async (data: any) => {
    try {
      await db.cheques.put(data);
      setCheques(cheques.map((c) => (c.id === data.id ? data : c)));
      setShowForm(false);
      toast.success("Cheque actualizado");
    } catch (e) {
      toast.error("Error al actualizar");
    }
  };

  const handleImputarCheque = async () => {
    if (!selectedCheque) return;

    if (selectedDestinoTipo === "cuentaCorriente") {
      if (!selectedCuentaId) return;
      const cuenta = cuentasCorrientes.find((c) => c.id === selectedCuentaId);
      if (!cuenta) return toast.error("Cuenta no encontrada");

      const updatedCuenta = {
        ...cuenta,
        saldo: parseFloat(cuenta.saldo) - selectedCheque.monto,
        updatedAt: new Date().toISOString(),
      };

      await db.cuentasCorrientes.put(updatedCuenta);
      const updatedCheques = cheques.map((c) =>
        c.id === selectedCheque.id
          ? {
              ...c,
              estado: "imputado" as const,
              fechaImputacion: new Date().toISOString(),
            }
          : c,
      );
      await db.cheques.bulkPut(updatedCheques);

      setCheques(updatedCheques);
      setCuentasCorrientes(
        cuentasCorrientes.map((c) =>
          c.id === selectedCuentaId ? updatedCuenta : c,
        ),
      );
      setShowImputacionModal(false);
      toast.success("Imputado a cuenta corriente");
    }

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
        return toast.error("El monto excede la deuda total");
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
          return { ...orden, saldoPendiente: orden.saldoPendiente - pago };
        }
        return orden;
      });

      const updatedCheques = cheques.map((c) =>
        c.id === selectedCheque.id
          ? { ...c, estado: "imputado" as const, clienteId: selectedClienteId }
          : c,
      );

      await db.cheques.bulkPut(updatedCheques);
      await db.ordenesTrabajo.bulkPut(updatedOrdenes);
      setCheques(updatedCheques);
      setOrdenesTrabajo(updatedOrdenes);
      setShowImputacionModal(false);
      toast.success("Imputado a cliente");
    }
  };

  // --- Helpers de UI ---
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
    const colors: Record<string, string> = {
      cobrado: "bg-green-100 text-green-800",
      entregado: "bg-blue-100 text-blue-800",
      imputado: "bg-purple-100 text-purple-800",
      "en-cartera": "bg-yellow-100 text-yellow-800",
    };
    return colors[estado] || colors["en-cartera"];
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

  const handleDeleteCheque = async (id: string) => {
    await db.cheques.delete(id);
    setCheques(cheques.filter((c) => c.id !== id));
    setShowDetailModal(false);
    toast.success("Eliminado");
  };

  return (
    <div className="px-4 sm:px-0 space-y-6">
      {/* ... (Cabecera y Stats se mantienen igual) ... */}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Todos</option>
              <option value="en-cartera">En Cartera</option>
              <option value="imputado">Imputado</option>
            </select>
            <Button
              onClick={() => {
                setEditingCheque(undefined);
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Nuevo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
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
                onClick={() => {
                  setSelectedCheque(cheque);
                  setShowDetailModal(true);
                }}
              >
                <TableCell>{cheque.numero}</TableCell>
                <TableCell>{cheque.emisor}</TableCell>
                <TableCell className="text-right">
                  ${cheque.monto.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(cheque.estado)}>
                    {getStatusLabel(cheque.estado)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCheque(cheque);
                      setShowImputacionModal(true);
                    }}
                  >
                    <DollarSign className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Modales - Asegúrate de que ChequeForm reciba las props correctas */}
      <ChequeForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={editingCheque ? handleUpdateCheque : handleCreateCheque}
        initialData={editingCheque}
      />

      {/* Modal Imputación simplificado para el ejemplo */}
      <Dialog open={showImputacionModal} onOpenChange={setShowImputacionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Imputar Cheque</DialogTitle>
          </DialogHeader>
          <Select onValueChange={setSelectedDestinoTipo}>
            <SelectTrigger>
              <SelectValue placeholder="Destino" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cliente">Cliente</SelectItem>
              <SelectItem value="cuentaCorriente">Cuenta Corriente</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button onClick={handleImputarCheque}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
