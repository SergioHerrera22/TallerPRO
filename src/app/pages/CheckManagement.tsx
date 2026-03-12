import { useState, useEffect } from "react";
import { Cheque } from "../types";
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
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";

export function CheckManagement() {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCheque, setEditingCheque] = useState<Cheque | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadCheques();
  }, []);

  const loadCheques = () => {
    const saved = localStorage.getItem("cheques");
    if (saved) {
      setCheques(JSON.parse(saved));
    }
  };

  const handleCreateCheque = (data: Omit<Cheque, "id" | "createdAt">) => {
    const newCheque: Cheque = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...cheques, newCheque];
    localStorage.setItem("cheques", JSON.stringify(updated));
    setCheques(updated);
    setShowForm(false);
    setEditingCheque(undefined);
    toast.success("Cheque registrado exitosamente");
  };

  const handleUpdateCheque = (data: Omit<Cheque, "id" | "createdAt">) => {
    if (!editingCheque) return;

    const updated = cheques.map((c) =>
      c.id === editingCheque.id ? { ...c, ...data } : c,
    );

    localStorage.setItem("cheques", JSON.stringify(updated));
    setCheques(updated);
    setShowForm(false);
    setEditingCheque(undefined);
    toast.success("Cheque actualizado exitosamente");
  };

  const handleDeleteCheque = (chequeId: string) => {
    if (confirm("¿Confirmá que querés eliminar este cheque?")) {
      const updated = cheques.filter((c) => c.id !== chequeId);
      localStorage.setItem("cheques", JSON.stringify(updated));
      setCheques(updated);
      setShowDetailModal(false);
      toast.success("Cheque eliminado exitosamente");
    }
  };

  const handleEditCheque = (cheque: Cheque) => {
    setEditingCheque(cheque);
    setShowDetailModal(false);
    setShowForm(true);
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
    </div>
  );
}
