/**
 * PICKEVENT - Edge Function para Descarga de Álbum en ZIP
 * Genera un archivo ZIP con todas las fotos y videos del evento
 * Optimizado para no exceder límites de memoria (~150MB) en Deno Edge Functions
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BATCH_SIZE = 3;
const BUCKET_NAME = 'contenido-eventos';
const MAX_FILES = 100;
const MAX_VIDEOS = 5;

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
 * Descarga un archivo. Para fotos de Supabase Storage usa transform (1920px, quality 80)
 * para reducir memoria. Videos y URLs externas se descargan tal cual.
 */
async function downloadFile(
  url: string,
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  isPhoto: boolean,
): Promise<ArrayBuffer | null> {
  try {
    const storagePath = extractStoragePath(url, supabaseUrl);

    if (storagePath) {
      // Para fotos: usar render/image transform para reducir tamaño en memoria
      if (isPhoto) {
        const transformUrl = `${supabaseUrl}/storage/v1/render/image/public/${BUCKET_NAME}/${storagePath}?width=1920&quality=80`;
        const res = await fetch(transformUrl);
        if (res.ok) return await res.arrayBuffer();
        // Si transform falla, fallback a signed URL
        console.warn(`Transform failed for ${storagePath}, falling back to signed URL`);
      }

      // Signed URL para videos o fallback de fotos
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

    // Obtener contenido aprobado
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

    // Separar fotos y videos para aplicar límites
    const allPhotos = contenidos.filter(c => c.tipo === 'foto');
    const allVideos = contenidos.filter(c => c.tipo === 'video');
    const videosExcluded = allVideos.length > MAX_VIDEOS;
    const videosToInclude = videosExcluded ? [] : allVideos;

    // Limitar total de archivos
    const itemsToProcess = [...allPhotos, ...videosToInclude].slice(0, MAX_FILES);

    console.log(`Creating ZIP: ${allPhotos.length} photos, ${allVideos.length} videos (including ${videosToInclude.length} videos). Batch size: ${BATCH_SIZE}. Total items: ${itemsToProcess.length}`);

    // Crear ZIP
    const zip = new JSZip();
    const fotosFolder = zip.folder('fotos');
    const videosFolder = zip.folder('videos');
    const iaFolder = evento.es_premium && body.include_ia ? zip.folder('fotos_ia') : null;

    interface DownloadTask {
      url: string;
      folder: JSZip | null;
      fileName: string;
      isPhoto: boolean;
    }

    const tasks: DownloadTask[] = [];
    let fileIndex = 1;

    for (const item of itemsToProcess) {
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
          isPhoto,
        });
      }

      if (iaFolder && item.url_ia && isPhoto) {
        tasks.push({
          url: item.url_ia,
          folder: iaFolder,
          fileName: `${idx}_${nombre}_${fecha}_IA.png`,
          isPhoto: true,
        });
      }

      fileIndex++;
    }

    // Descargar en lotes pequeños
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      const batch = tasks.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (task) => {
          const data = await downloadFile(task.url, supabase, supabaseUrl, task.isPhoto);
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

    if (successCount === 0) {
      return new Response(
        JSON.stringify({ error: 'No se pudo descargar ningún archivo' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // README
    const warnings: string[] = [];
    if (videosExcluded) {
      warnings.push(`⚠ Los ${allVideos.length} videos fueron excluidos del ZIP por límite de tamaño. Podés descargarlos individualmente desde la app.`);
    }
    if (itemsToProcess.length < contenidos.length) {
      warnings.push(`⚠ Se incluyeron ${itemsToProcess.length} de ${contenidos.length} archivos totales por límite de tamaño.`);
    }

    const readmeContent = `
ÁLBUM DE EVENTO: ${evento.nombre}
================================

Este álbum contiene ${successCount} archivos del evento.
${failCount > 0 ? `(${failCount} archivos no pudieron ser incluidos)` : ''}
${warnings.length > 0 ? '\n' + warnings.join('\n') : ''}

Estructura de carpetas:
- /fotos - Fotos del evento (optimizadas a 1920px)
- /videos - Videos subidos por los invitados
${iaFolder ? '- /fotos_ia - Fotos transformadas con Inteligencia Artificial' : ''}

Generado por PickEvent
https://pickevent.app
    `.trim();

    zip.file('README.txt', readmeContent);

    // Generar ZIP con compresión mínima
    console.log('Generating ZIP file...');
    const zipBlob = await zip.generateAsync({
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 1 },
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
