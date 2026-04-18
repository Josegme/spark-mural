/**
 * Panel de descarga del álbum con opción de ZIP
 */

import { useState, forwardRef } from 'react';
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
import type { EventDetails, EventContent } from '@/hooks/useEventDetails';

interface AlbumDownloadProps {
  event: EventDetails;
  content: EventContent[];
}

export const AlbumDownload = forwardRef<HTMLDivElement, AlbumDownloadProps>(
  function AlbumDownload({ event, content }, ref) {
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

  // Descarga ZIP generando todo en el navegador (sin límites de memoria del servidor)
  const handleDownloadZip = async () => {
    if (photos.length === 0 && videos.length === 0) {
      toast.error('No hay contenido para descargar');
      return;
    }

    setDownloadingZip(true);
    setProgress(0);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // 1. Pedir manifest al backend (URLs firmadas + mensajes)
      const manifestRes = await fetch(`${supabaseUrl}/functions/v1/get-album-manifest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          token: event.qr_descarga_token,
          include_ia: includeIA && event.es_premium,
        }),
      });

      if (!manifestRes.ok) {
        const err = await manifestRes.json().catch(() => ({}));
        throw new Error(err.error || `Error ${manifestRes.status}`);
      }

      const { items, include_ia: serverIncludeIA } = await manifestRes.json() as {
        items: Array<{
          id: string;
          tipo: 'foto' | 'video' | 'mensaje';
          url_original?: string;
          url_ia?: string;
          mensaje_texto?: string;
          invitado_nombre: string;
          created_at: string;
        }>;
        include_ia: boolean;
      };

      // 2. Cargar JSZip y file-saver dinámicamente
      const [{ default: JSZip }, { saveAs }] = await Promise.all([
        import('jszip'),
        import('file-saver'),
      ]);

      const zip = new JSZip();
      const fotosFolder = zip.folder('fotos');
      const videosFolder = zip.folder('videos');
      const iaFolder = serverIncludeIA ? zip.folder('fotos_ia') : null;
      const mensajesItems = items.filter(i => i.tipo === 'mensaje');
      const mediaItems = items.filter(i => i.tipo === 'foto' || i.tipo === 'video');

      // 3. Descargar archivos en paralelo (lotes de 4) con progreso
      const BATCH_SIZE = 4;
      let downloaded = 0;
      let successCount = 0;
      let failCount = 0;
      const totalDownloads = mediaItems.reduce((acc, it) => {
        let n = it.url_original ? 1 : 0;
        if (serverIncludeIA && it.tipo === 'foto' && it.url_ia) n += 1;
        return acc + n;
      }, 0);

      type ZipFolder = ReturnType<InstanceType<typeof JSZip>['folder']>;
      const downloadOne = async (url: string, folder: ZipFolder, fileName: string) => {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          folder?.file(fileName, blob);
          successCount++;
        } catch (e) {
          console.warn(`Failed to download ${fileName}:`, e);
          failCount++;
        } finally {
          downloaded++;
          setProgress(Math.round((downloaded / Math.max(totalDownloads, 1)) * 100));
        }
      };

      let fileIndex = 1;
      const tasks: Array<() => Promise<void>> = [];
      for (const item of mediaItems) {
        const nombre = (item.invitado_nombre || 'Invitado').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-]/g, '');
        const fecha = new Date(item.created_at).toISOString().split('T')[0];
        const idx = String(fileIndex).padStart(3, '0');
        const isPhoto = item.tipo === 'foto';

        if (item.url_original) {
          const ext = isPhoto ? 'jpg' : 'mp4';
          const folder = isPhoto ? fotosFolder : videosFolder;
          const fileName = `${idx}_${nombre}_${fecha}.${ext}`;
          tasks.push(() => downloadOne(item.url_original!, folder, fileName));
        }
        if (iaFolder && isPhoto && item.url_ia) {
          const fileName = `${idx}_${nombre}_${fecha}_IA.png`;
          tasks.push(() => downloadOne(item.url_ia!, iaFolder, fileName));
        }
        fileIndex++;
      }

      for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
        await Promise.all(tasks.slice(i, i + BATCH_SIZE).map(fn => fn()));
      }

      // 4. Mensajes
      if (mensajesItems.length > 0) {
        const mensajesFolder = zip.folder('mensajes');
        const txt = mensajesItems.map((m, i) => {
          const fecha = new Date(m.created_at).toLocaleString('es-AR');
          return `[${i + 1}] ${m.invitado_nombre} — ${fecha}\n${m.mensaje_texto || '(sin texto)'}\n`;
        }).join('\n---\n\n');
        mensajesFolder?.file('mensajes_del_evento.txt', txt);
      }

      // 5. README
      const readme = `ÁLBUM DE EVENTO: ${event.nombre}\n================================\n\n` +
        `Archivos incluidos: ${successCount}${mensajesItems.length > 0 ? ` y ${mensajesItems.length} mensajes` : ''}.\n` +
        `${failCount > 0 ? `(${failCount} archivos no pudieron incluirse)\n` : ''}\n` +
        `Estructura:\n- /fotos\n- /videos\n${mensajesItems.length > 0 ? '- /mensajes\n' : ''}${iaFolder ? '- /fotos_ia\n' : ''}\n` +
        `Generado por PickEvent\nhttps://pickevent.app`;
      zip.file('README.txt', readme);

      // 6. Generar ZIP en el navegador (STORE = sin compresión, rápido)
      const zipBlob = await zip.generateAsync(
        { type: 'blob', compression: 'STORE' },
        (meta) => setProgress(Math.round(meta.percent))
      );

      const safeName = event.nombre.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
      saveAs(zipBlob, `PickEvent_${safeName}_Album.zip`);

      if (failCount > 0) {
        toast.warning(`Álbum descargado. ${failCount} archivo(s) no pudieron incluirse.`);
      } else {
        toast.success('¡Álbum descargado correctamente!');
      }
    } catch (error: unknown) {
      console.error('Error generating ZIP:', error);
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error: ${msg}`);
    } finally {
      setDownloadingZip(false);
      setProgress(0);
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
});
