/**
 * Panel de descarga del álbum con opción de ZIP
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, 
  Image, 
  Video, 
  FileArchive, 
  Clock,
  Sparkles,
  Loader2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { EventDetails, EventContent } from '@/hooks/useEventDetails';

interface AlbumDownloadProps {
  event: EventDetails;
  content: EventContent[];
}

export function AlbumDownload({ event, content }: AlbumDownloadProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [progress, setProgress] = useState(0);
  const [includeIA, setIncludeIA] = useState(true);

  const photos = content.filter(c => c.tipo === 'foto' && c.aprobado);
  const videos = content.filter(c => c.tipo === 'video' && c.aprobado);
  const photosWithIA = photos.filter(p => p.url_ia);

  const albumExpiry = event.album_disponible_hasta 
    ? new Date(event.album_disponible_hasta)
    : null;
  const isExpired = albumExpiry && albumExpiry < new Date();

  // Descarga ZIP usando la edge function
  const handleDownloadZip = async () => {
    if (photos.length === 0 && videos.length === 0) {
      toast.error('No hay contenido para descargar');
      return;
    }

    setDownloadingZip(true);

    try {
      const response = await supabase.functions.invoke('download-album-zip', {
        body: {
          token: event.qr_descarga_token,
          include_ia: includeIA && event.es_premium,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error al generar el ZIP');
      }

      // La respuesta es un blob del ZIP
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PickEvent_${event.nombre.replace(/[^a-zA-Z0-9]/g, '_')}_Album.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('¡Álbum descargado correctamente!');
    } catch (error: unknown) {
      console.error('Error downloading ZIP:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setDownloadingZip(false);
    }
  };

  // Descarga individual (método anterior)
  const handleDownloadAll = async () => {
    if (photos.length === 0 && videos.length === 0) {
      toast.error('No hay fotos o videos para descargar');
      return;
    }

    setDownloading(true);
    setProgress(0);

    try {
      const totalItems = photos.length + videos.length;
      let downloaded = 0;

      for (const item of [...photos, ...videos]) {
        if (item.url_original) {
          const response = await fetch(item.url_original);
          const blob = await response.blob();
          
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
          
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      toast.success(`Se descargaron ${downloaded} archivos`);
    } catch (error) {
      toast.error('Hubo un problema al descargar los archivos');
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
            Descargá todo el contenido de tu evento en un archivo ZIP
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Resumen de contenido */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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
            {event.es_premium && (
              <Card className="bg-muted/50">
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold">{photosWithIA.length}</p>
                    <p className="text-sm text-muted-foreground">Fotos IA</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Opción de incluir IA */}
          {event.es_premium && photosWithIA.length > 0 && (
            <div className="flex items-center space-x-2 mb-4 p-3 rounded-lg bg-muted/50">
              <Checkbox 
                id="include-ia" 
                checked={includeIA}
                onCheckedChange={(checked) => setIncludeIA(checked === true)}
              />
              <label 
                htmlFor="include-ia" 
                className="text-sm font-medium cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-warning" />
                Incluir fotos transformadas por IA ({photosWithIA.length})
              </label>
            </div>
          )}

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

          {/* Botones de descarga */}
          <div className="space-y-3">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleDownloadZip}
              disabled={downloadingZip || downloading || isExpired || (photos.length === 0 && videos.length === 0)}
            >
              {downloadingZip ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando ZIP...
                </>
              ) : (
                <>
                  <FileArchive className="w-4 h-4 mr-2" />
                  Descargar Álbum Completo (ZIP)
                </>
              )}
            </Button>

            <Button 
              variant="outline"
              className="w-full" 
              onClick={handleDownloadAll}
              disabled={downloading || downloadingZip || isExpired || (photos.length === 0 && videos.length === 0)}
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading ? 'Descargando...' : 'Descargar Archivos Individuales'}
            </Button>
          </div>

          {isExpired && (
            <p className="text-sm text-destructive text-center mt-4">
              El período de descarga ha expirado
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
