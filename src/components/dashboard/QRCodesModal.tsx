/**
 * Modal de Códigos QR — rediseñado con heurísticas de diseño 2026:
 * - Jerarquía visual clara (título grande, descripción muted, separación con tokens)
 * - Tabs full-width con label visible siempre (ícono + texto en mobile y desktop)
 * - QR centrado con tarjeta blanca y sombra suave
 * - URL en bloque code con scroll horizontal interno (no rompe layout)
 * - Acciones primaria (Abrir) destacada, secundarias (Copiar/Descargar) outline
 * - Mobile: bottom sheet 100% ancho real
 * - Desktop: dialog max-w-xl centrado
 * - Sin overflow, sin elementos cortados
 */

import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Download, ExternalLink, Monitor, Upload, Image as ImageIcon } from 'lucide-react';
import { getMuroUrl, getUploadUrl, getDownloadUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { UserEvent } from '@/hooks/useUserEvents';

interface QRCodesModalProps {
  event: UserEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRCodesModal({ event, open, onOpenChange }: QRCodesModalProps) {
  const { toast } = useToast();

  if (!event) return null;

  const qrCodes = [
    {
      id: 'pantalla',
      title: 'Muro',
      fullTitle: 'Muro en Pantalla',
      description: 'Mostrá el muro en la pantalla del evento',
      icon: Monitor,
      url: getMuroUrl(event.qr_pantalla_token),
    },
    {
      id: 'invitados',
      title: 'Subir',
      fullTitle: 'Subir Contenido',
      description: 'Para que los invitados suban fotos y mensajes',
      icon: Upload,
      url: getUploadUrl(event.qr_invitados_token),
    },
    {
      id: 'descarga',
      title: 'Álbum',
      fullTitle: 'Descargar Álbum',
      description: 'Para que descarguen las fotos del evento',
      icon: ImageIcon,
      url: getDownloadUrl(event.qr_descarga_token),
    },
  ];

  const copyToClipboard = async (url: string, type: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: '¡Copiado!',
        description: `Link de ${type} copiado al portapapeles`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo copiar el link',
        variant: 'destructive',
      });
    }
  };

  const generateQRImageUrl = (data: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=${encodeURIComponent(data)}`;

  const downloadQR = async (url: string, label: string) => {
    try {
      const response = await fetch(generateQRImageUrl(url));
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = event.nombre.toLowerCase().replace(/\s+/g, '-');
      link.href = blobUrl;
      link.download = `qr-${label}-${safeName}.png`;
      link.click();
      URL.revokeObjectURL(blobUrl);
      toast({ title: '¡Descargado!', description: `QR de ${label} descargado` });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo descargar el QR',
        variant: 'destructive',
      });
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent desktopClassName="w-[calc(100%-2rem)] max-w-sm sm:max-w-md max-h-[85vh]">
        <ResponsiveModalHeader className="pr-8">
          <ResponsiveModalTitle className="font-display text-xl sm:text-2xl">
            Códigos QR
          </ResponsiveModalTitle>
          <ResponsiveModalDescription className="text-sm text-muted-foreground">
            Compartí estos códigos con tus invitados —{' '}
            <span className="font-medium text-foreground">{event.nombre}</span>
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <Tabs defaultValue="pantalla" className="mt-4 w-full min-w-0">
          <TabsList className="grid w-full grid-cols-3 h-9 p-1">
            {qrCodes.map((qr) => {
              const Icon = qr.icon;
              return (
                <TabsTrigger
                  key={qr.id}
                  value={qr.id}
                  className="gap-1.5 px-2 text-xs touch-feedback data-[state=active]:shadow-sm"
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{qr.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {qrCodes.map((qr) => (
            <TabsContent key={qr.id} value={qr.id} className="mt-4 space-y-3 focus-visible:outline-none min-w-0">
              <div className="text-center space-y-0.5">
                <h3 className="font-display font-semibold text-sm">{qr.fullTitle}</h3>
                <p className="text-xs text-muted-foreground">{qr.description}</p>
              </div>

              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-xl shadow-md ring-1 ring-border">
                  <img
                    src={generateQRImageUrl(qr.url)}
                    alt={`QR Code ${qr.fullTitle}`}
                    className="w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] block"
                    loading="lazy"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-muted/60 border border-border px-2.5 py-1.5 min-w-0 w-full">
                <code className="flex-1 text-xs font-mono text-foreground/80 truncate min-w-0">
                  {qr.url}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => copyToClipboard(qr.url, qr.fullTitle)}
                  aria-label="Copiar link"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="touch-feedback w-full sm:flex-1 min-w-0"
                  onClick={() => downloadQR(qr.url, qr.id)}
                >
                  <Download className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate">Descargar QR</span>
                </Button>
                <Button size="sm" className="btn-hero touch-feedback w-full sm:flex-1 min-w-0" asChild>
                  <a href={qr.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2 shrink-0" />
                    <span className="truncate">Abrir</span>
                  </a>
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
