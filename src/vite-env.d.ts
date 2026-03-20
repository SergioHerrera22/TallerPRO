/// <reference types="vite/client" />

declare module "html2pdf.js" {
  interface Html2PdfWorker {
    set(options: unknown): Html2PdfWorker;
    from(source: HTMLElement | string): Html2PdfWorker;
    toPdf(): Html2PdfWorker;
    outputPdf(type?: string): Promise<ArrayBuffer>;
  }

  export default function html2pdf(): Html2PdfWorker;
}
