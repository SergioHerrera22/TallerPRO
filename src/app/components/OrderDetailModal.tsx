import React from "react";
import { OrdenTrabajo } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Printer, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { printOrderPackage } from "../../services/orderPrintService";

interface OrderDetailModalProps {
  order: OrdenTrabajo | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (order: OrdenTrabajo) => void;
  onDelete?: (orderId: string) => void;
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: OrderDetailModalProps) {
  if (!order) return null;

  const handlePrint = async () => {
    try {
      await printOrderPackage(order);
    } catch {
      toast.error("No se pudo generar/imprimir el paquete de documentos");
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "completada":
        return "bg-green-100 text-green-800";
      case "en-progreso":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Orden de Trabajo: {order.numeroOT}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información General */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Número OT</p>
              <p className="text-lg font-semibold">{order.numeroOT}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <Badge className={getStatusColor(order.estado)}>
                {order.estado.charAt(0).toUpperCase() + order.estado.slice(1)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fecha</p>
              <p className="text-lg font-semibold">
                {new Date(order.fecha).toLocaleDateString("es-AR")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Monto</p>
              <p className="text-lg font-semibold">${order.monto.toFixed(2)}</p>
            </div>
          </div>

          {/* Datos del Vehículo */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Datos del Vehículo</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Patente</p>
                <p className="font-semibold">{order.patente}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-semibold">{order.cliente}</p>
              </div>
            </div>
          </div>

          {/* Trabajo Realizado */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Trabajo Realizado</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Descripción</p>
                <p className="text-sm">{order.descripcion}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Técnico</p>
                <p className="font-semibold">{order.tecnico}</p>
              </div>
            </div>
          </div>

          {/* Repuestos Utilizados */}
          {order.repuestos && order.repuestos.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Repuestos Utilizados</h3>
              <div className="space-y-2">
                {order.repuestos.map((repuesto, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-gray-50 p-2 rounded border text-sm"
                  >
                    <span>{repuesto.detalle}</span>
                    <span className="font-semibold">
                      ${repuesto.precio.toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center font-semibold pt-2 border-t">
                  <span>Subtotal Repuestos:</span>
                  <span>
                    $
                    {(
                      order.repuestos?.reduce((sum, r) => sum + r.precio, 0) ||
                      0
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mano de Obra */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Mano de Obra</p>
                <p className="text-lg font-semibold">
                  ${order.manoDeObra.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-lg font-bold text-blue-600">
                  ${order.monto.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Servicios */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Servicios</h3>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={order.lavado}
                disabled
                className="w-4 h-4"
              />
              <label>Lavado de Vehículo</label>
            </div>
          </div>

          {order.observaciones && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Observaciones</h3>
              <p className="text-sm text-gray-700">{order.observaciones}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 justify-between">
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" onClick={() => onEdit(order)}>
                Editar
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" onClick={() => onDelete(order.id)}>
                <X className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
