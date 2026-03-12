import { useState, useEffect } from "react";
import { CuentaCorriente, OrdenTrabajo } from "../types";
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
import { Search, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";

export function AccountsLedger() {
  const [cuentas, setCuentas] = useState<CuentaCorriente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState<CuentaCorriente | null>(
    null,
  );
  const [paymentAmount, setPaymentAmount] = useState("");

  useEffect(() => {
    loadCuentas();
  }, []);

  const loadCuentas = () => {
    const savedOrders = localStorage.getItem("ordenesTrabajo");

    if (savedOrders) {
      const orders: OrdenTrabajo[] = JSON.parse(savedOrders);

      // Agrupar órdenes por cliente
      const clientesMap = new Map<
        string,
        { deudora: number; pagada: number }
      >();

      orders.forEach((order) => {
        if (!clientesMap.has(order.cliente)) {
          clientesMap.set(order.cliente, { deudora: 0, pagada: 0 });
        }

        const cliente = clientesMap.get(order.cliente)!;

        // Si el estado está completado, se considera pagada, si no, deudora
        if (order.estado === "completada") {
          cliente.pagada += order.monto;
        } else {
          cliente.deudora += order.monto;
        }
      });

      // Convertir map a array de CuentaCorriente
      const cuentasArray: CuentaCorriente[] = Array.from(
        clientesMap.entries(),
      ).map(([cliente, { deudora, pagada }]) => ({
        id: cliente,
        cliente,
        totalDeudora: deudora,
        totalPagado: pagada,
        saldoPendiente: deudora,
        updatedAt: new Date().toISOString(),
      }));

      setCuentas(cuentasArray);
      localStorage.setItem("cuentasCorrientes", JSON.stringify(cuentasArray));
    }
  };

  const handleRefresh = () => {
    loadCuentas();
    toast.success("Cuentas actualizadas");
  };

  const handlePayment = () => {
    if (!selectedCuenta || !paymentAmount) {
      toast.error("Ingrese el monto a pagar");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    if (amount > selectedCuenta.saldoPendiente) {
      toast.error("El monto supera el saldo pendiente");
      return;
    }

    // Actualizar la cuenta
    const updatedCuentas = cuentas.map((c) =>
      c.id === selectedCuenta.id
        ? {
            ...c,
            totalPagado: c.totalPagado + amount,
            saldoPendiente: c.saldoPendiente - amount,
            updatedAt: new Date().toISOString(),
          }
        : c,
    );

    setCuentas(updatedCuentas);
    localStorage.setItem("cuentasCorrientes", JSON.stringify(updatedCuentas));

    // Guardar el pago en historial
    const pagos = JSON.parse(localStorage.getItem("pagosRealizados") || "[]");
    pagos.push({
      id: Date.now().toString(),
      cliente: selectedCuenta.cliente,
      monto: amount,
      fecha: new Date().toISOString(),
    });
    localStorage.setItem("pagosRealizados", JSON.stringify(pagos));

    setPaymentAmount("");
    setShowPaymentDialog(false);
    setSelectedCuenta(null);
    toast.success("Pago registrado exitosamente");
  };

  const filteredCuentas = cuentas.filter((cuenta) =>
    cuenta.cliente.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalDeudora = filteredCuentas.reduce(
    (sum, c) => sum + c.totalDeudora,
    0,
  );
  const totalPagado = filteredCuentas.reduce(
    (sum, c) => sum + c.totalPagado,
    0,
  );
  const saldoPendiente = filteredCuentas.reduce(
    (sum, c) => sum + c.saldoPendiente,
    0,
  );

  return (
    <div className="px-4 sm:px-0 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Cuentas Corrientes
        </h1>
        <p className="text-gray-600">
          Gestione los saldos y pagos de los clientes
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Deudora</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalDeudora.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">por cobrar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalPagado.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">recaudado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${saldoPendiente.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">por cobrar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCuentas.length}</div>
            <p className="text-xs text-gray-500">con saldo</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda y Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre de cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleRefresh} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de cuentas */}
      <Card>
        <CardHeader>
          <CardTitle>Cuentas de Clientes</CardTitle>
          <CardDescription>
            {filteredCuentas.length} cliente
            {filteredCuentas.length !== 1 ? "s" : ""} encontrado
            {filteredCuentas.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total Deudora</TableHead>
                  <TableHead className="text-right">Total Pagado</TableHead>
                  <TableHead className="text-right">Saldo Pendiente</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCuentas.length > 0 ? (
                  filteredCuentas.map((cuenta) => (
                    <TableRow key={cuenta.id}>
                      <TableCell className="font-medium">
                        {cuenta.cliente}
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-semibold">
                        ${cuenta.totalDeudora.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">
                        ${cuenta.totalPagado.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-orange-600 font-semibold">
                        ${cuenta.saldoPendiente.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedCuenta(cuenta);
                            setShowPaymentDialog(true);
                          }}
                          disabled={cuenta.saldoPendiente === 0}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Registrar Pago
                        </Button>
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

      {/* Modal de pago */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>

          {selectedCuenta && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-semibold text-lg">
                  {selectedCuenta.cliente}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Deudora</p>
                  <p className="font-semibold text-red-600">
                    ${selectedCuenta.totalDeudora.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Saldo Pendiente</p>
                  <p className="font-semibold text-orange-600">
                    ${selectedCuenta.saldoPendiente.toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="monto">Monto a Pagar *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedCuenta.saldoPendiente}
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo: ${selectedCuenta.saldoPendiente.toFixed(2)}
                </p>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentDialog(false);
                    setPaymentAmount("");
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handlePayment}>Registrar Pago</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
