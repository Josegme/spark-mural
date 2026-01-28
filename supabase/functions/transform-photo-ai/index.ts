/**
 * PICKEVENT - Edge Function para Transformación de Fotos con IA
 * Usa Lovable AI Gateway (Gemini) para generar imágenes con estilos artísticos
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Mapeo de estilos a prompts descriptivos
const STYLE_PROMPTS: Record<string, string> = {
  caricatura: "Transform this photo into a colorful cartoon caricature style with exaggerated features, vibrant colors, and playful expressions. Keep the subject recognizable but in a fun animated style.",
  comico: "Convert this photo into an American comic book style with bold outlines, halftone dots, pop art colors, and dramatic shading like a superhero comic panel.",
  cinematografico: "Transform this photo into a cinematic movie still style with dramatic lighting, film grain, professional color grading, and a Hollywood blockbuster aesthetic.",
  futurista: "Convert this photo into a futuristic cyberpunk style with neon lights, holographic effects, sci-fi elements, and a high-tech atmosphere.",
  realista: "Enhance this photo with professional lighting corrections, perfect skin texture, natural color enhancement, and studio-quality retouching while keeping it photorealistic.",
  fantasia: "Transform this photo into a magical fantasy art style with ethereal lighting, fairy tale elements, mystical atmosphere, and enchanted forest vibes.",
  anime: "Convert this photo into a Japanese anime style with characteristic large eyes, simplified features, clean lines, and vibrant anime color palette.",
  vintage: "Apply a vintage retro filter with sepia tones, film grain, light leaks, faded colors, and a nostalgic 1970s photography aesthetic.",
  acuarela: "Transform this photo into a delicate watercolor painting style with soft edges, flowing colors, artistic brush strokes, and a hand-painted artistic look.",
  neon: "Apply vibrant neon glow effects with bright fluorescent colors, glowing outlines, dark background, and synthwave aesthetic.",
  minimalista: "Convert this photo into a minimalist artistic style with simplified shapes, limited color palette, clean geometric forms, and modern design aesthetic.",
};

interface TransformRequest {
  contenido_id: string;
  estilo: string;
  tema?: string; // Tema personalizado adicional
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Servicio de IA no configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: TransformRequest = await req.json();

    console.log('Transform request:', { contenido_id: body.contenido_id, estilo: body.estilo });

    // Validar campos requeridos
    if (!body.contenido_id || !body.estilo) {
      return new Response(
        JSON.stringify({ error: 'contenido_id y estilo son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener el contenido de la base de datos
    const { data: contenido, error: contenidoError } = await supabase
      .from('contenido')
      .select('id, url_original, evento_id, estado_ia')
      .eq('id', body.contenido_id)
      .single();

    if (contenidoError || !contenido) {
      console.error('Content not found:', contenidoError);
      return new Response(
        JSON.stringify({ error: 'Contenido no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!contenido.url_original) {
      return new Response(
        JSON.stringify({ error: 'El contenido no tiene imagen original' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Actualizar estado a "procesando"
    await supabase
      .from('contenido')
      .update({ estado_ia: 'procesando' })
      .eq('id', body.contenido_id);

    // Construir el prompt
    const stylePrompt = STYLE_PROMPTS[body.estilo] || STYLE_PROMPTS.caricatura;
    const fullPrompt = body.tema 
      ? `${stylePrompt} Additional theme context: ${body.tema}`
      : stylePrompt;

    console.log('Calling Lovable AI Gateway with style:', body.estilo);

    // Llamar a Lovable AI Gateway para generar la imagen
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: fullPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: contenido.url_original
                }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      // Actualizar estado a error
      await supabase
        .from('contenido')
        .update({ estado_ia: 'error' })
        .eq('id', body.contenido_id);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de solicitudes excedido, intentá más tarde' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA agotados' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Error al procesar la imagen con IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const generatedImage = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      console.error('No image in AI response:', aiData);
      await supabase
        .from('contenido')
        .update({ estado_ia: 'error' })
        .eq('id', body.contenido_id);

      return new Response(
        JSON.stringify({ error: 'No se pudo generar la imagen' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Subir la imagen generada a Storage
    const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, '');
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `ia/${contenido.evento_id}/${body.contenido_id}_${body.estilo}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('contenido-eventos')
      .upload(fileName, imageBytes, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      await supabase
        .from('contenido')
        .update({ estado_ia: 'error' })
        .eq('id', body.contenido_id);

      return new Response(
        JSON.stringify({ error: 'Error al guardar la imagen transformada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener URL pública
    const { data: publicUrl } = supabase.storage
      .from('contenido-eventos')
      .getPublicUrl(fileName);

    // Actualizar el contenido con la URL de la imagen IA
    const { error: updateError } = await supabase
      .from('contenido')
      .update({ 
        url_ia: publicUrl.publicUrl,
        estado_ia: 'completado'
      })
      .eq('id', body.contenido_id);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    console.log('Transform completed successfully:', { 
      contenido_id: body.contenido_id, 
      url_ia: publicUrl.publicUrl 
    });

    return new Response(
      JSON.stringify({
        success: true,
        url_ia: publicUrl.publicUrl,
        estilo: body.estilo
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
