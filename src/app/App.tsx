import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { useEffect, useState } from "react";
import { sync } from "../services/syncEngine";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Car, LogIn, ShieldAlert, User } from "lucide-react";
import { toast } from "sonner";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

const ADMIN_USERNAME = "admin2025";
const ADMIN_PASSWORD = "taller2025";
const AUTH_STORAGE_KEY = "tallerpro.auth.front";

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const persisted = localStorage.getItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(persisted === "true");
    setAuthReady(true);
  }, []);

  // 1. Efecto para Carga Inicial y Ciclo Automático
  useEffect(() => {
    if (!isAuthenticated) return;

    const initApp = async () => {
      console.log("App iniciada: Sincronizando datos...");
      await sync();
    };

    initApp();

    // Configurar el intervalo de 1 minuto una sola vez al cargar la app
    const interval = setInterval(() => {
      if (navigator.onLine) {
        sync();
        console.log(
          "Sincronización automática ejecutada:",
          new Date().toLocaleTimeString(),
        );
      }
    }, 60000);

    const handleOnline = () => {
      sync();
    };
    window.addEventListener("online", handleOnline);

    // Limpiar el intervalo cuando se cierra la app
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
    };
  }, [isAuthenticated]);

  const handleFrontLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedUser = username.trim();
    const normalizedPass = password.trim();

    if (!normalizedUser || !normalizedPass) {
      setFormError("Ingresá usuario y contraseña.");
      return;
    }

    if (
      normalizedUser !== ADMIN_USERNAME ||
      normalizedPass !== ADMIN_PASSWORD
    ) {
      setFormError("Usuario o clave incorrectos.");
      toast.error("No se pudo iniciar sesión");
      return;
    }

    setFormError("");
    setIsAuthenticated(true);
    localStorage.setItem(AUTH_STORAGE_KEY, "true");
    setPassword("");
    toast.success("Sesión iniciada correctamente");
  };

  if (!authReady) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Validando acceso...</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Estamos comprobando tu sesión para ingresar al sistema.
              </p>
            </CardContent>
          </Card>
        </div>
        <Toaster position="top-center" />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-md shadow-sm">
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Car className="h-5 w-5 text-blue-600" />
                Acceso Seguro Taller PRO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                <p className="text-sm text-blue-900 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  Ingresá con credenciales de administrador
                </p>
              </div>

              <form onSubmit={handleFrontLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ingrese su usuario"
                      className="pl-9"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingrese su contraseña"
                    autoComplete="current-password"
                  />
                </div>

                {formError && (
                  <p className="text-sm text-red-600">{formError}</p>
                )}

                <Button type="submit" className="w-full gap-2">
                  <LogIn className="h-4 w-4" />
                  Iniciar sesión
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <Toaster position="top-center" />
      </>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </>
  );
}
