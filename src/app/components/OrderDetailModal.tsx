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

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Abrir el PDF en una nueva pestaña para imprimir
    window.open("/src/services/check.pdf", "_blank");

    const statusBadgeColor =
      order.estado === "completada"
        ? "bg-green-100 text-green-800"
        : order.estado === "en-progreso"
          ? "bg-blue-100 text-blue-800"
          : "bg-gray-100 text-gray-800";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orden de Trabajo ${order.numeroOT}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { border-bottom: 2px solid #1f2937; margin-bottom: 30px; padding-bottom: 20px; }
          .header h1 { font-size: 28px; margin-bottom: 5px; }
          .header p { color: #666; }
          .info-section { margin-bottom: 30px; }
          .info-section h2 { font-size: 14px; font-weight: bold; color: #1f2937; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .info-item { }
          .info-label { font-size: 12px; font-weight: bold; color: #666; margin-bottom: 3px; }
          .info-value { font-size: 14px; color: #1f2937; }
          .full-width { grid-column: 1 / -1; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .badge.completada { background-color: #d1fae5; color: #065f46; }
          .badge.en-progreso { background-color: #dbeafe; color: #0c4a6e; }
          .badge.pendiente { background-color: #f3f4f6; color: #374151; }
          .checkbox-item { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
          .checkbox { width: 16px; height: 16px; border: 1px solid #ccc; border-radius: 2px; }
          .checkbox.checked { background-color: #3b82f6; }
          .footer { border-top: 2px solid #1f2937; padding-top: 20px; margin-top: 30px; color: #666; font-size: 12px; }
          @media print { body { margin: 0; padding: 0; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ORDEN DE TRABAJO</h1>
            <p>${order.numeroOT}</p>
          </div>

          <div class="info-section">
            <h2>Información General</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Número OT</div>
                <div class="info-value">${order.numeroOT}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Estado</div>
                <div class="info-value">
                  <span class="badge ${order.estado}">${order.estado.charAt(0).toUpperCase() + order.estado.slice(1)}</span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">Fecha</div>
                <div class="info-value">${new Date(order.fecha).toLocaleDateString("es-AR")}</div>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h2>Datos del Vehículo</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Patente</div>
                <div class="info-value">${order.patente}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Cliente</div>
                <div class="info-value">${order.cliente}</div>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h2>Trabajo Realizado</h2>
            <div class="info-grid full-width">
              <div class="info-item">
                <div class="info-label">Descripción</div>
                <div class="info-value">${order.descripcion}</div>
              </div>
            </div>
            <div class="info-grid full-width">
              <div class="info-item">
                <div class="info-label">Técnico</div>
                <div class="info-value">${order.tecnico}</div>
              </div>
            </div>
          </div>

          ${
            order.repuestos && order.repuestos.length > 0
              ? `
          <div class="info-section">
            <h2>Repuestos Utilizados</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
              <tr>
                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Detalle</th>
              </tr>
              ${order.repuestos
                .map(
                  (r) => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.detalle}</td>
              </tr>
              `,
                )
                .join("")}
            </table>
          </div>
          `
              : ""
          }

          <div class="info-section">
            <h2>Servicios</h2>
            <div class="checkbox-item">
              <div class="checkbox ${order.lavado ? "checked" : ""}"></div>
              <span>Lavado de Vehículo</span>
            </div>
          </div>

          ${
            order.observaciones
              ? `
          <div class="info-section">
            <h2>Observaciones</h2>
            <div class="info-grid full-width">
              <div class="info-item">
                <div class="info-value">${order.observaciones}</div>
              </div>
            </div>
          </div>
          `
              : ""
          }

          <div class="footer">
            <p>Documento generado el ${new Date().toLocaleDateString("es-AR")} a las ${new Date().toLocaleTimeString("es-AR")}</p>
            <p>Taller PRO - Sistema de Gestión</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
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
