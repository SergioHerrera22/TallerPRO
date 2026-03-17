import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { useEffect } from "react";
import { syncAll } from "../services/syncService";
import { pullFromSupabase } from "../services/pullService";
import { db } from "../db";

export default function App() {
  // 1. Efecto para Carga Inicial y Ciclo Automático
  useEffect(() => {
    const initApp = async () => {
      console.log("App iniciada: Sincronizando datos...");
      await pullFromSupabase(); // Trae lo de otros
      await syncAll(); // Sube lo que tengas pendiente local
    };

    initApp();

    // Configurar el intervalo de 1 minuto una sola vez al cargar la app
    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncAll();
        console.log(
          "Sincronización automática ejecutada:",
          new Date().toLocaleTimeString(),
        );
      }
    }, 60000);

    // Limpiar el intervalo cuando se cierra la app
    return () => clearInterval(interval);
  }, []);

  // 2. Función de Guardado (Fuera del useEffect)
  const onGuardarAlgo = async (nuevoItem) => {
    try {
      // Primero en IndexedDB para respuesta instantánea en la UI
      await db.cheques.add(nuevoItem);

      // Intentar subirlo a la nube de inmediato si hay internet
      if (navigator.onLine) {
        await syncAll();
        console.log("Guardado y sincronizado con la nube");
      } else {
        console.log(
          "Guardado localmente (sin internet). Se sincronizará luego.",
        );
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      console.log("Error al guardar los datos");
    }
  };

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </>
  );
}
