import { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Receipt,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import {
  OrdenTrabajo,
  Expense,
  CuentaCorriente,
  GastoProveedor,
  Cheque,
  Vehicle,
} from "../types";

export function BusinessExpenses() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(true);

  // Data states
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenTrabajo[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState<CuentaCorriente[]>(
    [],
  );
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, selectedMonth]);

  // Escuchar cambios en localStorage para actualizar datos automáticamente
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "ordenesTrabajo" ||
        e.key === "cheques" ||
        e.key === "vehicles"
      ) {
        loadData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const loadData = () => {
    // Load work orders (ingresos)
    const storedOrdenes = localStorage.getItem("ordenesTrabajo");
    if (storedOrdenes) {
      setOrdenesTrabajo(JSON.parse(storedOrdenes));
    }

    // Load expenses (egresos)
    const storedExpenses = localStorage.getItem("expenses");
    if (storedExpenses) {
      setExpenses(JSON.parse(storedExpenses));
    }

    // Load accounts (deudas)
    const storedCuentas = localStorage.getItem("cuentasCorrientes");
    if (storedCuentas) {
      setCuentasCorrientes(JSON.parse(storedCuentas));
    }

    // Load cheques (ingresos adicionales)
    const storedCheques = localStorage.getItem("cheques");
    if (storedCheques) {
      setCheques(JSON.parse(storedCheques));
    }

    // Load vehicles (para obtener nombres de clientes)
    const storedVehicles = localStorage.getItem("vehicles");
    if (storedVehicles) {
      setVehicles(JSON.parse(storedVehicles));
    }
  };

  // Función para recargar datos manualmente
  const reloadData = () => {
    loadData();
    toast.success("Datos actualizados");
  };

  const handlePasswordSubmit = () => {
    // Simple password check - in production, this should be more secure
    if (password === "taller2024") {
      setIsAuthenticated(true);
      setShowPasswordDialog(false);
      toast.success("Acceso autorizado");
    } else {
      toast.error("Contraseña incorrecta");
    }
  };

  const getMonthlyData = () => {
    const [year, month] = selectedMonth.split("-");

    // Filter work orders for selected month
    const monthlyOrdenes = ordenesTrabajo.filter((orden) => {
      const ordenDate = new Date(orden.fecha);
      return (
        ordenDate.getFullYear() === parseInt(year) &&
        ordenDate.getMonth() === parseInt(month) - 1
      );
    });

    // Filter expenses for selected month
    const monthlyExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.fecha);
      return (
        expenseDate.getFullYear() === parseInt(year) &&
        expenseDate.getMonth() === parseInt(month) - 1
      );
    });

    // Filter account debts (negative balances)
    const monthlyDebts = cuentasCorrientes.filter((cuenta) => cuenta.saldo < 0);

    // Filter clients with pending balances (todas las órdenes con deuda, no solo del mes)
    const monthlyDeudores = ordenesTrabajo.filter(
      (orden) => orden.saldoPendiente > 0,
    );

    // Filter imputed cheques for selected month
    const monthlyChequesImputados = cheques.filter((cheque) => {
      if (cheque.estado !== "imputado" || !cheque.fechaImputacion) return false;
      const chequeDate = new Date(cheque.fechaImputacion);
      return (
        chequeDate.getFullYear() === parseInt(year) &&
        chequeDate.getMonth() === parseInt(month) - 1
      );
    });

    // Calculate totals
    const totalIngresos = monthlyOrdenes.reduce(
      (sum, orden) => sum + orden.monto,
      0,
    );
    const totalIngresosCheques = monthlyChequesImputados.reduce(
      (sum, cheque) => sum + cheque.monto,
      0,
    );
    const totalEgresos = monthlyExpenses.reduce(
      (sum, expense) => sum + expense.total,
      0,
    );
    const totalDeudas = Math.abs(
      monthlyDebts.reduce((sum, cuenta) => sum + cuenta.saldo, 0),
    );
    const totalDeudores = monthlyDeudores.reduce(
      (sum, orden) => sum + orden.saldoPendiente,
      0,
    );

    // Obtener clientes únicos con deuda
    const clientesUnicosConDeuda = [
      ...new Set(monthlyDeudores.map((orden) => orden.cliente)),
    ];

    return {
      ordenes: monthlyOrdenes,
      expenses: monthlyExpenses,
      debts: monthlyDebts,
      deudores: monthlyDeudores,
      clientesUnicosConDeuda,
      chequesImputados: monthlyChequesImputados,
      totalIngresos,
      totalIngresosCheques,
      totalEgresos,
      totalDeudas,
      totalDeudores,
      balance: totalIngresos + totalIngresosCheques - totalEgresos,
    };
  };

  const monthlyData = getMonthlyData();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Dialog open={showPasswordDialog} onOpenChange={() => {}}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Acceso Restringido
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Esta página contiene información financiera confidencial del
                taller. Ingrese la contraseña para continuar.
              </p>

              <div>
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handlePasswordSubmit()
                    }
                    placeholder="Ingrese la contraseña"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePasswordSubmit} className="flex-1">
                Acceder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              💰 Gestión Financiera del Taller
            </h1>
            <p className="text-gray-600">
              Reporte mensual de ingresos, egresos y deudas
            </p>
          </div>

          {/* Month Selector */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Seleccionar Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div>
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <Button
                  onClick={reloadData}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Actualizar Datos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Ingresos del Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {(
                    monthlyData.totalIngresos + monthlyData.totalIngresosCheques
                  ).toFixed(2)}
                </div>
                <p className="text-xs opacity-90">
                  {monthlyData.ordenes.length} órdenes facturadas
                  {monthlyData.chequesImputados.length > 0 &&
                    ` + ${monthlyData.chequesImputados.length} cheque${monthlyData.chequesImputados.length !== 1 ? "s" : ""} imputado${monthlyData.chequesImputados.length !== 1 ? "s" : ""}`}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Egresos del Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${monthlyData.totalEgresos.toFixed(2)}
                </div>
                <p className="text-xs opacity-90">
                  {monthlyData.expenses.length} gastos registrados
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Clientes Deudores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${monthlyData.totalDeudores.toFixed(2)}
                </div>
                <p className="text-xs opacity-90">
                  {monthlyData.clientesUnicosConDeuda.length} cliente
                  {monthlyData.clientesUnicosConDeuda.length !== 1
                    ? "s"
                    : ""}{" "}
                  con deuda
                  {monthlyData.clientesUnicosConDeuda.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            <Card
              className={`bg-gradient-to-br text-white ${
                monthlyData.balance >= 0
                  ? "from-blue-500 to-blue-600"
                  : "from-purple-500 to-purple-600"
              }`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Balance del Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${monthlyData.balance.toFixed(2)}
                </div>
                <p className="text-xs opacity-90">
                  {monthlyData.balance >= 0 ? "Superávit" : "Déficit"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ingresos - Órdenes de Trabajo */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Ingresos - Órdenes Facturadas
                </CardTitle>
                <CardDescription>
                  Trabajo realizado y cobrado en{" "}
                  {new Date(selectedMonth + "-01").toLocaleDateString("es-AR", {
                    month: "long",
                    year: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyData.ordenes.length > 0 ? (
                        monthlyData.ordenes.map((orden) => (
                          <TableRow key={orden.id}>
                            <TableCell className="text-sm">
                              {new Date(orden.fecha).toLocaleDateString(
                                "es-AR",
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {orden.cliente}
                            </TableCell>
                            <TableCell
                              className="max-w-xs truncate"
                              title={orden.descripcion}
                            >
                              {orden.descripcion}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-green-600">
                              ${orden.monto.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-gray-500"
                          >
                            No hay órdenes facturadas en este mes
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Egresos - Gastos */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Egresos - Gastos Registrados
                </CardTitle>
                <CardDescription>
                  Gastos realizados en{" "}
                  {new Date(selectedMonth + "-01").toLocaleDateString("es-AR", {
                    month: "long",
                    year: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyData.expenses.length > 0 ? (
                        monthlyData.expenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell className="text-sm">
                              {new Date(expense.fecha).toLocaleDateString(
                                "es-AR",
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                {expense.categoria}
                              </span>
                            </TableCell>
                            <TableCell
                              className="max-w-xs truncate"
                              title={expense.descripcion}
                            >
                              {expense.descripcion}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-red-600">
                              ${expense.total.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-gray-500"
                          >
                            No hay gastos registrados en este mes
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cheques Imputados */}
          {monthlyData.chequesImputados.length > 0 && (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-purple-600" />
                  Cheques Imputados
                </CardTitle>
                <CardDescription>
                  Cheques utilizados para saldar deudas de clientes en{" "}
                  {new Date(selectedMonth + "-01").toLocaleDateString("es-AR", {
                    month: "long",
                    year: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha Imputación</TableHead>
                        <TableHead>Número</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Emisor</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyData.chequesImputados.map((cheque) => {
                        // Buscar el cliente correspondiente por clienteId
                        const clienteCorrespondiente = vehicles.find(
                          (v) => v.id === cheque.clienteId,
                        );
                        return (
                          <TableRow key={cheque.id}>
                            <TableCell className="text-sm">
                              {cheque.fechaImputacion
                                ? new Date(
                                    cheque.fechaImputacion,
                                  ).toLocaleDateString("es-AR")
                                : "—"}
                            </TableCell>
                            <TableCell className="font-medium">
                              {cheque.numero || "—"}
                            </TableCell>
                            <TableCell>
                              {clienteCorrespondiente
                                ? clienteCorrespondiente.cliente
                                : "Cliente no encontrado"}
                            </TableCell>
                            <TableCell>{cheque.emisor}</TableCell>
                            <TableCell className="text-right font-semibold text-purple-600">
                              ${cheque.monto.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clientes Deudores */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                Clientes Deudores
              </CardTitle>
              <CardDescription>
                Clientes que tienen saldo pendiente por pagar en{" "}
                {new Date(selectedMonth + "-01").toLocaleDateString("es-AR", {
                  month: "long",
                  year: "numeric",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Patente</TableHead>
                      <TableHead className="text-right">Deuda</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyData.deudores.length > 0 ? (
                      monthlyData.deudores.map((orden) => (
                        <TableRow key={orden.id}>
                          <TableCell className="font-medium">
                            {orden.cliente}
                          </TableCell>
                          <TableCell>
                            {orden.telefono || "Sin teléfono"}
                          </TableCell>
                          <TableCell>{orden.patente}</TableCell>
                          <TableCell className="text-right font-semibold text-red-600">
                            ${orden.saldoPendiente.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            {orden.telefono && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const mensaje = `Hola ${orden.cliente}, le recordamos que tiene un saldo pendiente de $${orden.saldoPendiente.toFixed(2)} por la orden ${orden.numeroOT} del vehículo ${orden.patente}.`;
                                  const url = `https://wa.me/549${orden.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje)}`;
                                  window.open(url, "_blank");
                                }}
                                className="gap-1"
                              >
                                <MessageCircle className="h-4 w-4" />
                                WhatsApp
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-gray-500"
                        >
                          No hay clientes con deudas pendientes
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm">
            <p>💼 Información financiera confidencial - Taller de Autos</p>
            <p>Reporte generado el {new Date().toLocaleDateString("es-AR")}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
