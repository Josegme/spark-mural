/**
 * Genera un PDF de certificado a partir de un DOM node usando html2canvas + jsPDF.
 * Devuelve el PDF como base64 (sin prefijo data:).
 */
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PdfResult {
  base64: string;
  blob: Blob;
  dataUrl: string;
}

export async function generarCertificadoPDF(
  node: HTMLElement,
  orientacion: 'horizontal' | 'vertical',
  filename = 'certificado.pdf'
): Promise<PdfResult> {
  // Renderiza el node a un canvas de alta resolución
  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.92);

  const pdf = new jsPDF({
    orientation: orientacion === 'horizontal' ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);

  const blob = pdf.output('blob');
  const dataUrl = pdf.output('datauristring');
  // Quitar prefijo "data:application/pdf;filename=generated.pdf;base64,"
  const base64 = dataUrl.substring(dataUrl.indexOf(',') + 1);

  return { base64, blob, dataUrl };
}

export function downloadPdfBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
