/**
 * Panel de descarga del álbum
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Image, 
  Video, 
  FileArchive, 
  Clock,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { EventDetails, EventContent } from '@/hooks/useEventDetails';

interface AlbumDownloadProps {
  event: EventDetails;
  content: EventContent[];
}

export function AlbumDownload({ event, content }: AlbumDownloadProps) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const photos = content.filter(c => c.tipo === 'foto' && c.aprobado);
  const videos = content.filter(c => c.tipo === 'video' && c.aprobado);

  const albumExpiry = event.album_disponible_hasta 
    ? new Date(event.album_disponible_hasta)
    : null;
  const isExpired = albumExpiry && albumExpiry < new Date();

  const handleDownloadAll = async () => {
    if (photos.length === 0 && videos.length === 0) {
      toast({
        title: 'Sin contenido',
        description: 'No hay fotos o videos para descargar',
        variant: 'destructive',
      });
      return;
    }

    setDownloading(true);
    setProgress(0);

    try {
      // Simular progreso de descarga
      const totalItems = photos.length + videos.length;
      let downloaded = 0;

      for (const item of [...photos, ...videos]) {
        if (item.url_original) {
          // Descargar cada archivo
          const response = await fetch(item.url_original);
          const blob = await response.blob();
          
          // Crear link de descarga
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${event.nombre}-${item.tipo}-${downloaded + 1}.${item.tipo === 'foto' ? 'jpg' : 'mp4'}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          downloaded++;
          setProgress(Math.round((downloaded / totalItems) * 100));
          
          // Pequeña pausa entre descargas
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      toast({
        title: '¡Descarga completa!',
        description: `Se descargaron ${downloaded} archivos`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un problema al descargar los archivos',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Estado del álbum */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileArchive className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Álbum del Evento</CardTitle>
            </div>
            {albumExpiry && !isExpired && (
              <Badge variant="outline" className="gap-1">
                <Clock className="w-3 h-3" />
                Disponible hasta {formatDate(albumExpiry.toISOString())}
              </Badge>
            )}
            {isExpired && (
              <Badge variant="destructive">Expirado</Badge>
            )}
          </div>
          <CardDescription>
            Descargá todo el contenido de tu evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Resumen de contenido */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="bg-muted/50">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Image className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{photos.length}</p>
                  <p className="text-sm text-muted-foreground">Fotos</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Video className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{videos.length}</p>
                  <p className="text-sm text-muted-foreground">Videos</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progreso de descarga */}
          {downloading && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span>Descargando...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Botón de descarga */}
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleDownloadAll}
            disabled={downloading || isExpired || (photos.length === 0 && videos.length === 0)}
          >
            <Download className="w-4 h-4 mr-2" />
            {downloading ? 'Descargando...' : 'Descargar Todo'}
          </Button>

          {isExpired && (
            <p className="text-sm text-destructive text-center mt-2">
              El período de descarga ha expirado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Opciones adicionales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Opciones de Descarga</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            disabled={photos.length === 0 || downloading}
            onClick={() => {
              // Solo fotos
              toast({
                title: 'Próximamente',
                description: 'Esta función estará disponible pronto',
              });
            }}
          >
            <Image className="w-4 h-4 mr-2" />
            Solo Fotos ({photos.length})
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            disabled={videos.length === 0 || downloading}
            onClick={() => {
              toast({
                title: 'Próximamente',
                description: 'Esta función estará disponible pronto',
              });
            }}
          >
            <Video className="w-4 h-4 mr-2" />
            Solo Videos ({videos.length})
          </Button>
          {event.es_premium && (
            <Button 
              variant="outline" 
              className="w-full justify-start"
              disabled={downloading}
              onClick={() => {
                toast({
                  title: 'Próximamente',
                  description: 'Esta función estará disponible pronto',
                });
              }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Solo con Transformación IA
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
