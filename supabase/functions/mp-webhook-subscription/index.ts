/**
 * PICKEVENT - Edge Function: Mercado Pago Webhook for Subscriptions
 * Procesa notificaciones de pago de suscripciones de salones
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');
    if (!MP_ACCESS_TOKEN) {
      throw new Error('MP_ACCESS_TOKEN not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('Subscription webhook received:', JSON.stringify(body));

    // Solo procesamos notificaciones de pago
    if (body.type !== 'payment' && body.action !== 'payment.created' && body.action !== 'payment.updated') {
      console.log('Ignoring non-payment notification:', body.type || body.action);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obtener el ID del pago
    const paymentId = body.data?.id;
    if (!paymentId) {
      console.log('No payment ID in webhook');
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Consultar detalles del pago en Mercado Pago
    console.log('Fetching payment details from MP:', paymentId);
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
    });

    if (!mpResponse.ok) {
      console.error('Error fetching payment from MP:', mpResponse.status);
      throw new Error(`MP API error: ${mpResponse.status}`);
    }

    const payment = await mpResponse.json();
    console.log('Payment details:', {
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
      metadata: payment.metadata,
    });

    // Verificar que es un pago de suscripción
    const metadata = payment.metadata || {};
    if (metadata.type !== 'salon_subscription') {
      console.log('Not a salon subscription payment, ignoring');
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const salonId = metadata.salon_id;
    const planEventsLimit = metadata.plan_events_limit || 10;

    if (!salonId) {
      console.error('No salon_id in payment metadata');
      return new Response(JSON.stringify({ received: true, error: 'No salon_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Solo procesar si el pago fue aprobado
    if (payment.status === 'approved') {
      console.log('Payment approved! Activating subscription for salon:', salonId);

      // Calcular fechas de suscripción (validez: 3 meses)
      const SUBSCRIPTION_DURATION_MONTHS = 3;
      const now = new Date();
      const expirationDate = new Date(now);
      expirationDate.setMonth(expirationDate.getMonth() + SUBSCRIPTION_DURATION_MONTHS);
      const nextPaymentDate = new Date(expirationDate);
      nextPaymentDate.setDate(1); // Próximo pago el 1ro del mes de vencimiento

      // Actualizar el tenant con la nueva suscripción
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({
          estado: 'activo',
          limite_eventos_mes: planEventsLimit,
          precio_mensual: payment.transaction_amount,
          fecha_vencimiento: expirationDate.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', salonId);

      if (tenantError) {
        console.error('Error updating tenant:', tenantError);
      }

      // Buscar o crear suscripción
      // Primero buscamos si hay una suscripción existente
      const { data: existingSub } = await supabase
        .from('suscripciones')
        .select('id')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingSub) {
        // Actualizar suscripción existente
        const { error: subError } = await supabase
          .from('suscripciones')
          .update({
            estado: 'activo',
            precio_mensual: payment.transaction_amount,
            fecha_vencimiento: expirationDate.toISOString(),
            fecha_proximo_pago: nextPaymentDate.toISOString(),
          })
          .eq('id', existingSub.id);

        if (subError) {
          console.error('Error updating subscription:', subError);
        }
      } else {
        // Crear nueva suscripción - necesitamos un plan_id
        // Buscar el plan que coincida o crear uno genérico
        const { data: plan } = await supabase
          .from('planes')
          .select('id')
          .eq('limite_eventos_mes', planEventsLimit)
          .eq('activo', true)
          .limit(1)
          .single();

        if (plan) {
          const { error: subInsertError } = await supabase
            .from('suscripciones')
            .insert({
              salon_id: salonId,
              plan_id: plan.id,
              precio_mensual: payment.transaction_amount,
              fecha_inicio: now.toISOString(),
              fecha_vencimiento: expirationDate.toISOString(),
              fecha_proximo_pago: nextPaymentDate.toISOString(),
              estado: 'activo',
            });

          if (subInsertError) {
            console.error('Error inserting subscription:', subInsertError);
          }
        }
      }

      // Actualizar el registro de pago
      await supabase
        .from('pagos')
        .update({
          estado: 'aprobado',
          payment_id_externo: String(payment.id),
        })
        .eq('metadata->>external_reference', payment.external_reference);

      // Registrar en auditoría
      await supabase.from('logs_auditoria').insert({
        accion: 'subscription_payment_approved',
        tabla_afectada: 'suscripciones',
        registro_id: salonId,
        detalles: {
          payment_id: payment.id,
          amount: payment.transaction_amount,
          plan_events_limit: planEventsLimit,
        },
      });

      console.log('Subscription activated successfully for salon:', salonId);
    }

    return new Response(JSON.stringify({ received: true, processed: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Siempre respondemos 200 para que MP no reintente
    return new Response(
      JSON.stringify({ received: true, error: errorMessage }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
