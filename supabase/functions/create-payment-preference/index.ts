import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  evento_id?: string;
  nombre_evento: string;
  tipo_evento: string;
  es_premium: boolean;
  precio: number;
  cliente_email: string;
  cliente_nombre: string;
  // Para crear evento después del pago
  evento_data?: {
    fecha_evento: string;
    hora_inicio: string;
    duracion_horas: number;
    tema_ia?: string;
    estilo_ia?: string;
    logo_url?: string;
    color_banner?: string;
    limite_subidas_por_invitado?: number;
    moderacion_activa: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')!;

    if (!mpAccessToken) {
      console.error('MP_ACCESS_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Mercado Pago no está configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: PaymentRequest = await req.json();
    console.log('Payment request received:', { ...body, cliente_email: '***' });

    // Validate required fields
    if (!body.nombre_evento || !body.precio || !body.cliente_email) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get origin for return URLs
    const origin = req.headers.get('origin') || 'https://pickevent.app';

    // Create unique external reference
    const externalReference = `evt_${user.id}_${Date.now()}`;

    // Build Mercado Pago preference
    const preference = {
      items: [
        {
          id: body.evento_id || externalReference,
          title: `Evento: ${body.nombre_evento}`,
          description: `${body.es_premium ? 'Plan Premium' : 'Plan Básico'} - ${body.tipo_evento}`,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: body.precio,
        }
      ],
      payer: {
        email: body.cliente_email,
        name: body.cliente_nombre,
      },
      back_urls: {
        success: `${origin}/pago-exitoso?payment=success&ref=${externalReference}`,
        failure: `${origin}/crear-evento?payment=failure`,
        pending: `${origin}/pago-exitoso?payment=pending&ref=${externalReference}`,
      },
      auto_return: 'approved',
      external_reference: externalReference,
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
      statement_descriptor: 'PICKEVENT',
      metadata: {
        user_id: user.id,
        evento_id: body.evento_id,
        es_premium: body.es_premium,
        evento_data: body.evento_data ? JSON.stringify(body.evento_data) : null,
      },
    };

    console.log('Creating MP preference with external_reference:', externalReference);

    // Call Mercado Pago API
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify(preference),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Mercado Pago error:', mpData);
      return new Response(
        JSON.stringify({ 
          error: 'Error al crear preferencia de pago',
          details: mpData.message || 'Error desconocido'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('MP preference created:', { id: mpData.id, init_point: mpData.init_point });

    // Store pending payment in database
    const { error: pagoError } = await supabase
      .from('pagos')
      .insert({
        evento_id: body.evento_id || null,
        monto: body.precio,
        pasarela: 'mercadopago_ar',
        tipo: 'evento_unico',
        estado: 'pendiente',
        payment_id_externo: mpData.id,
        metadata: {
          external_reference: externalReference,
          user_id: user.id,
          evento_data: body.evento_data,
          nombre_evento: body.nombre_evento,
          es_premium: body.es_premium,
        },
      });

    if (pagoError) {
      console.error('Error storing payment:', pagoError);
      // Don't fail - payment can still proceed
    }

    return new Response(
      JSON.stringify({
        success: true,
        preference_id: mpData.id,
        init_point: mpData.init_point,
        sandbox_init_point: mpData.sandbox_init_point,
        external_reference: externalReference,
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
