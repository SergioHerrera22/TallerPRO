import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { VehicleDetail } from "./pages/VehicleDetail";
import { Expenses } from "./pages/Expenses";
import { WorkOrders } from "./pages/WorkOrders";
import { AccountsLedger } from "./pages/AccountsLedger";
import { CheckManagement } from "./pages/CheckManagement";
import { WashStatistics } from "./pages/WashStatistics";

function Root() {
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}

function VehicleDetailPage() {
  return (
    <Layout>
      <VehicleDetail />
    </Layout>
  );
}

function ExpensesPage() {
  return (
    <Layout>
      <Expenses />
    </Layout>
  );
}

function WorkOrdersPage() {
  return (
    <Layout>
      <WorkOrders />
    </Layout>
  );
}

function AccountsLedgerPage() {
  return (
    <Layout>
      <AccountsLedger />
    </Layout>
  );
}

function CheckManagementPage() {
  return (
    <Layout>
      <CheckManagement />
    </Layout>
  );
}

function WashStatisticsPage() {
  return (
    <Layout>
      <WashStatistics />
    </Layout>
  );
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
  {
    path: "/ordenes",
    Component: WorkOrdersPage,
  },
  {
    path: "/cuentas",
    Component: AccountsLedgerPage,
  },
  {
    path: "/cheques",
    Component: CheckManagementPage,
  },
  {
    path: "/lavados",
    Component: WashStatisticsPage,
  },
]);
