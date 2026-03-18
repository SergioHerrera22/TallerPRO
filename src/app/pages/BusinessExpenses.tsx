import React, { useState, useEffect } from "react";
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
  Cheque,
  GastoProveedor,
  Vehicle,
} from "../types";

type ProviderExpenseRow = GastoProveedor & {
  cuentaId: string;
  entidad: string;
  cuentaSaldo: number;
};

export function BusinessExpenses() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(true);

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

  const loadData = async () => {
    try {
      const [ordenes, gastos, cuentas, chequesDB, vehiculos] =
        await Promise.all([
          db.ordenesTrabajo.toArray(),
          db.expenses.toArray(),
          db.cuentasCorrientes.toArray(),
          db.cheques.toArray(),
          db.vehicles.toArray(),
        ]);

      setOrdenesTrabajo(ordenes.filter((o) => !o.deleted));
      setExpenses(gastos.filter((g) => !g.deleted));
      setCuentasCorrientes(cuentas.filter((c) => !c.deleted));
      setCheques(chequesDB.filter((c) => !c.deleted));
      setVehicles(vehiculos.filter((v) => !v.deleted));
    } catch (error) {
      console.error(error);
      toast.error("Error cargando datos");
    }
  };

  const reloadData = async () => {
    await loadData();
    toast.success("Datos actualizados");
  };

  const handlePasswordSubmit = () => {
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

    const monthlyOrdenes = ordenesTrabajo.filter((orden) => {
      const date = new Date(orden.fecha);

      return (
        date.getFullYear() === Number(year) &&
        date.getMonth() === Number(month) - 1
      );
    });

    const monthlyExpenses = expenses.filter((expense) => {
      const date = new Date(expense.fecha);
      return (
        date.getFullYear() === Number(year) &&
        date.getMonth() === Number(month) - 1
      );
    });

    // Extraer gastos de proveedores de cuentas corrientes
    const monthlyProviderExpenses: ProviderExpenseRow[] = cuentasCorrientes
      .filter(
        (cuenta) =>
          !cuenta.deleted && cuenta.gastos && cuenta.gastos.length > 0,
      )
      .flatMap((cuenta) => {
        return cuenta.gastos!.flatMap((gasto) => {
          const date = new Date(gasto.fecha);
          const isSameMonth =
            date.getFullYear() === Number(year) &&
            date.getMonth() === Number(month) - 1;

          if (!isSameMonth) return [];

          return [
            {
              ...gasto,
              cuentaId: cuenta.id,
              entidad: cuenta.entidad,
              cuentaSaldo: cuenta.saldo,
            },
          ];
        });
      });

    const monthlyDebts = cuentasCorrientes.filter((cuenta) => cuenta.saldo < 0);

    // Clientes deudores del MES seleccionado (OT del mes con saldo pendiente)
    const monthlyDeudores = monthlyOrdenes.filter(
      (orden) => orden.saldoPendiente > 0,
    );
    const monthlyChequesImputados = cheques.filter((cheque) => {
      if (cheque.estado !== "imputado" || !cheque.fechaImputacion) return false;
      const date = new Date(cheque.fechaImputacion);
      return (
        date.getFullYear() === Number(year) &&
        date.getMonth() === Number(month) - 1
      );
    });

    const monthlyChequesImputadosClientes = monthlyChequesImputados.filter(
      (cheque) => Boolean(cheque.clienteId),
    );

    const monthlyChequesImputadosProveedores = monthlyChequesImputados.filter(
      (cheque) => !cheque.clienteId,
    );

    const totalIngresos = monthlyOrdenes.reduce(
      (sum, orden) => sum + orden.monto,
      0,
    );

    // Solo cheques imputados a clientes cuentan como ingreso (cobranza de OT)
    const totalIngresosCheques = monthlyChequesImputadosClientes.reduce(
      (sum, cheque) => sum + cheque.monto,
      0,
    );

    // Sumar gastos normales y de proveedores
    const totalEgresos =
      monthlyExpenses.reduce((sum, expense) => sum + expense.total, 0) +
      monthlyProviderExpenses.reduce((sum, gasto) => sum + gasto.total, 0) +
      // Cheques imputados a proveedores/cuentas corrientes (pago) cuentan como egreso
      monthlyChequesImputadosProveedores.reduce((sum, cheque) => sum + cheque.monto, 0);

    const totalIvaVentas = monthlyOrdenes.reduce((sum, orden) => {
      const iva = orden.monto - orden.monto / 1.21;
      return sum + iva;
    }, 0);

    // IVA Compras: SOLO cuentas corrientes (proveedores), como pediste
    const totalIvaCompras = monthlyProviderExpenses.reduce(
      (sum, gasto) => sum + (gasto.iva || 0),
      0,
    );

    const totalDeudas = Math.abs(
      monthlyDebts.reduce((sum, cuenta) => sum + cuenta.saldo, 0),
    );
    const totalDeudores = monthlyDeudores.reduce(
      (sum, orden) => sum + orden.saldoPendiente,
      0,
    );
    const clientesUnicosConDeuda = [
      ...new Set(monthlyDeudores.map((orden) => orden.cliente)),
    ];

    return {
      ordenes: monthlyOrdenes,
      expenses: monthlyExpenses,
      providerExpenses: monthlyProviderExpenses,
      debts: monthlyDebts,
      deudores: monthlyDeudores,
      clientesUnicosConDeuda,
      chequesImputadosClientes: monthlyChequesImputadosClientes,
      chequesImputadosProveedores: monthlyChequesImputadosProveedores,
      totalIngresos,
      totalIngresosCheques,
      totalEgresos,
      totalIvaVentas,
      totalIvaCompras,
      totalDeudas,
      totalDeudores,
      balance: totalIngresos + totalIngresosCheques - totalEgresos,
    };
  };

  const monthlyData = getMonthlyData();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Dialog open={showPasswordDialog} onOpenChange={() => {}}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex gap-2 items-center">
                <Lock className="h-5 w-5" />
                Acceso Restringido
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Label>Contraseña</Label>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <Button onClick={handlePasswordSubmit}>Acceder</Button>
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
                  {monthlyData.chequesImputadosClientes.length > 0 &&
                    ` + ${monthlyData.chequesImputadosClientes.length} cheque${monthlyData.chequesImputadosClientes.length !== 1 ? "s" : ""} imputado${monthlyData.chequesImputadosClientes.length !== 1 ? "s" : ""} (clientes)`}
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

          {/* Reporte IVA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-green-600" />
                  IVA Ventas (Órdenes de Trabajo)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  ${monthlyData.totalIvaVentas.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500">
                  Total de IVA incluido en lo facturado de OT (21%)
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-red-600" />
                  IVA Compras (Cuentas Corrientes)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">
                  ${monthlyData.totalIvaCompras.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500">
                  IVA de compras cargadas a proveedores (cuentas corrientes)
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  Diferencia de IVA (Ventas - Compras)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    monthlyData.totalIvaVentas - monthlyData.totalIvaCompras >= 0
                      ? "text-blue-700"
                      : "text-purple-700"
                  }`}
                >
                  ${(monthlyData.totalIvaVentas - monthlyData.totalIvaCompras).toFixed(2)}
                </div>
                <p className="text-xs text-gray-500">
                  Si da positivo: IVA a pagar. Si da negativo: IVA a favor.
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
                      {/* Gastos normales */}
                      {monthlyData.expenses.map((expense) => (
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
                      ))}
                      {/* Gastos de proveedores */}
                      {monthlyData.providerExpenses.map((gasto) => (
                        <TableRow key={`${gasto.cuentaId}-${gasto.id}`}>
                          <TableCell className="text-sm">
                            {new Date(gasto.fecha).toLocaleDateString("es-AR")}
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-red-100 rounded-full text-xs">
                              Proveedor
                            </span>
                          </TableCell>
                          <TableCell
                            className="max-w-xs truncate"
                            title={gasto.detalleProducto}
                          >
                            <div className="flex flex-col">
                              <span>{gasto.detalleProducto}</span>
                              <span className="text-xs text-gray-500">
                                {gasto.entidad}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell
                            className={`text-right font-semibold ${
                              gasto.cuentaSaldo >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                            title={
                              gasto.cuentaSaldo >= 0
                                ? "Saldado"
                                : "Pendiente (saldo proveedor negativo)"
                            }
                          >
                            ${gasto.total.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Si no hay gastos */}
                      {monthlyData.expenses.length === 0 &&
                        monthlyData.providerExpenses.length === 0 && (
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

          {/* Cheques Imputados (Clientes) */}
          {monthlyData.chequesImputadosClientes.length > 0 && (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-purple-600" />
                  Cheques Imputados (Clientes)
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
                      {monthlyData.chequesImputadosClientes.map((cheque) => {
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

          {/* Cheques Imputados (Proveedores / Cuentas Corrientes) */}
          {monthlyData.chequesImputadosProveedores.length > 0 && (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  Cheques Imputados (Proveedores)
                </CardTitle>
                <CardDescription>
                  Cheques utilizados para saldar cuentas corrientes en{" "}
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
                        <TableHead>Destino</TableHead>
                        <TableHead>Emisor</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyData.chequesImputadosProveedores.map((cheque) => (
                        <TableRow key={cheque.id}>
                          <TableCell className="text-sm">
                            {cheque.fechaImputacion
                              ? new Date(cheque.fechaImputacion).toLocaleDateString(
                                  "es-AR",
                                )
                              : "—"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {cheque.numero || "—"}
                          </TableCell>
                          <TableCell>{cheque.destino || "Cuenta Corriente"}</TableCell>
                          <TableCell>{cheque.emisor}</TableCell>
                          <TableCell className="text-right font-semibold text-blue-600">
                            ${cheque.monto.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
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
                                  const url = `https://wa.me/549${orden.telefono!.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje)}`;
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
