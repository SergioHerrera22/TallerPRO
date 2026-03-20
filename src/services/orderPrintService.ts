import { PDFDocument } from "pdf-lib";
import jsPDF, { jsPDFOptions } from "jspdf";
import html2canvas from "html2canvas";
import { OrdenTrabajo } from "../app/types";
import checkPdfUrl from "./check.pdf?url";

async function htmlCanvasToPdf(htmlString: string): Promise<ArrayBuffer> {
  const container = document.createElement("div");
  container.innerHTML = htmlString;
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "800px";
  container.style.backgroundColor = "white";
  container.style.padding = "20px";
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      allowTaint: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdfOptions: jsPDFOptions = {
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    };
    const pdf = new jsPDF(pdfOptions);

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 10;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let currentY = 5;
    let remainingHeight = imgHeight;

    pdf.addImage(imgData, "PNG", 5, currentY, imgWidth, imgHeight);

    while (remainingHeight > pageHeight - 10) {
      pdf.addPage();
      currentY -= pageHeight;
      remainingHeight -= pageHeight;
      pdf.addImage(imgData, "PNG", 5, currentY, imgWidth, imgHeight);
    }

    return pdf.output("arraybuffer");
  } finally {
    document.body.removeChild(container);
  }
}

function buildOrderWithoutPricesHtml(order: OrdenTrabajo) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #333; background: white; }
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
          .footer { border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 14px; font-size: 11px; color: #6b7280; }
        </style>
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
            <tr><th>Detalle</th></tr>
            ${order.repuestos.map((r) => `<tr><td>${r.detalle}</td></tr>`).join("")}
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
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #333; background: white; }
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
            <tr><th>Detalle</th><th class="right">Precio</th></tr>
            ${order.repuestos
              .map(
                (r) =>
                  `<tr><td>${r.detalle}</td><td class="right">$${(r.precio || 0).toFixed(2)}</td></tr>`,
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

async function getCheckPdfBytes(): Promise<ArrayBuffer> {
  const fallbackUrls = [
    checkPdfUrl,
    "/src/services/check.pdf",
    "/check.pdf",
    "/assets/check-CQG3kePf.pdf",
  ];

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

  console.warn("No se pudo cargar el PDF de check, continuando sin él");
  return new ArrayBuffer(0);
}

async function mergePdfBuffers(buffers: ArrayBuffer[]): Promise<Uint8Array> {
  const validBuffers = buffers.filter((b) => b.byteLength > 0);

  if (validBuffers.length === 0) {
    throw new Error("No hay PDFs válidos para fusionar");
  }

  const mergedPdf = await PDFDocument.create();

  for (const buffer of validBuffers) {
    try {
      const sourcePdf = await PDFDocument.load(buffer);
      const copiedPages = await mergedPdf.copyPages(
        sourcePdf,
        sourcePdf.getPageIndices(),
      );

      copiedPages.forEach((page) => mergedPdf.addPage(page));
    } catch (err) {
      console.warn("No se pudo cargar un PDF, continuando...", err);
      continue;
    }
  }

  return mergedPdf.save();
}

export async function printOrderPackage(order: OrdenTrabajo) {
  const [withPricesPdf, withoutPricesPdf, checkPdf] = await Promise.all([
    htmlCanvasToPdf(buildOrderWithPricesHtml(order)),
    htmlCanvasToPdf(buildOrderWithoutPricesHtml(order)),
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
  }, 1000);
}
