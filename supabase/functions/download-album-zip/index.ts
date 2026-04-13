/**
 * PICKEVENT - Edge Function para Descarga de Álbum en ZIP
 * Genera un archivo ZIP con todas las fotos, videos y mensajes del evento
 * Usa compresión STORE (sin comprimir) para evitar CPU Time exceeded en Deno Edge Functions
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BATCH_SIZE = 5;
const BUCKET_NAME = 'contenido-eventos';

interface DownloadRequest {
  token: string;
  include_ia?: boolean;
}

/**
 * Extrae el path de storage desde una URL pública de Supabase Storage.
 */
function extractStoragePath(url: string, supabaseUrl: string): string | null {
  const publicPrefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/`;
  const signedPrefix = `${supabaseUrl}/storage/v1/object/sign/${BUCKET_NAME}/`;

  if (url.startsWith(publicPrefix)) {
    return decodeURIComponent(url.slice(publicPrefix.length).split('?')[0]);
  }
  if (url.startsWith(signedPrefix)) {
    return decodeURIComponent(url.slice(signedPrefix.length).split('?')[0]);
  }
  return null;
}

/**
 * Descarga un archivo usando signed URL o fetch directo.
 * Archivos originales sin transformación ni compresión.
 */
async function downloadFile(
  url: string,
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
): Promise<ArrayBuffer | null> {
  try {
    const storagePath = extractStoragePath(url, supabaseUrl);

    if (storagePath) {
      const { data: signedData, error: signError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath, 600);

      if (signError || !signedData?.signedUrl) {
        console.warn(`Signed URL failed for ${storagePath}:`, signError?.message);
        const res = await fetch(url);
        return res.ok ? await res.arrayBuffer() : null;
      }

      const res = await fetch(signedData.signedUrl);
      return res.ok ? await res.arrayBuffer() : null;
    }

    // URL externa
    const res = await fetch(url);
    return res.ok ? await res.arrayBuffer() : null;
  } catch (err) {
    console.warn(`Error downloading ${url}:`, err);
    return null;
  }
}

serve(async (req) => {
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

    // Buscar evento
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

    // Verificar expiración
    if (evento.album_disponible_hasta) {
      const expirationDate = new Date(evento.album_disponible_hasta);
      if (new Date() > expirationDate) {
        return new Response(
          JSON.stringify({ error: 'El álbum ya no está disponible para descarga' }),
          { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Obtener contenido aprobado (fotos, videos Y mensajes)
    const { data: contenidos, error: contenidoError } = await supabase
      .from('contenido')
      .select('id, tipo, url_original, url_ia, mensaje_texto, invitado_nombre, created_at')
      .eq('evento_id', evento.id)
      .eq('aprobado', true)
      .in('tipo', ['foto', 'video', 'mensaje'])
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

    // Separar por tipo
    const allPhotos = contenidos.filter(c => c.tipo === 'foto');
    const allVideos = contenidos.filter(c => c.tipo === 'video');
    const allMessages = contenidos.filter(c => c.tipo === 'mensaje');
    const mediaItems = [...allPhotos, ...allVideos];

    console.log(`Creating ZIP: ${allPhotos.length} photos, ${allVideos.length} videos, ${allMessages.length} messages. Batch size: ${BATCH_SIZE}. Total media: ${mediaItems.length}`);

    // Crear ZIP
    const zip = new JSZip();
    const fotosFolder = zip.folder('fotos');
    const videosFolder = zip.folder('videos');
    const iaFolder = evento.es_premium && body.include_ia ? zip.folder('fotos_ia') : null;

    interface DownloadTask {
      url: string;
      folder: JSZip | null;
      fileName: string;
    }

    const tasks: DownloadTask[] = [];
    let fileIndex = 1;

    for (const item of mediaItems) {
      const nombre = (item.invitado_nombre || 'Invitado').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-]/g, '');
      const fecha = new Date(item.created_at).toISOString().split('T')[0];
      const idx = String(fileIndex).padStart(3, '0');
      const isPhoto = item.tipo === 'foto';

      if (item.url_original) {
        const extension = isPhoto ? 'jpg' : 'mp4';
        const folder = isPhoto ? fotosFolder : videosFolder;
        tasks.push({
          url: item.url_original,
          folder,
          fileName: `${idx}_${nombre}_${fecha}.${extension}`,
        });
      }

      if (iaFolder && item.url_ia && isPhoto) {
        tasks.push({
          url: item.url_ia,
          folder: iaFolder,
          fileName: `${idx}_${nombre}_${fecha}_IA.png`,
        });
      }

      fileIndex++;
    }

    // Agregar mensajes como archivo de texto
    if (allMessages.length > 0) {
      const mensajesFolder = zip.folder('mensajes');
      const mensajesContent = allMessages.map((m, i) => {
        const nombre = m.invitado_nombre || 'Invitado';
        const fecha = new Date(m.created_at).toLocaleString('es-AR');
        return `[${i + 1}] ${nombre} — ${fecha}\n${m.mensaje_texto || '(sin texto)'}\n`;
      }).join('\n---\n\n');

      mensajesFolder?.file('mensajes_del_evento.txt', mensajesContent);
    }

    // Descargar archivos multimedia en lotes
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      const batch = tasks.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (task) => {
          const data = await downloadFile(task.url, supabase, supabaseUrl);
          if (data && task.folder) {
            task.folder.file(task.fileName, data);
            return true;
          }
          return false;
        })
      );

      for (const ok of results) {
        if (ok) successCount++;
        else failCount++;
      }

      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: downloaded ${i + batch.length}/${tasks.length}`);
    }

    console.log(`Downloads complete: ${successCount} ok, ${failCount} failed`);

    if (successCount === 0 && allMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No se pudo descargar ningún archivo' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // README
    const readmeContent = `
ÁLBUM DE EVENTO: ${evento.nombre}
================================

Este álbum contiene ${successCount} archivos multimedia${allMessages.length > 0 ? ` y ${allMessages.length} mensajes` : ''} del evento.
${failCount > 0 ? `(${failCount} archivos no pudieron ser incluidos)` : ''}

Estructura de carpetas:
- /fotos - Fotos del evento (calidad original)
- /videos - Videos subidos por los invitados
${allMessages.length > 0 ? '- /mensajes - Mensajes de los invitados' : ''}
${iaFolder ? '- /fotos_ia - Fotos transformadas con Inteligencia Artificial' : ''}

Generado por PickEvent
https://pickevent.app
    `.trim();

    zip.file('README.txt', readmeContent);

    // Generar ZIP SIN compresión (STORE) para evitar CPU Time exceeded
    console.log('Generating ZIP file (STORE mode, no compression)...');
    const zipBlob = await zip.generateAsync({
      type: 'arraybuffer',
      compression: 'STORE',
    });

    const safeEventName = evento.nombre
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    const zipFileName = `PickEvent_${safeEventName}_Album.zip`;
    console.log(`ZIP generated: ${zipFileName}, size: ${zipBlob.byteLength} bytes`);

    return new Response(zipBlob, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
        'Content-Length': String(zipBlob.byteLength),
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
