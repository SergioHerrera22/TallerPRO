import { PDFDocument } from "pdf-lib";
import { OrdenTrabajo } from "../app/types";
import checkPdfUrl from "./check.pdf?url";

function buildCommonStyles() {
  return `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; color: #333; padding: 20px; }
      .header { border-bottom: 2px solid #1f2937; margin-bottom: 16px; padding-bottom: 8px; }
      .header h1 { font-size: 22px; margin-bottom: 4px; }
      .header p { color: #666; font-size: 13px; }
      .section { margin-bottom: 14px; }
      .section h2 { font-size: 14px; font-weight: bold; color: #1f2937; margin-bottom: 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .label { font-size: 11px; font-weight: bold; color: #666; margin-bottom: 2px; }
      .value { font-size: 13px; color: #111827; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { padding: 6px 4px; border-bottom: 1px solid #e5e7eb; font-size: 12px; text-align: left; }
      th { background: #f3f4f6; font-weight: 600; }
      .right { text-align: right; }
      .footer { border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 14px; font-size: 11px; color: #6b7280; }
    </style>
  `;
}

function buildOrderWithoutPricesHtml(order: OrdenTrabajo) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>OT ${order.numeroOT} - Sin precios</title>
        ${buildCommonStyles()}
      </head>
      <body>
        <div class="header">
          <h1>ORDEN DE TRABAJO</h1>
          <p>Número: ${order.numeroOT} (Sin precios)</p>
        </div>

        <div class="section">
          <h2>Información General</h2>
          <div class="grid">
            <div>
              <div class="label">Fecha</div>
              <div class="value">${new Date(order.fecha).toLocaleDateString("es-AR")}</div>
            </div>
            <div>
              <div class="label">Estado</div>
              <div class="value">${order.estado.charAt(0).toUpperCase() + order.estado.slice(1)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Datos del Vehículo</h2>
          <div class="grid">
            <div>
              <div class="label">Patente</div>
              <div class="value">${order.patente}</div>
            </div>
            <div>
              <div class="label">Cliente</div>
              <div class="value">${order.cliente}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Trabajo Realizado</h2>
          <div>
            <div class="label">Descripción</div>
            <div class="value">${order.descripcion}</div>
          </div>
          <div style="margin-top: 6px;">
            <div class="label">Técnico</div>
            <div class="value">${order.tecnico}</div>
          </div>
        </div>

        ${
          order.repuestos && order.repuestos.length > 0
            ? `<div class="section">
          <h2>Repuestos Utilizados</h2>
          <table>
            <tr>
              <th>Detalle</th>
            </tr>
            ${order.repuestos
              .map(
                (r) => `<tr>
              <td>${r.detalle}</td>
            </tr>`,
              )
              .join("")}
          </table>
        </div>`
            : ""
        }

        ${
          order.observaciones
            ? `<div class="section">
          <h2>Observaciones</h2>
          <div class="value">${order.observaciones}</div>
        </div>`
            : ""
        }

        <div class="section">
          <h2>Servicios</h2>
          <div class="value">${order.lavado ? "Incluye lavado de vehículo" : "Sin lavado"}</div>
        </div>

        <div class="footer">
          <p>Documento generado el ${new Date().toLocaleDateString("es-AR")} a las ${new Date().toLocaleTimeString("es-AR")}</p>
          <p>Taller PRO - Sistema de Gestión</p>
        </div>
      </body>
    </html>
  `;
}

function buildOrderWithPricesHtml(order: OrdenTrabajo) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>OT ${order.numeroOT} - Con precios</title>
        ${buildCommonStyles()}
      </head>
      <body>
        <div class="header">
          <h1>COMPROBANTE DE TRABAJO</h1>
          <p>Número OT: ${order.numeroOT} (Con precios)</p>
        </div>

        <div class="section">
          <h2>Cliente y Vehículo</h2>
          <div class="grid">
            <div>
              <div class="label">Cliente</div>
              <div class="value">${order.cliente}</div>
            </div>
            <div>
              <div class="label">Patente</div>
              <div class="value">${order.patente}</div>
            </div>
          </div>
        </div>

        ${
          order.repuestos && order.repuestos.length > 0
            ? `<div class="section">
          <h2>Repuestos</h2>
          <table>
            <tr>
              <th>Detalle</th>
              <th class="right">Precio</th>
            </tr>
            ${order.repuestos
              .map(
                (r) => `<tr>
              <td>${r.detalle}</td>
              <td class="right">$${(r.precio || 0).toFixed(2)}</td>
            </tr>`,
              )
              .join("")}
          </table>
        </div>`
            : ""
        }

        <div class="section">
          <h2>Resumen de Importes</h2>
          <table>
            <tr>
              <td>Mano de Obra</td>
              <td class="right">$${(order.manoDeObra || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Total OT</strong></td>
              <td class="right"><strong>$${order.monto.toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <p>Documento generado el ${new Date().toLocaleDateString("es-AR")} a las ${new Date().toLocaleTimeString("es-AR")}</p>
          <p>Taller PRO - Sistema de Gestión</p>
        </div>
      </body>
    </html>
  `;
}

async function htmlToPdfBytes(html: string): Promise<ArrayBuffer> {
  const html2pdf = (await import("html2pdf.js")).default;

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "794px";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const pdfBuffer = await html2pdf()
      .set({
        margin: [8, 8, 8, 8],
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(container)
      .toPdf()
      .outputPdf("arraybuffer");

    return pdfBuffer;
  } finally {
    document.body.removeChild(container);
  }
}

async function getCheckPdfBytes(): Promise<ArrayBuffer> {
  const fallbackUrls = [checkPdfUrl, "/src/services/check.pdf", "/check.pdf"];

  for (const url of fallbackUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.arrayBuffer();
      }
    } catch {
      continue;
    }
  }

  throw new Error("No se pudo cargar el PDF de check");
}

async function mergePdfBuffers(buffers: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const buffer of buffers) {
    const sourcePdf = await PDFDocument.load(buffer);
    const copiedPages = await mergedPdf.copyPages(
      sourcePdf,
      sourcePdf.getPageIndices(),
    );

    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return mergedPdf.save();
}

export async function printOrderPackage(order: OrdenTrabajo) {
  const [withoutPricesPdf, withPricesPdf, checkPdf] = await Promise.all([
    htmlToPdfBytes(buildOrderWithoutPricesHtml(order)),
    htmlToPdfBytes(buildOrderWithPricesHtml(order)),
    getCheckPdfBytes(),
  ]);

  const mergedPdfBytes = await mergePdfBuffers([
    withPricesPdf,
    withoutPricesPdf,
    checkPdf,
  ]);

  const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);

  const printWindow = window.open(blobUrl, "_blank");
  if (!printWindow) {
    URL.revokeObjectURL(blobUrl);
    throw new Error("No se pudo abrir la ventana de impresión");
  }

  setTimeout(() => {
    printWindow.print();
    URL.revokeObjectURL(blobUrl);
  }, 700);
}
