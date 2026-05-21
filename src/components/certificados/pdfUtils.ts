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
  // El nodo puede estar dentro de un contenedor con transform: scale(),
  // lo que hace que html2canvas calcule mal el bounding rect y termine
  // renderizando el texto duplicado/encimado. Pasamos width/height explícitos
  // tomados del propio nodo (offsetWidth/Height ignoran transforms del padre)
  // para forzar la captura en su tamaño real.
  const realWidth = node.offsetWidth;
  const realHeight = node.offsetHeight;

  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    width: realWidth,
    height: realHeight,
    windowWidth: realWidth,
    windowHeight: realHeight,
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
