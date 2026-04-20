/**
 * Modal para mostrar los códigos QR del evento
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Download, ExternalLink, Monitor, Upload, Image } from 'lucide-react';
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
      title: 'Muro en Pantalla',
      description: 'Para mostrar en la pantalla del evento',
      icon: Monitor,
      token: event.qr_pantalla_token,
      url: getMuroUrl(event.qr_pantalla_token),
      color: 'primary',
    },
    {
      id: 'invitados',
      title: 'Subir Contenido',
      description: 'Para que los invitados suban fotos y mensajes',
      icon: Upload,
      token: event.qr_invitados_token,
      url: getUploadUrl(event.qr_invitados_token),
      color: 'accent',
    },
    {
      id: 'descarga',
      title: 'Descargar Álbum',
      description: 'Para descargar todas las fotos del evento',
      icon: Image,
      token: event.qr_descarga_token,
      url: getDownloadUrl(event.qr_descarga_token),
      color: 'secondary',
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

  const generateQRImageUrl = (data: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
  };

  const downloadQR = async (url: string, label: string) => {
    try {
      const response = await fetch(generateQRImageUrl(url));
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = event.nombre.toLowerCase().replace(/\s+/g, '-');
      link.href = blobUrl;
      link.download = `${label}-${safeName}.png`;
      link.click();
      URL.revokeObjectURL(blobUrl);
      toast({
        title: '¡Descargado!',
        description: `QR de ${label} descargado`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo descargar el QR',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100vw-1rem)] sm:w-full max-h-[92vh] overflow-y-auto overflow-x-hidden p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-lg sm:text-xl pr-6">
            Códigos QR - {event.nombre}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Compartí estos códigos con tus invitados para que participen del evento
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="pantalla" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            {qrCodes.map((qr) => (
              <TabsTrigger key={qr.id} value={qr.id} className="text-xs sm:text-sm px-1 sm:px-3">
                <qr.icon className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{qr.title.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {qrCodes.map((qr) => (
            <TabsContent key={qr.id} value={qr.id} className="mt-4">
              <Card>
                <CardHeader className="text-center pb-2 px-3 sm:px-6">
                  <CardTitle className="text-base sm:text-lg">{qr.title}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{qr.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-3 sm:px-6">
                  {/* QR Code Image */}
                  <div className="flex justify-center">
                    <div className="p-3 sm:p-4 bg-white rounded-xl shadow-inner">
                      <img
                        src={generateQRImageUrl(qr.url)}
                        alt={`QR Code ${qr.title}`}
                        className="w-40 h-40 sm:w-48 sm:h-48"
                      />
                    </div>
                  </div>

                  {/* URL */}
                  <div className="flex items-center gap-2 p-2 sm:p-3 bg-muted rounded-lg min-w-0">
                    <code className="flex-1 text-xs sm:text-sm truncate min-w-0">
                      {qr.url}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 h-8 w-8"
                      onClick={() => copyToClipboard(qr.url, qr.title)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      onClick={() => copyToClipboard(qr.url, qr.title)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Link
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      onClick={() => downloadQR(qr.url, qr.id)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar QR
                    </Button>
                    <Button
                      className="flex-1"
                      size="sm"
                      asChild
                    >
                      <a href={qr.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
