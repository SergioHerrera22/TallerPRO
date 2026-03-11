import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { VehicleDetail } from "./pages/VehicleDetail";
import { Expenses } from "./pages/Expenses";

function Root() {
  return <Layout><Dashboard /></Layout>;
}

function VehicleDetailPage() {
  return <Layout><VehicleDetail /></Layout>;
}

function ExpensesPage() {
  return <Layout><Expenses /></Layout>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
  },
  {
    path: "/vehiculo/:id",
    Component: VehicleDetailPage,
  },
  {
    path: "/gastos",
    Component: ExpensesPage,
  },
]);
