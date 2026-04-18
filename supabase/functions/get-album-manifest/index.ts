/**
 * PICKEVENT - Manifest del Álbum
 * Devuelve la lista de URLs (fotos, videos, mensajes) de un evento usando el qr_descarga_token.
 * El navegador se encarga de descargar los archivos y armar el ZIP, evitando límites de memoria/CPU del servidor.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BUCKET_NAME = 'contenido-eventos';
const SIGNED_URL_TTL = 3600; // 1 hora

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, include_ia } = await req.json();

    if (!token || typeof token !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Token requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: evento, error: eventoError } = await supabase
      .from('eventos')
      .select('id, nombre, album_disponible_hasta, es_premium')
      .eq('qr_descarga_token', token)
      .single();

    if (eventoError || !evento) {
      return new Response(
        JSON.stringify({ error: 'Evento no encontrado o token inválido' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (evento.album_disponible_hasta) {
      const expirationDate = new Date(evento.album_disponible_hasta);
      if (new Date() > expirationDate) {
        return new Response(
          JSON.stringify({ error: 'El álbum ya no está disponible para descarga' }),
          { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { data: contenidos, error: contenidoError } = await supabase
      .from('contenido')
      .select('id, tipo, url_original, url_ia, mensaje_texto, invitado_nombre, created_at')
      .eq('evento_id', evento.id)
      .eq('aprobado', true)
      .in('tipo', ['foto', 'video', 'mensaje'])
      .order('created_at', { ascending: true });

    if (contenidoError) {
      return new Response(
        JSON.stringify({ error: 'Error al obtener contenido' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const items: Array<{
      id: string;
      tipo: string;
      url_original?: string;
      url_ia?: string;
      mensaje_texto?: string;
      invitado_nombre: string;
      created_at: string;
    }> = [];

    const includeIA = !!include_ia && evento.es_premium;

    for (const c of (contenidos ?? [])) {
      const item: typeof items[number] = {
        id: c.id,
        tipo: c.tipo,
        invitado_nombre: c.invitado_nombre || 'Invitado',
        created_at: c.created_at,
      };

      if (c.tipo === 'mensaje') {
        item.mensaje_texto = c.mensaje_texto || '';
      } else if (c.url_original) {
        const path = extractStoragePath(c.url_original, supabaseUrl);
        if (path) {
          const { data: signed } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(path, SIGNED_URL_TTL);
          item.url_original = signed?.signedUrl || c.url_original;
        } else {
          item.url_original = c.url_original;
        }

        if (includeIA && c.tipo === 'foto' && c.url_ia) {
          const iaPath = extractStoragePath(c.url_ia, supabaseUrl);
          if (iaPath) {
            const { data: signedIA } = await supabase.storage
              .from(BUCKET_NAME)
              .createSignedUrl(iaPath, SIGNED_URL_TTL);
            item.url_ia = signedIA?.signedUrl || c.url_ia;
          } else {
            item.url_ia = c.url_ia;
          }
        }
      }

      items.push(item);
    }

    return new Response(
      JSON.stringify({
        evento: {
          id: evento.id,
          nombre: evento.nombre,
          es_premium: evento.es_premium,
        },
        items,
        include_ia: includeIA,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Manifest error:', err);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
