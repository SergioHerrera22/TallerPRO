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
  Menu,
  LogOut,
} from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { sync } from "../../services/syncEngine";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "./ui/sheet";

const fondoImage = new URL("../assets/fondo.jpg", import.meta.url).href;

const AUTH_STORAGE_KEY = "tallerpro.auth.front";

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

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

  const handleSignOut = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    toast.success("Sesión cerrada");
    window.location.reload();
  };

  return (
    <div
      className="relative min-h-screen w-screen left-1/2 -translate-x-1/2 overflow-x-hidden"
      style={{
        backgroundImage: `url(${fondoImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-slate-950/75 pointer-events-none" />
      <div className="relative z-10">
        <nav className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-white/10">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center min-w-0">
                <div className="flex-shrink-0 flex items-center min-w-0">
                  <Car className="h-8 w-8 text-blue-600" />
                  <span className="ml-2 text-xl font-semibold text-gray-900 truncate">
                    Taller PRO
                  </span>
                </div>
                {/* Desktop nav */}
                <div className="ml-6 hidden md:flex space-x-1">
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

              <div className="flex items-center gap-2">
                {/* Mobile nav trigger */}
                <div className="md:hidden">
                  <Sheet
                    open={isMobileNavOpen}
                    onOpenChange={setIsMobileNavOpen}
                  >
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2"
                        aria-label="Abrir menú"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72">
                      <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                          <Car className="h-5 w-5 text-blue-600" />
                          Taller PRO
                        </SheetTitle>
                      </SheetHeader>

                      <div className="px-2 pb-4">
                        <div className="space-y-1">
                          {navLinks.map(({ path, label, icon: Icon }) => (
                            <SheetClose asChild key={path}>
                              <Link
                                to={path}
                                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                                  isActive(path)
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                                <span>{label}</span>
                              </Link>
                            </SheetClose>
                          ))}
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                {showRefreshButton && (
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
                    <span className="hidden sm:inline">Actualizar Datos</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Cerrar sesión</span>
                </Button>
              </div>
            </div>
          </div>
        </nav>
        <main className="w-full py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
