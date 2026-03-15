import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { useEffect } from "react";
import { syncAll } from "../services/syncService";

export default function App() {
  useEffect(() => {
    // sincronizar al iniciar
    syncAll();

    // sincronizar cada 1 minuto
    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncAll();
        console.log(
          "Sincronización ejecutada:",
          new Date().toLocaleTimeString(),
        );
      }
    }, 60000); // 60000 ms = 1 minuto

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </>
  );
}
