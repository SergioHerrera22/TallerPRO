import { useState, useEffect } from "react";
import { CuentaCorriente } from "../types";
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
  RefreshCw,
  Plus,
  Edit2,
  TrendingUp,
  TrendingDown,
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

export function AccountsLedger() {
  const [cuentas, setCuentas] = useState<CuentaCorriente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCuentaDialog, setShowCuentaDialog] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState<CuentaCorriente | null>(
    null,
  );
  const [formData, setFormData] = useState({
    entidad: "",
    tipo: "banco" as "banco" | "proveedor" | "otro",
    saldo: 0,
    limiteCredito: 0,
  });

  useEffect(() => {
    loadCuentas();
  }, []);

  const loadCuentas = () => {
    const saved = localStorage.getItem("cuentasCorrientes");
    if (saved) {
      const parsedCuentas = JSON.parse(saved);
      // Migrar cuentas antiguas que usan 'cliente' en lugar de 'entidad'
      const migratedCuentas = parsedCuentas.map((cuenta: any) => {
        if (cuenta.cliente && !cuenta.entidad) {
          return {
            ...cuenta,
            entidad: cuenta.cliente,
            tipo: cuenta.tipo || "otro",
            saldo: cuenta.saldoPendiente || cuenta.totalDeudora || 0,
          };
        }
        return {
          ...cuenta,
          tipo: cuenta.tipo || "otro",
          saldo: cuenta.saldo || 0,
        };
      });
      setCuentas(migratedCuentas);
      // Guardar las cuentas migradas
      localStorage.setItem(
        "cuentasCorrientes",
        JSON.stringify(migratedCuentas),
      );
    }
  };

  const handleSaveCuenta = () => {
    if (!formData.entidad.trim()) {
      toast.error("Ingrese el nombre de la entidad");
      return;
    }

    const cuenta: CuentaCorriente = {
      id: editingCuenta?.id || Date.now().toString(),
      entidad: formData.entidad,
      tipo: formData.tipo,
      saldo: formData.saldo,
      limiteCredito:
        formData.tipo === "proveedor" ? formData.limiteCredito : undefined,
      updatedAt: new Date().toISOString(),
    };

    let updatedCuentas;
    if (editingCuenta) {
      updatedCuentas = cuentas.map((c) =>
        c.id === editingCuenta.id ? cuenta : c,
      );
      toast.success("Cuenta actualizada exitosamente");
    } else {
      updatedCuentas = [...cuentas, cuenta];
      toast.success("Cuenta creada exitosamente");
    }

    setCuentas(updatedCuentas);
    localStorage.setItem("cuentasCorrientes", JSON.stringify(updatedCuentas));

    setShowCuentaDialog(false);
    setEditingCuenta(null);
    setFormData({
      entidad: "",
      tipo: "banco",
      saldo: 0,
      limiteCredito: 0,
    });
  };

  const handleEditCuenta = (cuenta: CuentaCorriente) => {
    setEditingCuenta(cuenta);
    setFormData({
      entidad: cuenta.entidad,
      tipo: cuenta.tipo,
      saldo: cuenta.saldo,
      limiteCredito: cuenta.limiteCredito || 0,
    });
    setShowCuentaDialog(true);
  };

  const handleDeleteCuenta = (id: string) => {
    if (confirm("¿Confirmá que querés eliminar esta cuenta corriente?")) {
      const updatedCuentas = cuentas.filter((c) => c.id !== id);
      setCuentas(updatedCuentas);
      localStorage.setItem("cuentasCorrientes", JSON.stringify(updatedCuentas));
      toast.success("Cuenta eliminada exitosamente");
    }
  };

  const filteredCuentas = cuentas.filter((cuenta) =>
    (cuenta.entidad || cuenta.cliente || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const totalSaldoPositivo = filteredCuentas.reduce(
    (sum, c) => sum + (c.saldo > 0 ? c.saldo : 0),
    0,
  );
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

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalSaldoPositivo.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">en bancos y cuentas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Deudas Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalSaldoNegativo.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">con proveedores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cuentas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cuentas.length}</div>
            <p className="text-xs text-gray-500">cuentas registradas</p>
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
            <Button onClick={() => setShowCuentaDialog(true)} className="gap-2">
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
                  <TableHead className="text-right">Límite Crédito</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCuentas.length > 0 ? (
                  filteredCuentas.map((cuenta) => (
                    <TableRow key={cuenta.id}>
                      <TableCell className="font-medium">
                        {cuenta.entidad || cuenta.cliente || "Sin nombre"}
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
                        {cuenta.limiteCredito
                          ? `$${cuenta.limiteCredito.toFixed(2)}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
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

            {formData.tipo === "proveedor" && (
              <div>
                <Label htmlFor="limiteCredito">Límite de Crédito</Label>
                <Input
                  id="limiteCredito"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.limiteCredito}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      limiteCredito: parseFloat(e.target.value) || 0,
                    })
                  }
                />
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
    </div>
  );
}
