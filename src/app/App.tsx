import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { useEffect } from "react";
import { sync } from "../services/syncEngine";

export default function App() {
  // 1. Efecto para Carga Inicial y Ciclo Automático
  useEffect(() => {
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
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </>
  );
}
