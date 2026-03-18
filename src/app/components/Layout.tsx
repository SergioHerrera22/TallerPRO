import { Link, useLocation } from "react-router";
import { useState } from "react";
import {
  Car,
  Home,
  FileText,
  CreditCard,
  Droplets,
  Receipt,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { sync } from "../../services/syncEngine";

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: "/", label: "Inicio", icon: Home },
    { path: "/ordenes", label: "Órdenes", icon: FileText },
    { path: "/cuentas", label: "Cuentas", icon: Receipt },
    { path: "/cheques", label: "Cheques", icon: CreditCard },
    { path: "/lavados", label: "Lavados", icon: Droplets },

    { path: "/gestion-financiera", label: "Finanzas", icon: Shield },
  ];

  const showRefreshButton = location.pathname !== "/gestion-financiera";

  const handleRefreshData = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      const res = await sync();
      if (!res?.success) toast.error("Error sincronizando datos");

      window.dispatchEvent(new Event("app:refreshData"));
      toast.success("Datos actualizados");
    } catch (error) {
      console.error(error);
      toast.error("Error sincronizando datos");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Car className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-semibold text-gray-900">
                  Taller PRO
                </span>
              </div>
              <div className="ml-6 flex space-x-1 flex-wrap">
                {navLinks.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive(path)
                        ? "bg-blue-50 text-blue-600 border-b-2 border-blue-500"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {showRefreshButton && (
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleRefreshData}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  Actualizar Datos
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
