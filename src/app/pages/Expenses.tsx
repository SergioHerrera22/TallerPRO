import { useState, useEffect } from "react";
import { Expense } from "../types";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { ExpenseForm } from "../components/ExpenseForm";
import { Plus, TrendingDown, Calendar, Tag, CreditCard } from "lucide-react";
import { toast } from "sonner";

export function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = () => {
    const stored = localStorage.getItem("expenses");
    if (stored) {
      const allExpenses: Expense[] = JSON.parse(stored);
      // ensure numeric fields are numbers in state
      const normalized = allExpenses.map((e) => ({
        ...e,
        monto: Number(e.monto),
        iva: Number(e.iva),
        total: Number(e.total),
      }));
      setExpenses(
        normalized.sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
        ),
      );
    }
  };

  const handleAddExpense = (expenseData: Omit<Expense, "id">) => {
    const newExpense: Expense = {
      ...expenseData,
      id: Date.now().toString(),
    };

    const stored = localStorage.getItem("expenses");
    const allExpenses = stored ? JSON.parse(stored) : [];
    const updatedExpenses = [...allExpenses, newExpense];
    localStorage.setItem("expenses", JSON.stringify(updatedExpenses));

    setExpenses([newExpense, ...expenses]);
    setShowExpenseForm(false);
    toast.success("Gasto registrado exitosamente");
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.fecha);
    return (
      expenseDate.getMonth() === currentMonth &&
      expenseDate.getFullYear() === currentYear
    );
  });

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.total || expense.monto),
    0,
  );
  const monthlyTotal = monthlyExpenses.reduce(
    (sum, expense) => sum + Number(expense.total || expense.monto),
    0,
  );
  const totalIVA = expenses.reduce(
    (sum, expense) => sum + Number(expense.iva || 0),
    0,
  );
  const monthlyIVA = monthlyExpenses.reduce(
    (sum, expense) => sum + Number(expense.iva || 0),
    0,
  );

  const categorySums = expenses.reduce(
    (acc, expense) => {
      acc[expense.categoria] =
        (acc[expense.categoria] || 0) + Number(expense.total || expense.monto);
      return acc;
    },
    {} as Record<string, number>,
  );

  const topCategories = Object.entries(categorySums)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const filteredExpenses =
    filter === "all"
      ? expenses
      : expenses.filter((e) => e.categoria === filter);

  const uniqueCategories = Array.from(
    new Set(expenses.map((e) => e.categoria)),
  );

  return (
    <div className="px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-1">
            Control de Gastos
          </h1>
          <p className="text-gray-600">
            Gestiona y monitorea todos los gastos del taller
          </p>
        </div>
        <Button onClick={() => setShowExpenseForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Gasto
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">
              $
              {totalExpenses.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {expenses.length} registros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total IVA Acumulado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-blue-600">
              $
              {totalIVA.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-sm text-gray-500 mt-1">IVA (21%)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Gastos del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">
              $
              {monthlyTotal.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              IVA: $
              {monthlyIVA.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Categorías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-gray-900">
              {uniqueCategories.length}
            </p>
            <p className="text-sm text-gray-500 mt-1">diferentes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Historial de Gastos</CardTitle>
                <CardDescription>Registro detallado de gastos</CardDescription>
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Todas las categorías</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-12">
                <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No hay gastos registrados</p>
                <Button onClick={() => setShowExpenseForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Primer Gasto
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {expense.categoria}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {expense.descripcion}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(expense.fecha).toLocaleDateString(
                              "es-AR",
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            {expense.metodoPago}
                          </div>
                          {expense.proveedor && (
                            <div className="flex items-center gap-1">
                              <Tag className="h-4 w-4" />
                              {expense.proveedor}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            Base: $
                            {expense.monto.toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          {expense.iva !== undefined && expense.iva > 0 && (
                            <p className="text-sm text-blue-600">
                              IVA: $
                              {expense.iva.toLocaleString("es-AR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          )}
                          <p className="text-xl font-semibold text-red-600">
                            Total: $
                            {(expense.total || expense.monto).toLocaleString(
                              "es-AR",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Categorías</CardTitle>
            <CardDescription>Gastos por categoría</CardDescription>
          </CardHeader>
          <CardContent>
            {topCategories.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay datos disponibles</p>
            ) : (
              <div className="space-y-4">
                {topCategories.map(([category, amount]) => {
                  const percentage = (amount / totalExpenses) * 100;
                  return (
                    <div key={category}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {category}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          $
                          {amount.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {percentage.toFixed(1)}% del total
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showExpenseForm && (
        <ExpenseForm
          onSubmit={handleAddExpense}
          onCancel={() => setShowExpenseForm(false)}
        />
      )}
    </div>
  );
}
