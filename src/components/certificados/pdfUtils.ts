/**
 * Genera un PDF de certificado a partir de un DOM node usando html2canvas + jsPDF.
 * Devuelve el PDF como base64 (sin prefijo data:) y un thumbnail JPG para usar en emails.
 */
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PdfResult {
  base64: string;
  blob: Blob;
  dataUrl: string;
  /** JPG base64 (sin prefijo) listo para subir / embeber en email */
  thumbnailJpgBase64: string;
}

export async function generarCertificadoPDF(
  node: HTMLElement,
  orientacion: 'horizontal' | 'vertical',
  _filename = 'certificado.pdf'
): Promise<PdfResult> {
  const realWidth = node.offsetWidth;
  const realHeight = node.offsetHeight;

  // Capturamos un clon aislado del certificado, fuera del preview escalado.
  // Si html2canvas renderiza el nodo dentro de un ancestro con transform: scale(),
  // las coordenadas tipográficas se deforman y los textos terminan encimados.
  await document.fonts?.ready;
  const sandbox = document.createElement('div');
  sandbox.style.position = 'fixed';
  sandbox.style.left = '-10000px';
  sandbox.style.top = '0';
  sandbox.style.width = `${realWidth}px`;
  sandbox.style.height = `${realHeight}px`;
  sandbox.style.background = '#ffffff';
  sandbox.style.transform = 'none';
  sandbox.style.pointerEvents = 'none';

  const clone = node.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.width = `${realWidth}px`;
  clone.style.height = `${realHeight}px`;
  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  const canvas = await html2canvas(clone, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    width: realWidth,
    height: realHeight,
    windowWidth: realWidth,
    windowHeight: realHeight,
    scrollX: 0,
    scrollY: 0,
  });

  sandbox.remove();


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
  const base64 = dataUrl.substring(dataUrl.indexOf(',') + 1);

  // Thumbnail más comprimido y reescalado para el email
  const thumbCanvas = document.createElement('canvas');
  const maxW = 900;
  const ratio = canvas.width > maxW ? maxW / canvas.width : 1;
  thumbCanvas.width = Math.round(canvas.width * ratio);
  thumbCanvas.height = Math.round(canvas.height * ratio);
  const ctx = thumbCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, thumbCanvas.width, thumbCanvas.height);
    ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
  }
  const thumbDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.78);
  const thumbnailJpgBase64 = thumbDataUrl.substring(thumbDataUrl.indexOf(',') + 1);

  return { base64, blob, dataUrl, thumbnailJpgBase64 };
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
