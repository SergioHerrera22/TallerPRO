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
  container.style.padding = "10px";
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
          body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #111827; background: #fff; line-height: 1.5; }
          .container { max-width: 860px; margin: 0 auto; padding: 18px 14px; }
          .header { border-bottom: 1px solid #d1d5db; padding-bottom: 10px; margin-bottom: 12px; }
          .title { font-size: 22px; font-weight: 700; color: #111827; letter-spacing: 0.2px; }
          .ot-id { font-size: 16px; font-weight: 600; color: #1f2937; margin-top: 2px; }
          .section { border: 1px solid #e5e7eb; border-radius: 8px; padding: 9px 11px; margin-bottom: 8px; }
          .section-title { font-size: 12px; font-weight: 700; color: #111827; margin-bottom: 7px; text-transform: none; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .label { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 2px; }
          .value { font-size: 12px; font-weight: 500; color: #111827; white-space: pre-wrap; word-break: break-word; line-height: 1.4; }
          .list { margin-left: 16px; }
          .list li { font-size: 12px; margin-bottom: 3px; color: #111827; }
          
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="title">ORDEN DE TRABAJO</div>
            <div class="ot-id">${order.numeroOT}</div>
          </div>

          <div class="section">
            <div class="section-title">Información General</div>
            <div class="grid-3">
              <div>
                <div class="label">Número OT</div>
                <div class="value">${order.numeroOT}</div>
              </div>
              <div>
                <div class="label">Estado</div>
                <div class="value">${order.estado.charAt(0).toUpperCase() + order.estado.slice(1)}</div>
              </div>
              <div>
                <div class="label">Fecha</div>
                <div class="value">${new Date(order.fecha).toLocaleDateString("es-AR")}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Datos del Vehículo</div>
            <div class="grid-2">
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
            <div class="section-title">Trabajo Realizado</div>
            <div>
              <div class="label">Descripción</div>
              <div class="value">${order.descripcion}</div>
            </div>
            <div style="margin-top: 6px;">
              <div class="label">Técnico a Cargo</div>
              <div class="value">${order.tecnico}</div>
            </div>
          </div>

          ${
            order.repuestos && order.repuestos.length > 0
              ? `
          <div class="section">
            <div class="section-title">Repuestos Utilizados</div>
            <div class="label">Detalle</div>
            <ul class="list">
              ${order.repuestos.map((r) => `<li>${r.detalle}</li>`).join("")}
            </ul>
          </div>
          `
              : ""
          }

          ${
            order.observaciones
              ? `
          <div class="section">
            <div class="section-title">Observaciones</div>
            <div class="value" style="line-height: 1.5; padding: 8px; background: #f9fafb; border-radius: 3px;">${order.observaciones}</div>
          </div>
          `
              : ""
          }

          <div class="section">
            <div class="section-title">Servicios</div>
            <div class="value">${order.lavado ? "Lavado de Vehículo" : "Sin lavado de vehículo"}</div>
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
          body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #111827; background: #fff; line-height: 1.5; }
          .container { max-width: 860px; margin: 0 auto; padding: 18px 14px; }
          .header { border-bottom: 1px solid #d1d5db; padding-bottom: 10px; margin-bottom: 12px; }
          .title { font-size: 22px; font-weight: 700; color: #111827; letter-spacing: 0.2px; }
          .ot-id { font-size: 16px; font-weight: 600; color: #1f2937; margin-top: 2px; }
          .section { border: 1px solid #e5e7eb; border-radius: 8px; padding: 9px 11px; margin-bottom: 8px; }
          .section-title { font-size: 12px; font-weight: 700; color: #111827; margin-bottom: 7px; text-transform: none; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .label { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 2px; }
          .value { font-size: 12px; font-weight: 500; color: #111827; white-space: pre-wrap; word-break: break-word; line-height: 1.4; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; padding: 6px 4px; font-size: 10px; color: #6b7280; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; }
          td { padding: 6px 4px; font-size: 12px; border-bottom: 1px solid #f3f4f6; }
          .right { text-align: right; }
          
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="title">ORDEN DE TRABAJO</div>
            <div class="ot-id">${order.numeroOT}</div>
          </div>

          <div class="section">
            <div class="section-title">Información General</div>
            <div class="grid-3">
              <div>
                <div class="label">Número OT</div>
                <div class="value">${order.numeroOT}</div>
              </div>
              <div>
                <div class="label">Estado</div>
                <div class="value">${order.estado.charAt(0).toUpperCase() + order.estado.slice(1)}</div>
              </div>
              <div>
                <div class="label">Fecha</div>
                <div class="value">${new Date(order.fecha).toLocaleDateString("es-AR")}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Datos del Vehículo</div>
            <div class="grid-2">
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
            <div class="section-title">Trabajo Realizado</div>
            <div>
              <div class="label">Descripción</div>
              <div class="value">${order.descripcion}</div>
            </div>
            <div style="margin-top: 6px;">
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
                  <th>Detalle</th>
                  <th class="right">Precio Unit.</th>
                </tr>
              </thead>
              <tbody>
                ${order.repuestos.map((r) => `<tr><td>${r.detalle}</td><td class="right">$${(r.precio || 0).toFixed(2)}</td></tr>`).join("")}
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
            <div class="value" style="line-height: 1.5; padding: 8px; background: #f9fafb; border-radius: 3px;">${order.observaciones}</div>
          </div>
          `
              : ""
          }

          <div class="section">
            <div class="section-title">Servicios</div>
            <div class="value">${order.lavado ? "Lavado de Vehículo" : "Sin lavado de vehículo"}</div>
          </div>

          <div class="section">
            <div class="section-title">Resumen de Importes</div>
            <table>
              <tr>
                <td>Mano de Obra</td>
                <td class="right">$${(order.manoDeObra || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Repuestos</td>
                <td class="right">$${(order.repuestos?.reduce((sum, r) => sum + (r.precio || 0), 0) || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Total OT</strong></td>
                <td class="right"><strong>$${order.monto.toFixed(2)}</strong></td>
              </tr>
            </table>
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

  const mergedPdfBuffer = Uint8Array.from(mergedPdfBytes).buffer;

  const blob = new Blob([mergedPdfBuffer], { type: "application/pdf" });
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
