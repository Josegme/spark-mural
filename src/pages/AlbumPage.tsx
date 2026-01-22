/**
 * PICKEVENT - Página de Álbum Público
 * Permite a los invitados descargar fotos del evento
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Calendar, Image, AlertCircle, Video, MessageSquare, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Contenido {
  id: string;
  tipo: 'foto' | 'video' | 'mensaje';
  url_original: string | null;
  mensaje_texto: string | null;
  invitado_nombre: string | null;
  created_at: string;
}

interface Evento {
  id: string;
  nombre: string;
  fecha_evento: string;
  album_disponible_hasta: string | null;
}

export default function AlbumPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [evento, setEvento] = useState<Evento | null>(null);
  const [contenido, setContenido] = useState<Contenido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const loadAlbum = async () => {
      if (!token) {
        setError("Token de álbum inválido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Buscar evento por token de descarga
        const { data: eventoData, error: eventoError } = await supabase
          .from('eventos')
          .select('id, nombre, fecha_evento, album_disponible_hasta')
          .eq('qr_descarga_token', token)
          .single();

        if (eventoError || !eventoData) {
          setError("Álbum no encontrado o token inválido");
          setLoading(false);
          return;
        }

        // Verificar si el álbum ya expiró
        if (eventoData.album_disponible_hasta) {
          const fechaExpiracion = new Date(eventoData.album_disponible_hasta);
          const ahora = new Date();

          if (ahora > fechaExpiracion) {
            setError(`Este álbum expiró el ${fechaExpiracion.toLocaleDateString('es-ES')}`);
            setLoading(false);
            return;
          }
        }

        setEvento(eventoData);

        // Cargar contenido aprobado
        const { data: contenidoData, error: contenidoError } = await supabase
          .from('contenido')
          .select('id, tipo, url_original, mensaje_texto, invitado_nombre, created_at')
          .eq('evento_id', eventoData.id)
          .eq('aprobado', true)
          .order('created_at', { ascending: false });

        if (contenidoError) {
          console.error("Error cargando contenido:", contenidoError);
        }

        setContenido(contenidoData || []);
        setLoading(false);

      } catch (err) {
        console.error("Error cargando álbum:", err);
        setError("Error al cargar el álbum. Intenta nuevamente.");
        setLoading(false);
      }
    };

    loadAlbum();
  }, [token]);

  const handleDownload = async (url: string, filename: string, itemId: string) => {
    try {
      setDownloading(itemId);
      
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
      
      toast({
        title: "Descarga iniciada",
        description: `Descargando ${filename}`,
      });
    } catch (err) {
      console.error("Error descargando archivo:", err);
      toast({
        title: "Error",
        description: "No se pudo descargar el archivo",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error || !evento) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Álbum no disponible</h2>
            <p className="text-muted-foreground mb-6">
              {error || "Álbum no encontrado"}
            </p>
            <Button 
              onClick={() => navigate('/')} 
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fotos = contenido.filter(c => c.tipo === 'foto' && c.url_original);
  const videos = contenido.filter(c => c.tipo === 'video' && c.url_original);
  const mensajes = contenido.filter(c => c.tipo === 'mensaje' && c.mensaje_texto);
  const fechaEvento = new Date(evento.fecha_evento).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const fechaExpiracion = evento.album_disponible_hasta 
    ? new Date(evento.album_disponible_hasta).toLocaleDateString('es-ES')
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-6xl mx-auto px-4">
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl md:text-3xl">{evento.nombre}</CardTitle>
                <CardDescription className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {fechaEvento}
                  </span>
                  <span className="flex items-center gap-1">
                    <Image className="w-4 h-4" />
                    {fotos.length} fotos
                  </span>
                  {videos.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      {videos.length} videos
                    </span>
                  )}
                </CardDescription>
              </div>
              {fechaExpiracion && (
                <div className="text-sm text-muted-foreground">
                  Disponible hasta: {fechaExpiracion}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {contenido.length === 0 ? (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Aún no hay contenido aprobado en este álbum. Los contenidos aparecerán aquí una vez que sean aprobados por el organizador.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-8">
                {/* Fotos */}
                {fotos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Image className="w-5 h-5" />
                      Fotos ({fotos.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {fotos.map((item) => (
                        <div key={item.id} className="group relative rounded-lg overflow-hidden bg-muted aspect-square">
                          <img
                            src={item.url_original!}
                            alt={`Foto de ${item.invitado_nombre || 'invitado'}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleDownload(
                                item.url_original!,
                                `${evento.nombre.replace(/\s+/g, '_')}_${item.id.slice(0, 8)}.jpg`,
                                item.id
                              )}
                              disabled={downloading === item.id}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              {downloading === item.id ? 'Descargando...' : 'Descargar'}
                            </Button>
                          </div>
                          {item.invitado_nombre && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <span className="text-xs text-white">{item.invitado_nombre}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos */}
                {videos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Video className="w-5 h-5" />
                      Videos ({videos.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {videos.map((item) => (
                        <div key={item.id} className="relative rounded-lg overflow-hidden bg-muted">
                          <video
                            src={item.url_original!}
                            controls
                            className="w-full aspect-video object-cover"
                            preload="metadata"
                          />
                          <div className="absolute top-2 right-2">
                            <Button
                              size="icon"
                              variant="secondary"
                              onClick={() => handleDownload(
                                item.url_original!,
                                `${evento.nombre.replace(/\s+/g, '_')}_${item.id.slice(0, 8)}.mp4`,
                                item.id
                              )}
                              disabled={downloading === item.id}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mensajes */}
                {mensajes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Mensajes ({mensajes.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mensajes.map((item) => (
                        <Card key={item.id} className="bg-muted/50">
                          <CardContent className="pt-4">
                            <p className="text-lg italic">"{item.mensaje_texto}"</p>
                            {item.invitado_nombre && (
                              <p className="text-sm text-muted-foreground mt-2">
                                — {item.invitado_nombre}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Alert className="mt-8">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>Nota:</strong> La descarga masiva en ZIP estará disponible próximamente. 
                Por ahora puedes descargar cada archivo individualmente.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
