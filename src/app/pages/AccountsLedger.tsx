import { useState, useEffect } from "react";
import { db } from "../../db";
import { CuentaCorriente, GastoProveedor } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Search,
  Plus,
  Edit2,
  TrendingUp,
  TrendingDown,
  Receipt,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { createId } from "../../utils";
import { dataRepository } from "../../services/dataRepository";

export function AccountsLedger() {
  // Eliminar gasto de proveedor
  const handleDeleteGasto = async (cuentaId: string, gastoId: string) => {
    const cuenta = cuentas.find((c) => c.id === cuentaId);
    if (!cuenta) return;
    const gastosActuales = cuenta.gastos || [];
    const gastoAEliminar = gastosActuales.find((g) => g.id === gastoId);
    if (!gastoAEliminar) return;
    const nuevosGastos = gastosActuales.filter((g) => g.id !== gastoId);
    const cuentaActualizada: CuentaCorriente = {
      ...cuenta,
      gastos: nuevosGastos,
      saldo: cuenta.saldo + gastoAEliminar.total,
      updatedAt: new Date().toISOString(),
    };
    await dataRepository.saveCuentaCorriente(cuentaActualizada);
    toast.success("Gasto eliminado correctamente");
    await loadCuentas();
  };
  const [cuentas, setCuentas] = useState<CuentaCorriente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("all");

  const [showCuentaDialog, setShowCuentaDialog] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState<CuentaCorriente | null>(
    null,
  );

  const [formData, setFormData] = useState({
    entidad: "",
    tipo: "banco" as "banco" | "proveedor" | "otro",
    saldo: 0,
  });

  const [showGastoDialog, setShowGastoDialog] = useState(false);
  const [showGastosListDialog, setShowGastosListDialog] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState<CuentaCorriente | null>(
    null,
  );

  const [gastoFormData, setGastoFormData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    detalleProducto: "",
    total: 0,
  });

  useEffect(() => {
    loadCuentas();
  }, []);

  useEffect(() => {
    window.addEventListener("app:refreshData", loadCuentas);
    return () => window.removeEventListener("app:refreshData", loadCuentas);
  }, []);

  const loadCuentas = async () => {
    const cuentasDB = await db.cuentasCorrientes.toArray();
    setCuentas(cuentasDB.filter((c) => !c.deleted));
  };

  const handleSaveCuenta = async () => {
    if (!formData.entidad.trim()) {
      toast.error("Ingrese el nombre de la entidad");
      return;
    }

    const cuenta: CuentaCorriente = {
      id: editingCuenta?.id || createId(),
      entidad: formData.entidad,
      tipo: formData.tipo,
      saldo: formData.saldo,
      updatedAt: new Date().toISOString(),
    };

    await dataRepository.saveCuentaCorriente(cuenta);

    toast.success(editingCuenta ? "Cuenta actualizada" : "Cuenta creada");

    await loadCuentas();

    setShowCuentaDialog(false);
    setEditingCuenta(null);

    setFormData({
      entidad: "",
      tipo: "banco",
      saldo: 0,
    });
  };

  const handleEditCuenta = (cuenta: CuentaCorriente) => {
    setEditingCuenta(cuenta);

    setFormData({
      entidad: cuenta.entidad,
      tipo: cuenta.tipo,
      saldo: cuenta.saldo,
    });

    setShowCuentaDialog(true);
  };

  const handleDeleteCuenta = async (id: string) => {
    if (!confirm("¿Confirmá que querés eliminar esta cuenta corriente?"))
      return;

    await dataRepository.deleteCuentaCorriente(id);

    toast.success("Cuenta eliminada");

    await loadCuentas();
  };

  const handleAddGasto = (cuenta: CuentaCorriente) => {
    if (cuenta.tipo !== "proveedor") {
      toast.error("Solo se pueden agregar gastos a proveedores");
      return;
    }

    setSelectedCuenta(cuenta);

    setGastoFormData({
      fecha: new Date().toISOString().split("T")[0],
      detalleProducto: "",
      iva: 0,
      total: 0,
    });

    setShowGastoDialog(true);
  };

  const handleSaveGasto = async () => {
    if (!selectedCuenta) return;

    if (!gastoFormData.detalleProducto.trim()) {
      toast.error("Ingrese el detalle del producto");
      return;
    }

    if (gastoFormData.total <= 0) {
      toast.error("El total debe ser mayor a 0");
      return;
    }

    const nuevoGasto: GastoProveedor = {
      id: crypto.randomUUID(),
      fecha: gastoFormData.fecha,
      detalleProducto: gastoFormData.detalleProducto,
      iva: 0,
      total: gastoFormData.total,
      createdAt: new Date().toISOString(),
    };

    const gastosActuales = selectedCuenta.gastos || [];

    const cuentaActualizada: CuentaCorriente = {
      ...selectedCuenta,
      gastos: [...gastosActuales, nuevoGasto],
      saldo: selectedCuenta.saldo - gastoFormData.total,
      updatedAt: new Date().toISOString(),
    };

    await dataRepository.saveCuentaCorriente(cuentaActualizada);

    toast.success("Gasto agregado");

    setShowGastoDialog(false);

    await loadCuentas();
  };

  const handleViewGastos = (cuenta: CuentaCorriente) => {
    setSelectedCuenta(cuenta);

    setShowGastosListDialog(true);
  };

  const filteredCuentas = cuentas.filter((cuenta) => {
    if (cuenta.deleted) return false;
    if (cuenta.tipo !== "proveedor") return false;

    const matchesSearch = (cuenta.entidad || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesTipo = filterTipo === "all" || cuenta.tipo === filterTipo;

    return matchesSearch && matchesTipo;
  });

  const totalSaldoNegativo = filteredCuentas.reduce(
    (sum, c) => sum + (c.saldo < 0 ? Math.abs(c.saldo) : 0),
    0,
  );

  return (
    <div className="px-4 sm:px-0 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Cuentas Corrientes
        </h1>
        <p className="text-gray-600">
          Gestione las cuentas que el taller tiene en otras empresas y bancos
        </p>
      </div>

      {/* Resumen solo de cuentas corrientes (proveedores) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Deuda con Proveedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              $
              {filteredCuentas
                .reduce((sum, c) => sum + Math.abs(c.saldo), 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">Total de gastos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Cuentas Corrientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCuentas.length}</div>
            <p className="text-xs text-gray-500">proveedores registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
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
                  placeholder="Buscar por nombre de entidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Todos los tipos</option>
                <option value="banco">Bancos</option>
                <option value="proveedor">Proveedores</option>
                <option value="otro">Otros</option>
              </select>
            </div>
            <Button
              onClick={() => {
                setEditingCuenta(null);
                setFormData({
                  entidad: "",
                  tipo: "banco",
                  saldo: 0,
                });
                setShowCuentaDialog(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nueva Cuenta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de cuentas */}
      <Card>
        <CardHeader>
          <CardTitle>Cuentas Corrientes</CardTitle>
          <CardDescription>
            {filteredCuentas.length} cuenta
            {filteredCuentas.length !== 1 ? "s" : ""} encontrada
            {filteredCuentas.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCuentas.length > 0 ? (
                  filteredCuentas.map((cuenta) => (
                    <TableRow key={cuenta.id}>
                      <TableCell className="font-medium">
                        {cuenta.entidad || "Sin nombre"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            cuenta.tipo === "banco"
                              ? "bg-blue-100 text-blue-800"
                              : cuenta.tipo === "proveedor"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {cuenta.tipo === "banco"
                            ? "Banco"
                            : cuenta.tipo === "proveedor"
                              ? "Proveedor"
                              : "Otro"}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          cuenta.saldo >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {cuenta.saldo >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          ${Math.abs(cuenta.saldo).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {cuenta.tipo === "proveedor" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewGastos(cuenta)}
                                title="Ver gastos"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAddGasto(cuenta)}
                                title="Agregar gasto"
                              >
                                <Receipt className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditCuenta(cuenta)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCuenta(cuenta.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-gray-500">
                        No hay cuentas que coincidan con la búsqueda
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de cuenta */}
      <Dialog open={showCuentaDialog} onOpenChange={setShowCuentaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCuenta ? "Editar Cuenta" : "Nueva Cuenta Corriente"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="entidad">Nombre de la Entidad *</Label>
              <Input
                id="entidad"
                placeholder="Ej: Banco Nación, Repuestos XYZ"
                value={formData.entidad}
                onChange={(e) =>
                  setFormData({ ...formData, entidad: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="tipo">Tipo de Cuenta *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: "banco" | "proveedor" | "otro") =>
                  setFormData({ ...formData, tipo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banco">Banco</SelectItem>
                  <SelectItem value="proveedor">Proveedor</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editingCuenta && (
              <div>
                <Label htmlFor="saldo">Saldo Actual</Label>
                <Input
                  id="saldo"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.saldo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      saldo: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Positivo: dinero disponible, Negativo: deuda pendiente
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCuentaDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveCuenta}>
              {editingCuenta ? "Actualizar" : "Crear"} Cuenta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de gasto */}
      <Dialog open={showGastoDialog} onOpenChange={setShowGastoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Gasto - {selectedCuenta?.entidad}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={gastoFormData.fecha}
                onChange={(e) =>
                  setGastoFormData({ ...gastoFormData, fecha: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="detalle">Detalle del Producto *</Label>
              <Textarea
                id="detalle"
                placeholder="Descripción del producto o servicio"
                value={gastoFormData.detalleProducto}
                onChange={(e) =>
                  setGastoFormData({
                    ...gastoFormData,
                    detalleProducto: e.target.value,
                  })
                }
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="total">Total ($) *</Label>
              <Input
                id="total"
                type="number"
                step="0.01"
                placeholder="$0.00"
                value={gastoFormData.total}
                onChange={(e) => {
                  const raw = e.target.value.replace(",", ".");
                  const parsed = parseFloat(raw) || 0;
                  setGastoFormData({
                    ...gastoFormData,
                    total: parsed,
                  });
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Monto total del gasto (se restará del saldo de la cuenta)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGastoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveGasto}>Agregar Gasto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de lista de gastos */}
      <Dialog
        open={showGastosListDialog}
        onOpenChange={setShowGastosListDialog}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gastos - {selectedCuenta?.entidad}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedCuenta?.gastos && selectedCuenta.gastos.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Detalle</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {selectedCuenta.gastos
                      .sort(
                        (a, b) =>
                          new Date(b.fecha).getTime() -
                          new Date(a.fecha).getTime(),
                      )
                      .map((gasto) => (
                        <TableRow key={gasto.id}>
                          <TableCell className="text-sm">
                            {new Date(gasto.fecha).toLocaleDateString("es-AR")}
                          </TableCell>
                          <TableCell
                            className="max-w-xs truncate"
                            title={gasto.detalleProducto}
                          >
                            {gasto.detalleProducto}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ${gasto.total.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() =>
                                handleDeleteGasto(selectedCuenta.id, gasto.id)
                              }
                              title="Eliminar gasto"
                            >
                              Eliminar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No hay gastos registrados para este proveedor
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGastosListDialog(false)}
            >
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setShowGastosListDialog(false);
                if (selectedCuenta) {
                  handleAddGasto(selectedCuenta);
                }
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Agregar Gasto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
