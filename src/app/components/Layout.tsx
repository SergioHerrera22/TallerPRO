import { Link, useLocation } from "react-router";
import {
  Car,
  DollarSign,
  Home,
  FileText,
  CreditCard,
  Droplets,
  Receipt,
  Shield,
} from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

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
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
