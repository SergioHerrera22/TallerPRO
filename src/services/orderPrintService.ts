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
          body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #2c3e50; background: white; line-height: 1.6; }
          .container { max-width: 900px; margin: 0 auto; padding: 30px 20px; }
          .letterhead { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #1f2937; padding-bottom: 20px; }
          .logo-section h1 { font-size: 32px; font-weight: bold; color: #1f2937; margin: 0; }
          .logo-section p { color: #666; font-size: 12px; margin: 5px 0 0 0; }
          .doc-info { text-align: right; font-size: 11px; line-height: 1.8; }
          .doc-number { font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: white; background: #1f2937; padding: 8px 12px; margin-bottom: 12px; border-radius: 3px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px; }
          .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px; }
          .field { }
          .label { font-size: 10px; font-weight: bold; color: #666; text-transform: uppercase; margin-bottom: 4px; }
          .value { font-size: 13px; color: #111827; font-weight: 500; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #e5e7eb; padding: 10px; text-align: left; font-size: 11px; font-weight: bold; color: #1f2937; text-transform: uppercase; }
          td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
          tr:last-child td { border-bottom: none; }
          .right { text-align: right; }
          .summary-table { width: 50%; margin-left: auto; margin-right: 0; }
          .summary-table td { padding: 10px; }
          .summary-row { background: #f9fafb; font-weight: 500; }
          .summary-total { background: #1f2937; color: white; font-weight: bold; font-size: 13px; }
          .divider { height: 1px; background: #e5e7eb; margin: 20px 0; }
          .footer { border-top: 2px solid #1f2937; padding-top: 20px; margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
          .footer-company { font-weight: bold; color: #1f2937; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="letterhead">
            <div class="logo-section">
              <h1>TALLER PRO</h1>
              <p>Sistema de Gestión de Órdenes</p>
            </div>
            <div class="doc-info">
              <div class="doc-number">OT #${order.numeroOT}</div>
              <div><strong>Fecha:</strong> ${new Date(order.fecha).toLocaleDateString("es-AR")}</div>
              <div><strong>Estado:</strong> ${order.estado.charAt(0).toUpperCase() + order.estado.slice(1)}</div>
              <div><strong>Teléfono:</strong> ${order.telefono || "N/A"}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Información del Cliente</div>
            <div class="grid-2">
              <div class="field">
                <div class="label">Nombre</div>
                <div class="value">${order.cliente}</div>
              </div>
              <div class="field">
                <div class="label">Teléfono</div>
                <div class="value">${order.telefono || "N/A"}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Datos del Vehículo</div>
            <div class="grid-2">
              <div class="field">
                <div class="label">Patente</div>
                <div class="value">${order.patente}</div>
              </div>
              <div class="field">
                <div class="label">Cliente (Propietario)</div>
                <div class="value">${order.cliente}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Trabajo Realizado</div>
            <div class="field">
              <div class="label">Descripción del Trabajo</div>
              <div class="value" style="margin-top: 8px; line-height: 1.8;">${order.descripcion}</div>
            </div>
            <div style="margin-top: 15px;">
              <div class="label">Técnico a Cargo</div>
              <div class="value">${order.tecnico}</div>
            </div>
          </div>

          ${
            order.repuestos && order.repuestos.length > 0
              ? `
          <div class="section">
            <div class="section-title">Repuestos Utilizados</div>
            <table>
              <thead>
                <tr>
                  <th>Descripción del Repuesto</th>
                  <th class="right">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                ${order.repuestos.map((r) => `<tr><td>${r.detalle}</td><td class="right">1</td></tr>`).join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }

          ${
            order.observaciones
              ? `
          <div class="section">
            <div class="section-title">Observaciones</div>
            <div class="value" style="line-height: 1.8; padding: 10px; background: #f9fafb; border-radius: 3px;">${order.observaciones}</div>
          </div>
          `
              : ""
          }

          <div class="section">
            <div class="section-title">Servicios Adicionales</div>
            <div class="value">🔧 ${order.lavado ? "Incluye Lavado de Vehículo" : "Sin servicios adicionales"}</div>
          </div>

          <div class="section">
            <div class="section-title">Resumen de Gastos</div>
            <table class="summary-table">
              <tr class="summary-row">
                <td>Mano de Obra</td>
                <td class="right">-</td>
              </tr>
              <tr class="summary-total">
                <td>Total OT</td>
                <td class="right">-</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <div class="footer-company">TALLER PRO - Sistema de Gestión</div>
            <div>Documento generado: ${new Date().toLocaleDateString("es-AR")} a las ${new Date().toLocaleTimeString("es-AR")}</div>
          </div>
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
          body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #2c3e50; background: white; line-height: 1.6; }
          .container { max-width: 900px; margin: 0 auto; padding: 30px 20px; }
          .letterhead { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #1f2937; padding-bottom: 20px; }
          .logo-section h1 { font-size: 32px; font-weight: bold; color: #1f2937; margin: 0; }
          .logo-section p { color: #666; font-size: 12px; margin: 5px 0 0 0; }
          .doc-info { text-align: right; font-size: 11px; line-height: 1.8; }
          .doc-number { font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: white; background: #1f2937; padding: 8px 12px; margin-bottom: 12px; border-radius: 3px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px; }
          .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px; }
          .field { }
          .label { font-size: 10px; font-weight: bold; color: #666; text-transform: uppercase; margin-bottom: 4px; }
          .value { font-size: 13px; color: #111827; font-weight: 500; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #e5e7eb; padding: 10px; text-align: left; font-size: 11px; font-weight: bold; color: #1f2937; text-transform: uppercase; }
          td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
          tr:last-child td { border-bottom: none; }
          .right { text-align: right; }
          .summary-table { width: 50%; margin-left: auto; margin-right: 0; }
          .summary-table td { padding: 10px; }
          .summary-row { background: #f9fafb; font-weight: 500; }
          .summary-total { background: #1f2937; color: white; font-weight: bold; font-size: 13px; }
          .divider { height: 1px; background: #e5e7eb; margin: 20px 0; }
          .footer { border-top: 2px solid #1f2937; padding-top: 20px; margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
          .footer-company { font-weight: bold; color: #1f2937; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="letterhead">
            <div class="logo-section">
              <h1>TALLER PRO</h1>
              <p>Sistema de Gestión de Órdenes</p>
            </div>
            <div class="doc-info">
              <div class="doc-number">OT #${order.numeroOT}</div>
              <div><strong>Fecha:</strong> ${new Date(order.fecha).toLocaleDateString("es-AR")}</div>
              <div><strong>Estado:</strong> ${order.estado.charAt(0).toUpperCase() + order.estado.slice(1)}</div>
              <div><strong>Teléfono:</strong> ${order.telefono || "N/A"}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Información del Cliente</div>
            <div class="grid-2">
              <div class="field">
                <div class="label">Nombre</div>
                <div class="value">${order.cliente}</div>
              </div>
              <div class="field">
                <div class="label">Teléfono</div>
                <div class="value">${order.telefono || "N/A"}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Datos del Vehículo</div>
            <div class="grid-2">
              <div class="field">
                <div class="label">Patente</div>
                <div class="value">${order.patente}</div>
              </div>
              <div class="field">
                <div class="label">Cliente (Propietario)</div>
                <div class="value">${order.cliente}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Trabajo Realizado</div>
            <div class="field">
              <div class="label">Descripción del Trabajo</div>
              <div class="value" style="margin-top: 8px; line-height: 1.8;">${order.descripcion}</div>
            </div>
            <div style="margin-top: 15px;">
              <div class="label">Técnico a Cargo</div>
              <div class="value">${order.tecnico}</div>
            </div>
          </div>

          ${
            order.repuestos && order.repuestos.length > 0
              ? `
          <div class="section">
            <div class="section-title">Repuestos Utilizados</div>
            <table>
              <thead>
                <tr>
                  <th>Descripción del Repuesto</th>
                  <th class="right">Precio Unit.</th>
                  <th class="right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.repuestos.map((r) => `<tr><td>${r.detalle}</td><td class="right">$${(r.precio || 0).toFixed(2)}</td><td class="right">$${(r.precio || 0).toFixed(2)}</td></tr>`).join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }

          ${
            order.observaciones
              ? `
          <div class="section">
            <div class="section-title">Observaciones</div>
            <div class="value" style="line-height: 1.8; padding: 10px; background: #f9fafb; border-radius: 3px;">${order.observaciones}</div>
          </div>
          `
              : ""
          }

          <div class="section">
            <div class="section-title">Servicios Adicionales</div>
            <div class="value">🔧 ${order.lavado ? "Incluye Lavado de Vehículo" : "Sin servicios adicionales"}</div>
          </div>

          <div class="section">
            <div class="section-title">Resumen de Importes</div>
            <table class="summary-table">
              <tr class="summary-row">
                <td>Mano de Obra</td>
                <td class="right">$${(order.manoDeObra || 0).toFixed(2)}</td>
              </tr>
              <tr class="summary-row">
                <td>Repuestos</td>
                <td class="right">$${(order.repuestos?.reduce((sum, r) => sum + (r.precio || 0), 0) || 0).toFixed(2)}</td>
              </tr>
              <tr class="summary-total">
                <td>TOTAL OT</td>
                <td class="right">$${order.monto.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <div class="footer-company">TALLER PRO - Sistema de Gestión</div>
            <div>Documento generado: ${new Date().toLocaleDateString("es-AR")} a las ${new Date().toLocaleTimeString("es-AR")}</div>
          </div>
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
