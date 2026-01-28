/**
 * PICKEVENT - Edge Function para Descarga de Álbum en ZIP
 * Genera un archivo ZIP con todas las fotos y videos del evento
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface DownloadRequest {
  token: string; // qr_descarga_token del evento
  include_ia?: boolean; // Incluir fotos transformadas por IA
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: DownloadRequest = await req.json();

    console.log('Download album request:', { token: body.token?.substring(0, 8) + '...' });

    if (!body.token) {
      return new Response(
        JSON.stringify({ error: 'Token de descarga requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar el evento por token de descarga
    const { data: evento, error: eventoError } = await supabase
      .from('eventos')
      .select('id, nombre, album_disponible_hasta, es_premium')
      .eq('qr_descarga_token', body.token)
      .single();

    if (eventoError || !evento) {
      console.error('Event not found:', eventoError);
      return new Response(
        JSON.stringify({ error: 'Evento no encontrado o token inválido' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar si el álbum todavía está disponible
    if (evento.album_disponible_hasta) {
      const expirationDate = new Date(evento.album_disponible_hasta);
      if (new Date() > expirationDate) {
        return new Response(
          JSON.stringify({ error: 'El álbum ya no está disponible para descarga' }),
          { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Obtener todo el contenido aprobado del evento
    const { data: contenidos, error: contenidoError } = await supabase
      .from('contenido')
      .select('id, tipo, url_original, url_ia, invitado_nombre, created_at')
      .eq('evento_id', evento.id)
      .eq('aprobado', true)
      .in('tipo', ['foto', 'video'])
      .order('created_at', { ascending: true });

    if (contenidoError) {
      console.error('Error fetching content:', contenidoError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener el contenido' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!contenidos || contenidos.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No hay contenido disponible para descargar' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating ZIP with ${contenidos.length} items`);

    // Crear el archivo ZIP
    const zip = new JSZip();
    const fotosFolder = zip.folder('fotos');
    const videosFolder = zip.folder('videos');
    const iaFolder = evento.es_premium && body.include_ia ? zip.folder('fotos_ia') : null;

    let fileIndex = 1;
    const downloadPromises: Promise<void>[] = [];

    for (const item of contenidos) {
      const nombre = item.invitado_nombre || 'Invitado';
      const fecha = new Date(item.created_at).toISOString().split('T')[0];
      
      // Descargar archivo original
      if (item.url_original) {
        const promise = (async () => {
          try {
            const response = await fetch(item.url_original);
            if (!response.ok) {
              console.warn(`Failed to fetch ${item.url_original}`);
              return;
            }
            const arrayBuffer = await response.arrayBuffer();
            const extension = item.tipo === 'video' ? 'mp4' : 'jpg';
            const fileName = `${String(fileIndex).padStart(3, '0')}_${nombre}_${fecha}.${extension}`;
            
            if (item.tipo === 'video' && videosFolder) {
              videosFolder.file(fileName, arrayBuffer);
            } else if (item.tipo === 'foto' && fotosFolder) {
              fotosFolder.file(fileName, arrayBuffer);
            }
          } catch (err) {
            console.warn(`Error downloading ${item.url_original}:`, err);
          }
        })();
        downloadPromises.push(promise);
      }

      // Descargar foto IA si existe y está habilitado
      if (iaFolder && item.url_ia && item.tipo === 'foto') {
        const promise = (async () => {
          try {
            const response = await fetch(item.url_ia);
            if (!response.ok) {
              console.warn(`Failed to fetch IA image ${item.url_ia}`);
              return;
            }
            const arrayBuffer = await response.arrayBuffer();
            const fileName = `${String(fileIndex).padStart(3, '0')}_${nombre}_${fecha}_IA.png`;
            iaFolder.file(fileName, arrayBuffer);
          } catch (err) {
            console.warn(`Error downloading IA image:`, err);
          }
        })();
        downloadPromises.push(promise);
      }

      fileIndex++;
    }

    // Esperar todas las descargas
    await Promise.all(downloadPromises);

    // Agregar archivo README
    const readmeContent = `
ÁLBUM DE EVENTO: ${evento.nombre}
================================

Este álbum contiene ${contenidos.length} archivos del evento.

Estructura de carpetas:
- /fotos - Fotos originales subidas por los invitados
- /videos - Videos subidos por los invitados
${evento.es_premium && body.include_ia ? '- /fotos_ia - Fotos transformadas con Inteligencia Artificial' : ''}

Generado por PickEvent
https://pickevent.app
    `.trim();
    
    zip.file('README.txt', readmeContent);

    // Generar el ZIP
    console.log('Generating ZIP file...');
    const zipBlob = await zip.generateAsync({ 
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Sanitizar nombre del evento para el archivo
    const safeEventName = evento.nombre
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    const zipFileName = `PickEvent_${safeEventName}_Album.zip`;

    console.log(`ZIP generated successfully: ${zipFileName}, size: ${zipBlob.byteLength} bytes`);

    return new Response(zipBlob, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
        'Content-Length': String(zipBlob.byteLength),
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
