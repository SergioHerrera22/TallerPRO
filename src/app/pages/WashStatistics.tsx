import { useState, useEffect } from "react";
import { OrdenTrabajo } from "../types";
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
import { Badge } from "../components/ui/badge";
import { Droplets, TrendingUp, Calendar } from "lucide-react";

export function WashStatistics() {
  const [orders, setOrders] = useState<OrdenTrabajo[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<
    Array<{ month: string; count: number }>
  >([]);
  const [currentMonthWashes, setCurrentMonthWashes] = useState(0);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = () => {
    const saved = localStorage.getItem("ordenesTrabajo");
    if (saved) {
      const allOrders: OrdenTrabajo[] = JSON.parse(saved);
      setOrders(allOrders);

      // Filtrar solo órdenes con lavado
      const washOrders = allOrders.filter((o) => o.lavado);

      // Obtener mes actual
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1,
      ).padStart(2, "0")}`;

      // Calcular lavados del mes actual
      const thisMonthWashes = washOrders.filter((o) => {
        const orderMonth = o.fecha.substring(0, 7);
        return orderMonth === currentMonth;
      });

      setCurrentMonthWashes(thisMonthWashes.length);

      // Generar estadísticas mensuales
      const monthMap = new Map<string, { count: number }>();

      washOrders.forEach((order) => {
        const month = order.fecha.substring(0, 7);
        if (!monthMap.has(month)) {
          monthMap.set(month, { count: 0 });
        }

        const stats = monthMap.get(month)!;
        stats.count++;
      });

      // Convertir a array y ordenar
      const stats = Array.from(monthMap.entries())
        .map(([month, { count }]) => ({
          month,
          count,
        }))
        .sort((a, b) => b.month.localeCompare(a.month));

      setMonthlyStats(stats);
    }
  };

  const washOrders = orders.filter((o) => o.lavado);
  const totalWashes = washOrders.length;

  const formatMonth = (monthStr: string): string => {
    const [year, month] = monthStr.split("-");
    const months = [
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
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="px-4 sm:px-0 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Estadísticas de Lavados
        </h1>
        <p className="text-gray-600">
          Conteo de los servicios de lavado realizados por mes
        </p>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              Lavados Actuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthWashes}</div>
            <p className="text-xs text-gray-500">en este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Lavados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWashes}</div>
            <p className="text-xs text-gray-500">en todo el período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Promedio Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyStats.length > 0
                ? (totalWashes / monthlyStats.length).toFixed(1)
                : "0"}
            </div>
            <p className="text-xs text-gray-500">lavados por mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas mensuales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historial Mensual
          </CardTitle>
          <CardDescription>Desglose de lavados por mes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">
                    Cantidad de Lavados
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyStats.length > 0 ? (
                  monthlyStats.map((stat) => (
                    <TableRow key={stat.month}>
                      <TableCell className="font-medium">
                        {formatMonth(stat.month)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{stat.count}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8">
                      <p className="text-gray-500">
                        No hay datos de lavados registrados aún
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico simple de barras */}
      {monthlyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Visualización Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyStats.map((stat) => {
                const maxCount = Math.max(...monthlyStats.map((s) => s.count));
                const percentage = (stat.count / maxCount) * 100;

                return (
                  <div key={stat.month}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">
                        {formatMonth(stat.month)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {stat.count} lavado{stat.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Últimos lavados */}
      {washOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Últimos Lavados Realizados</CardTitle>
            <CardDescription>
              Últimos 10 servicios de lavado registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Patente</TableHead>
                    <TableHead>Cliente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {washOrders
                    .sort(
                      (a, b) =>
                        new Date(b.fecha).getTime() -
                        new Date(a.fecha).getTime(),
                    )
                    .slice(0, 10)
                    .map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="text-sm">
                          {new Date(order.fecha).toLocaleDateString("es-AR")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {order.patente}
                        </TableCell>
                        <TableCell>{order.cliente}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
