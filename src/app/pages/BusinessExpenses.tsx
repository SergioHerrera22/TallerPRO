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
  DataPagination,
  paginateItems,
} from "../components/ui/data-pagination";

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
  DialogDescription,
  DialogFooter,
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
  MessageCircle,
  RefreshCw,
} from "lucide-react";

import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { sync } from "../../services/syncEngine";
import { dataRepository } from "../../services/dataRepository";
import {
  calculateIvaFromTotal,
  formatCurrency,
  formatLocalDate,
} from "../../utils";

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

const FINANCIAL_SECTION_PAGE_SIZE = 8;

const INITIAL_SECTION_PAGES = {
  ordenes: 1,
  entregasParciales: 1,
  egresos: 1,
  chequesClientes: 1,
  chequesProveedores: 1,
  deudores: 1,
};

export function BusinessExpenses() {
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [outboxPendingCount, setOutboxPendingCount] = useState(0);
  const [lastSyncOkAt, setLastSyncOkAt] = useState<string>("");
  const [lastSyncError, setLastSyncError] = useState<string>("");
  const [lastSyncErrorAt, setLastSyncErrorAt] = useState<string>("");

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
  const [selectedOrdenPago, setSelectedOrdenPago] =
    useState<OrdenTrabajo | null>(null);
  const [montoPago, setMontoPago] = useState("");
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(
    null,
  );
  const [sectionPages, setSectionPages] = useState({
    ...INITIAL_SECTION_PAGES,
  });

  const monthNamesCapitalized = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const noDataText = "No hay datos cargados para este mes.";

  const [selectedYear, selectedMonthNumber] = selectedMonth.split("-");
  const selectedMonthYear = Number(selectedYear) || new Date().getFullYear();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    void loadSyncStatus();
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      void loadData();
    };

    window.addEventListener("app:refreshData", handleRefresh);
    return () => window.removeEventListener("app:refreshData", handleRefresh);
  }, []);

  useEffect(() => {
    setSectionPages({ ...INITIAL_SECTION_PAGES });
    setSelectedOrdenPago(null);
    setMontoPago("");
  }, [selectedMonth]);

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

  const loadSyncStatus = async () => {
    const [pendingCount, okAt, err, errAt] = await Promise.all([
      db.outbox.count(),
      db.sync_meta.get("lastSyncOkAt"),
      db.sync_meta.get("lastSyncError"),
      db.sync_meta.get("lastSyncErrorAt"),
    ]);

    setOutboxPendingCount(pendingCount);
    setLastSyncOkAt(okAt?.value ?? "");
    setLastSyncError(err?.value ?? "");
    setLastSyncErrorAt(errAt?.value ?? "");
  };

  const handleRetrySync = async () => {
    if (isSyncingNow) return;
    setIsSyncingNow(true);
    try {
      const res = await sync();
      if (!res?.success) toast.error("Error sincronizando datos");
      else toast.success("Sincronización completada");
      await loadData();
      window.dispatchEvent(new Event("app:refreshData"));
    } catch (error) {
      console.error(error);
      toast.error("Error sincronizando datos");
    } finally {
      setIsSyncingNow(false);
      await loadSyncStatus();
    }
  };

  const reloadData = async () => {
    await loadData();
    await loadSyncStatus();
    toast.success("Datos actualizados");
  };

  const closePagoDialog = (force = false) => {
    if (processingOrderId && !force) return;
    setSelectedOrdenPago(null);
    setMontoPago("");
  };

  const openPagoDialog = (orden: OrdenTrabajo) => {
    setSelectedOrdenPago(orden);
    setMontoPago("");
  };

  const applyPaymentToOrder = async (
    ordenId: string,
    amount: number,
    successMessage: string,
  ) => {
    const ordenActual = ordenesTrabajo.find((orden) => orden.id === ordenId);

    if (!ordenActual) {
      toast.error("No se encontró la orden seleccionada");
      return;
    }

    const pago = Number(amount.toFixed(2));

    if (Number.isNaN(pago) || pago <= 0) {
      toast.error("Ingresá un monto válido");
      return;
    }

    if (pago > ordenActual.saldoPendiente) {
      toast.error("El monto no puede superar el saldo pendiente");
      return;
    }

    const updatedOrden: OrdenTrabajo = {
      ...ordenActual,
      entregasCuenta: [...(ordenActual.entregasCuenta || []), pago],
      saldoPendiente: Math.max(
        0,
        Number((ordenActual.saldoPendiente - pago).toFixed(2)),
      ),
    };

    setProcessingOrderId(ordenId);

    try {
      await dataRepository.saveOrdenTrabajo(updatedOrden);
      setOrdenesTrabajo((current) =>
        current.map((orden) =>
          orden.id === updatedOrden.id ? updatedOrden : orden,
        ),
      );
      toast.success(successMessage);

      if (selectedOrdenPago?.id === ordenId) {
        closePagoDialog(true);
      }
    } catch (error) {
      console.error(error);
      toast.error("No se pudo registrar el pago");
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleSubmitPartialPayment = async () => {
    if (!selectedOrdenPago) return;

    const pago = Number(montoPago);
    await applyPaymentToOrder(
      selectedOrdenPago.id,
      pago,
      `Pago a cuenta registrado en la OT ${selectedOrdenPago.numeroOT}`,
    );
  };

  const handlePayFullDebt = async (orden: OrdenTrabajo) => {
    await applyPaymentToOrder(
      orden.id,
      orden.saldoPendiente,
      `La OT ${orden.numeroOT} quedó saldada`,
    );
  };

  const getMonthlyData = () => {
    const [year, month] = selectedMonth.split("-");
    const yearNumber = Number(year);
    const monthIndex = Number(month) - 1;

    if (!yearNumber || monthIndex < 0 || monthIndex > 11) {
      return {
        ordenes: [],
        expenses: [],
        providerExpenses: [],
        debts: [],
        deudores: [],
        clientesUnicosConDeuda: [],
        chequesImputadosClientes: [],
        chequesImputadosProveedores: [],
        partialDeliveries: [],
        totalIngresos: 0,
        totalIngresosCheques: 0,
        totalEgresos: 0,
        totalIvaCuentasCorrientes: 0,
        totalDeudas: 0,
        totalDeudores: 0,
        balance: 0,
      };
    }

    const monthlyOrdenes = ordenesTrabajo.filter((orden) => {
      const date = new Date(orden.fecha);
      return (
        date.getFullYear() === yearNumber && date.getMonth() === monthIndex
      );
    });

    const monthlyPaidOrdenes = monthlyOrdenes.filter(
      (orden) => orden.saldoPendiente <= 0,
    );

    const monthlyPartialDeliveries = monthlyOrdenes
      .flatMap((orden) =>
        (orden.entregasCuenta || []).map((pago, index) => ({
          id: `${orden.id}-${index}`,
          orderId: orden.id,
          numeroOT: orden.numeroOT,
          cliente: orden.cliente,
          fecha: orden.fecha,
          pago,
          saldoPendiente: orden.saldoPendiente,
          ordenMonto: orden.monto,
          ordenPagada: orden.saldoPendiente <= 0,
        })),
      )
      .filter((entrega) => entrega.pago > 0);

    const monthlyExpenses = expenses.filter((expense) => {
      const date = new Date(expense.fecha);
      return (
        date.getFullYear() === yearNumber && date.getMonth() === monthIndex
      );
    });

    const monthlyProviderExpenses: ProviderExpenseRow[] = cuentasCorrientes
      .filter(
        (cuenta) =>
          !cuenta.deleted && cuenta.gastos && cuenta.gastos.length > 0,
      )
      .flatMap((cuenta) =>
        cuenta.gastos!.flatMap((gasto) => {
          const date = new Date(gasto.fecha);
          const isSameMonth =
            date.getFullYear() === yearNumber && date.getMonth() === monthIndex;

          if (!isSameMonth) return [];

          return [
            {
              ...gasto,
              cuentaId: cuenta.id,
              entidad: cuenta.entidad,
              cuentaSaldo: cuenta.saldo,
            },
          ];
        }),
      );

    const monthlyDebts = cuentasCorrientes.filter((cuenta) => cuenta.saldo < 0);

    const monthlyDeudores = monthlyOrdenes.filter(
      (orden) => orden.saldoPendiente > 0,
    );

    const monthlyChequesImputados = cheques.filter((cheque) => {
      if (cheque.estado !== "imputado" || !cheque.fechaImputacion) return false;
      const date = new Date(cheque.fechaImputacion);
      return (
        date.getFullYear() === yearNumber && date.getMonth() === monthIndex
      );
    });

    const monthlyChequesImputadosClientes = monthlyChequesImputados.filter(
      (cheque) => Boolean(cheque.clienteId),
    );

    const monthlyChequesImputadosProveedores = monthlyChequesImputados.filter(
      (cheque) => !cheque.clienteId,
    );

    const totalIngresos = monthlyOrdenes.reduce((sum, orden) => {
      const entregas =
        orden.entregasCuenta?.reduce((subSum, pago) => subSum + pago, 0) ?? 0;
      return sum + entregas;
    }, 0);

    const totalIngresosCheques = monthlyChequesImputadosClientes.reduce(
      (sum, cheque) => sum + cheque.monto,
      0,
    );

    const totalEgresos =
      monthlyExpenses.reduce((sum, expense) => sum + expense.total, 0) +
      monthlyProviderExpenses.reduce((sum, gasto) => sum + gasto.total, 0) +
      monthlyChequesImputadosProveedores.reduce(
        (sum, cheque) => sum + cheque.monto,
        0,
      );

    const totalIvaCuentasCorrientes = monthlyProviderExpenses.reduce(
      (sum, gasto) => {
        const iva =
          gasto.iva > 0 ? gasto.iva : calculateIvaFromTotal(gasto.total);
        return sum + iva;
      },
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
      ordenes: monthlyPaidOrdenes,
      expenses: monthlyExpenses,
      providerExpenses: monthlyProviderExpenses,
      debts: monthlyDebts,
      deudores: monthlyDeudores,
      clientesUnicosConDeuda,
      chequesImputadosClientes: monthlyChequesImputadosClientes,
      chequesImputadosProveedores: monthlyChequesImputadosProveedores,
      partialDeliveries: monthlyPartialDeliveries,
      totalIngresos,
      totalIngresosCheques,
      totalEgresos,
      totalIvaCuentasCorrientes,
      totalDeudas,
      totalDeudores,
      balance: totalIngresos + totalIngresosCheques + totalDeudores,
    };
  };

  const monthlyData = React.useMemo(
    () => getMonthlyData(),
    [selectedMonth, ordenesTrabajo, expenses, cuentasCorrientes, cheques],
  );

  const selectedMonthLabel = React.useMemo(() => {
    const monthNames = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];

    const [year, month] = selectedMonth.split("-");
    const monthIndex = Number(month) - 1;

    if (
      !year ||
      Number.isNaN(monthIndex) ||
      monthIndex < 0 ||
      monthIndex > 11
    ) {
      return selectedMonth;
    }

    return `${monthNames[monthIndex]} ${year}`;
  }, [selectedMonth]);

  const egresosRows = [
    ...monthlyData.expenses.map((expense) => ({
      kind: "expense" as const,
      id: expense.id,
      expense,
    })),
    ...monthlyData.providerExpenses.map((gasto) => ({
      kind: "provider" as const,
      id: `${gasto.cuentaId}-${gasto.id}`,
      gasto,
    })),
  ];
  const paginatedOrdenes = paginateItems(
    monthlyData.ordenes,
    sectionPages.ordenes,
    FINANCIAL_SECTION_PAGE_SIZE,
  );
  const paginatedEgresos = paginateItems(
    egresosRows,
    sectionPages.egresos,
    FINANCIAL_SECTION_PAGE_SIZE,
  );
  const paginatedChequesClientes = paginateItems(
    monthlyData.chequesImputadosClientes,
    sectionPages.chequesClientes,
    FINANCIAL_SECTION_PAGE_SIZE,
  );
  const paginatedChequesProveedores = paginateItems(
    monthlyData.chequesImputadosProveedores,
    sectionPages.chequesProveedores,
    FINANCIAL_SECTION_PAGE_SIZE,
  );
  const paginatedPartialDeliveries = paginateItems(
    monthlyData.partialDeliveries,
    sectionPages.entregasParciales,
    FINANCIAL_SECTION_PAGE_SIZE,
  );
  const paginatedDeudores = paginateItems(
    monthlyData.deudores,
    sectionPages.deudores,
    FINANCIAL_SECTION_PAGE_SIZE,
  );

  const updateSectionPage = (
    section: keyof typeof INITIAL_SECTION_PAGES,
    page: number,
  ) => {
    setSectionPages((current) => ({
      ...current,
      [section]: page,
    }));
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Dialog
            open={Boolean(selectedOrdenPago)}
            onOpenChange={(open) => {
              if (!open) closePagoDialog();
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar pago a cuenta</DialogTitle>
                <DialogDescription>
                  {selectedOrdenPago
                    ? `OT ${selectedOrdenPago.numeroOT} de ${selectedOrdenPago.cliente}. Saldo pendiente actual: $${formatCurrency(selectedOrdenPago.saldoPendiente)}`
                    : "Ingresá el monto que entrega el cliente."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <Label htmlFor="monto-pago-cuenta">Monto entregado</Label>
                <Input
                  id="monto-pago-cuenta"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={selectedOrdenPago?.saldoPendiente ?? undefined}
                  value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                  placeholder="Ej: 5000"
                  disabled={Boolean(processingOrderId)}
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => closePagoDialog()}
                  disabled={Boolean(processingOrderId)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitPartialPayment}
                  disabled={Boolean(processingOrderId)}
                >
                  Guardar pago
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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

          {/* Estado de sincronización */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <RefreshCw
                  className={`h-5 w-5 ${isSyncingNow ? "animate-spin" : ""}`}
                />
                Estado de sincronización
              </CardTitle>
              <CardDescription>
                Cola pendiente: {outboxPendingCount} operación
                {outboxPendingCount !== 1 ? "es" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1 text-sm">
                  <div className="text-gray-700">
                    <span className="font-medium">
                      Última sincronización OK:
                    </span>{" "}
                    {lastSyncOkAt
                      ? new Date(lastSyncOkAt).toLocaleString("es-AR")
                      : "—"}
                  </div>
                  <div className="text-gray-700">
                    <span className="font-medium">Último error:</span>{" "}
                    {lastSyncError ? lastSyncError : "—"}
                  </div>
                  {lastSyncErrorAt && (
                    <div className="text-gray-500 text-xs">
                      {new Date(lastSyncErrorAt).toLocaleString("es-AR")}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleRetrySync}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={isSyncingNow}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isSyncingNow ? "animate-spin" : ""}`}
                    />
                    Reintentar sincronización
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Ingresos
                </CardTitle>
                <CardDescription>
                  Ingresos de {selectedMonthLabel}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {formatCurrency(
                    monthlyData.totalIngresos +
                      monthlyData.totalIngresosCheques,
                  )}
                </div>
                <p className="text-xs opacity-90">
                  {monthlyData.ordenes.length} órdenes facturadas
                  {monthlyData.partialDeliveries.length > 0 &&
                    ` + ${monthlyData.partialDeliveries.length} entrega${monthlyData.partialDeliveries.length !== 1 ? "s" : ""} parcial${monthlyData.partialDeliveries.length !== 1 ? "s" : ""}`}
                  {monthlyData.chequesImputadosClientes.length > 0 &&
                    ` + ${monthlyData.chequesImputadosClientes.length} cheque${monthlyData.chequesImputadosClientes.length !== 1 ? "s" : ""} imputado${monthlyData.chequesImputadosClientes.length !== 1 ? "s" : ""} (clientes)`}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Egresos
                </CardTitle>
                <CardDescription>
                  Egresos de {selectedMonthLabel}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${formatCurrency(monthlyData.totalEgresos)}
                </div>
                <p className="text-xs opacity-90">
                  {monthlyData.expenses.length +
                    monthlyData.providerExpenses.length}{" "}
                  gastos registrados
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Clientes Deudores
                </CardTitle>
                <CardDescription>
                  Clientes deudores en {selectedMonthLabel}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${formatCurrency(monthlyData.totalDeudores)}
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
                  ${formatCurrency(monthlyData.balance)}
                </div>
                <p className="text-xs opacity-90">Total recibido + adeudado</p>
              </CardContent>
            </Card>
          </div>

          {/* Reporte IVA */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-green-600" />
                  IVA Cuentas Corrientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  ${formatCurrency(monthlyData.totalIvaCuentasCorrientes)}
                </div>
                <p className="text-xs text-gray-500">
                  Total de IVA incluido en los gastos de cuentas corrientes de{" "}
                  {selectedMonthLabel}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Tables - Ingresos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ingresos - Órdenes de Trabajo */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Órdenes facturadas
                </CardTitle>
                <CardDescription>
                  Trabajos realizados en el mes de {selectedMonthLabel}
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
                      {paginatedOrdenes.totalItems > 0 ? (
                        paginatedOrdenes.pageItems.map((orden) => (
                          <TableRow key={orden.id}>
                            <TableCell className="text-sm">
                              {formatLocalDate(orden.fecha)}
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
                              ${formatCurrency(orden.monto)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-gray-500"
                          >
                            {noDataText}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <DataPagination
                  currentPage={paginatedOrdenes.currentPage}
                  totalItems={paginatedOrdenes.totalItems}
                  pageSize={FINANCIAL_SECTION_PAGE_SIZE}
                  onPageChange={(page) => updateSectionPage("ordenes", page)}
                  itemLabel="órdenes"
                  className="mt-4"
                />
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
                  Gastos realizados en {selectedMonthLabel}
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
                      {paginatedEgresos.pageItems.map((item) =>
                        item.kind === "expense" ? (
                          <TableRow key={item.id}>
                            <TableCell className="text-sm">
                              {formatLocalDate(item.expense.fecha)}
                            </TableCell>
                            <TableCell>
                              <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                {item.expense.categoria}
                              </span>
                            </TableCell>
                            <TableCell
                              className="max-w-xs truncate"
                              title={item.expense.descripcion}
                            >
                              {item.expense.descripcion}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-red-600">
                              ${formatCurrency(item.expense.total)}
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow key={item.id}>
                            <TableCell className="text-sm">
                              {formatLocalDate(item.gasto.fecha)}
                            </TableCell>
                            <TableCell>
                              <span className="px-2 py-1 bg-red-100 rounded-full text-xs">
                                Proveedor
                              </span>
                            </TableCell>
                            <TableCell
                              className="max-w-xs truncate"
                              title={item.gasto.detalleProducto}
                            >
                              <div className="flex flex-col">
                                <span>{item.gasto.detalleProducto}</span>
                                <span className="text-xs text-gray-500">
                                  {item.gasto.entidad}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell
                              className={`text-right font-semibold ${
                                item.gasto.cuentaSaldo >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                              title={
                                item.gasto.cuentaSaldo >= 0
                                  ? "Saldado"
                                  : "Pendiente (saldo proveedor negativo)"
                              }
                            >
                              ${formatCurrency(item.gasto.total)}
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                      {paginatedEgresos.totalItems === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-gray-500"
                          >
                            {noDataText}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <DataPagination
                  currentPage={paginatedEgresos.currentPage}
                  totalItems={paginatedEgresos.totalItems}
                  pageSize={FINANCIAL_SECTION_PAGE_SIZE}
                  onPageChange={(page) => updateSectionPage("egresos", page)}
                  itemLabel="egresos"
                  className="mt-4"
                />
              </CardContent>
            </Card>
          </div>

          {/* Entregas Parciales - Separado */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-600" />
                Órdenes cobradas / entregas parciales
              </CardTitle>
              <CardDescription>
                Pagos parciales asociados a órdenes de {selectedMonthLabel}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData.partialDeliveries.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>OT</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Pago</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPartialDeliveries.pageItems.map((entrega) => (
                        <TableRow key={entrega.id}>
                          <TableCell className="text-sm">
                            {formatLocalDate(entrega.fecha)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {entrega.numeroOT}
                          </TableCell>
                          <TableCell>{entrega.cliente}</TableCell>
                          <TableCell className="text-right font-semibold text-amber-600">
                            ${formatCurrency(entrega.pago)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <DataPagination
                    currentPage={paginatedPartialDeliveries.currentPage}
                    totalItems={paginatedPartialDeliveries.totalItems}
                    pageSize={FINANCIAL_SECTION_PAGE_SIZE}
                    onPageChange={(page) =>
                      updateSectionPage("entregasParciales", page)
                    }
                    itemLabel="entregas parciales"
                    className="mt-4"
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {noDataText}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-purple-600" />
                Cheques Imputados (Clientes)
              </CardTitle>
              <CardDescription>
                Cheques utilizados para saldar deudas de clientes en{" "}
                {selectedMonthLabel}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paginatedChequesClientes.totalItems > 0 ? (
                <>
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
                        {paginatedChequesClientes.pageItems.map((cheque) => {
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
                                ${formatCurrency(cheque.monto)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <DataPagination
                    currentPage={paginatedChequesClientes.currentPage}
                    totalItems={paginatedChequesClientes.totalItems}
                    pageSize={FINANCIAL_SECTION_PAGE_SIZE}
                    onPageChange={(page) =>
                      updateSectionPage("chequesClientes", page)
                    }
                    itemLabel="cheques"
                    className="mt-4"
                  />
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {noDataText}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cheques Imputados (Proveedores / Cuentas Corrientes) */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                Cheques Imputados (Proveedores)
              </CardTitle>
              <CardDescription>
                Cheques utilizados para saldar cuentas corrientes en{" "}
                {selectedMonthLabel}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paginatedChequesProveedores.totalItems > 0 ? (
                <>
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
                        {paginatedChequesProveedores.pageItems.map((cheque) => (
                          <TableRow key={cheque.id}>
                            <TableCell className="text-sm">
                              {cheque.fechaImputacion
                                ? formatLocalDate(cheque.fechaImputacion)
                                : "—"}
                            </TableCell>
                            <TableCell className="font-medium">
                              {cheque.numero || "—"}
                            </TableCell>
                            <TableCell>
                              {cheque.destino || "Cuenta Corriente"}
                            </TableCell>
                            <TableCell>{cheque.emisor}</TableCell>
                            <TableCell className="text-right font-semibold text-blue-600">
                              ${formatCurrency(cheque.monto)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <DataPagination
                    currentPage={paginatedChequesProveedores.currentPage}
                    totalItems={paginatedChequesProveedores.totalItems}
                    pageSize={FINANCIAL_SECTION_PAGE_SIZE}
                    onPageChange={(page) =>
                      updateSectionPage("chequesProveedores", page)
                    }
                    itemLabel="cheques"
                    className="mt-4"
                  />
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {noDataText}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clientes Deudores */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                Clientes Deudores
              </CardTitle>
              <CardDescription>
                Clientes que tienen saldo pendiente por pagar en{" "}
                {selectedMonthLabel}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>OT</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Patente</TableHead>
                      <TableHead className="text-right">Deuda</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDeudores.totalItems > 0 ? (
                      paginatedDeudores.pageItems.map((orden) => (
                        <TableRow key={orden.id}>
                          <TableCell className="font-medium">
                            {orden.numeroOT}
                          </TableCell>
                          <TableCell className="font-medium">
                            {orden.cliente}
                          </TableCell>
                          <TableCell>
                            {orden.telefono || "Sin teléfono"}
                          </TableCell>
                          <TableCell>{orden.patente}</TableCell>
                          <TableCell className="text-right font-semibold text-red-600">
                            ${formatCurrency(orden.saldoPendiente)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              {orden.telefono && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const mensaje = `Hola ${orden.cliente}, le recordamos que tiene un saldo pendiente de $${formatCurrency(orden.saldoPendiente)} por la orden ${orden.numeroOT} del vehículo ${orden.patente}.`;
                                    const url = `https://wa.me/549${orden.telefono!.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje)}`;
                                    window.open(url, "_blank");
                                  }}
                                  className="gap-1"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  WhatsApp
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => openPagoDialog(orden)}
                                disabled={processingOrderId === orden.id}
                              >
                                Pago a cuenta
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => handlePayFullDebt(orden)}
                                disabled={processingOrderId === orden.id}
                              >
                                Pagar todo
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-gray-500"
                        >
                          {noDataText}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <DataPagination
                currentPage={paginatedDeudores.currentPage}
                totalItems={paginatedDeudores.totalItems}
                pageSize={FINANCIAL_SECTION_PAGE_SIZE}
                onPageChange={(page) => updateSectionPage("deudores", page)}
                itemLabel="deudas"
                className="mt-4"
              />
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
