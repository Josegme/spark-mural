import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  evento_nombre: string;
  evento_tipo: string;
  fecha_evento: string;
  hora_inicio: string;
  duracion_horas: number;
  es_premium: boolean;
  precio: number;
  moneda: string; // 'nzd', 'eur', etc.
  pais: string;
  // Datos de personalización
  estilo_ia?: string;
  tema_ia?: string;
  color_banner?: string;
  // Datos del cliente
  cliente_email: string;
  cliente_nombre: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      throw new Error('Stripe not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Usuario no autenticado');
    }

    const body: PaymentRequest = await req.json();
    console.log('Payment request received:', { ...body, cliente_email: '***' });

    // Validate required fields
    if (!body.evento_nombre || !body.fecha_evento || !body.precio) {
      throw new Error('Faltan campos requeridos');
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Determine currency based on country
    const currencyMap: Record<string, string> = {
      'NZ': 'nzd',
      'ES': 'eur',
      'AU': 'aud',
      'US': 'usd',
      'GB': 'gbp',
    };
    const currency = currencyMap[body.pais] || body.moneda || 'usd';

    // Get base URL for redirects
    const origin = req.headers.get('origin') || 'https://id-preview--3f67129c-818e-4d9b-8e17-29150f6ad5f5.lovable.app';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: body.cliente_email,
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: `Evento: ${body.evento_nombre}`,
              description: `${body.es_premium ? 'Premium con IA' : 'Básico'} - ${body.duracion_horas}hs - ${body.fecha_evento}`,
              metadata: {
                tipo: body.evento_tipo,
                duracion: body.duracion_horas.toString(),
              },
            },
            unit_amount: Math.round(body.precio * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        evento_nombre: body.evento_nombre,
        evento_tipo: body.evento_tipo,
        fecha_evento: body.fecha_evento,
        hora_inicio: body.hora_inicio,
        duracion_horas: body.duracion_horas.toString(),
        es_premium: body.es_premium.toString(),
        estilo_ia: body.estilo_ia || '',
        tema_ia: body.tema_ia || '',
        color_banner: body.color_banner || '',
        cliente_nombre: body.cliente_nombre,
        pais: body.pais,
        pasarela: 'stripe',
      },
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
      cancel_url: `${origin}/crear-evento?cancelled=true`,
    });

    console.log('Stripe session created:', session.id);

    // Store pending payment in database
    const { error: insertError } = await supabase
      .from('pagos')
      .insert({
        payment_id_externo: session.id,
        monto: body.precio,
        pasarela: 'stripe',
        tipo: 'evento_unico',
        estado: 'pendiente',
        metadata: {
          checkout_url: session.url,
          evento_data: body,
          user_id: user.id,
        },
      });

    if (insertError) {
      console.error('Error storing payment:', insertError);
      // Don't fail the request, the webhook will handle it
    }

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error creating Stripe payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al crear el pago';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: String(error),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
