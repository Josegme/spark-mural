import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

// Generate random QR token
function generateQRToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      throw new Error('Stripe not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        console.log('Webhook signature verified');
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Webhook signature verification failed:', errMessage);
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 400, headers: corsHeaders }
        );
      }
    } else {
      // For testing without webhook secret
      event = JSON.parse(body);
      console.log('Webhook received (no signature verification):', event.type);
    }

    console.log('Processing Stripe event:', event.type);

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Checkout session completed:', session.id);

      const metadata = session.metadata || {};
      const userId = metadata.user_id;
      const paymentStatus = session.payment_status;

      if (paymentStatus !== 'paid') {
        console.log('Payment not completed yet, status:', paymentStatus);
        return new Response(
          JSON.stringify({ received: true, status: 'pending' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if payment already exists
      const { data: existingPayment } = await supabase
        .from('pagos')
        .select('*')
        .eq('payment_id_externo', session.id)
        .single();

      if (existingPayment?.evento_id) {
        console.log('Event already created for this payment');
        return new Response(
          JSON.stringify({ received: true, message: 'Already processed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate QR tokens
      const qrInvitados = generateQRToken();
      const qrPantalla = generateQRToken();
      const qrDescarga = generateQRToken();

      // Calculate album availability (30 days after event)
      const fechaEvento = new Date(metadata.fecha_evento);
      const albumDisponibleHasta = new Date(fechaEvento);
      albumDisponibleHasta.setDate(albumDisponibleHasta.getDate() + 30);

      // Create the event
      const { data: evento, error: eventoError } = await supabase
        .from('eventos')
        .insert({
          cliente_user_id: userId,
          nombre: metadata.evento_nombre,
          tipo: metadata.evento_tipo || 'otro',
          fecha_evento: metadata.fecha_evento,
          hora_inicio: metadata.hora_inicio || '20:00',
          duracion_horas: parseInt(metadata.duracion_horas) || 6,
          es_premium: metadata.es_premium === 'true',
          estilo_ia: metadata.estilo_ia || null,
          tema_ia: metadata.tema_ia || null,
          color_banner: metadata.color_banner || '#4c1d95',
          estado: 'programado',
          precio_pagado: (session.amount_total || 0) / 100,
          pasarela_pago: 'stripe',
          payment_id: session.id,
          qr_invitados_token: qrInvitados,
          qr_pantalla_token: qrPantalla,
          qr_descarga_token: qrDescarga,
          album_disponible_hasta: albumDisponibleHasta.toISOString(),
        })
        .select()
        .single();

      if (eventoError) {
        console.error('Error creating event:', eventoError);
        throw eventoError;
      }

      console.log('Event created successfully:', evento.id);

      // Update payment record
      await supabase
        .from('pagos')
        .upsert({
          payment_id_externo: session.id,
          evento_id: evento.id,
          monto: (session.amount_total || 0) / 100,
          estado: 'aprobado',
          pasarela: 'stripe',
          tipo: 'evento_unico',
          metadata: {
            stripe_session: session.id,
            customer_email: session.customer_email,
            payment_intent: session.payment_intent,
          },
        }, {
          onConflict: 'payment_id_externo',
        });

      // Trigger email with QR codes to both user and payer
      try {
        // Get user profile for email
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();
        
        const recipientEmails = [];
        if (userProfile?.email) recipientEmails.push(userProfile.email);
        if (session.customer_email && session.customer_email !== userProfile?.email) {
          recipientEmails.push(session.customer_email);
        }
        
        if (recipientEmails.length > 0) {
          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-event-qr-emails`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              evento_id: evento.id,
              recipientEmails,
            }),
          });
          
          const emailText = await emailResponse.text();
          console.log('Email function response:', emailText);
        }
      } catch (emailError) {
        console.error('Error triggering email:', emailError);
        // Don't fail the webhook for email errors
      }

      return new Response(
        JSON.stringify({ 
          received: true, 
          evento_id: evento.id,
          message: 'Event created successfully',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle payment_intent.payment_failed
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('Payment failed:', paymentIntent.id);

      await supabase
        .from('pagos')
        .update({ estado: 'rechazado' })
        .eq('payment_id_externo', paymentIntent.id);

      return new Response(
        JSON.stringify({ received: true, status: 'failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default response for other events
    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
