/**
 * PICKEVENT - Edge Function: Create Salon Subscription Payment
 * Crea una preferencia de pago en Mercado Pago para suscripción de salones
 * Plan: $150,000 ARS por 10 eventos/mes
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAN_PRICE = 150000; // $150,000 ARS
const PLAN_EVENTS_LIMIT = 10;
const PLAN_NAME = "Plan Salón Mensual";

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

    const { salon_id, salon_email, salon_nombre, success_url, failure_url } = await req.json();

    if (!salon_id || !salon_email) {
      throw new Error('salon_id and salon_email are required');
    }

    console.log('Creating subscription payment for salon:', salon_id, salon_nombre);

    // Verificar que el salón existe
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, nombre, email')
      .eq('id', salon_id)
      .eq('tipo', 'salon')
      .single();

    if (tenantError || !tenant) {
      throw new Error('Salon not found');
    }

    // Crear referencia única para el pago
    const externalReference = `subscription_${salon_id}_${Date.now()}`;

    // Crear preferencia de pago en Mercado Pago
    const preferenceData = {
      items: [
        {
          id: `salon_subscription_${salon_id}`,
          title: `${PLAN_NAME} - ${tenant.nombre}`,
          description: `Suscripción mensual PickEvent: ${PLAN_EVENTS_LIMIT} eventos por mes`,
          category_id: "services",
          quantity: 1,
          currency_id: "ARS",
          unit_price: PLAN_PRICE,
        },
      ],
      payer: {
        email: salon_email,
        name: salon_nombre || tenant.nombre,
      },
      back_urls: {
        success: success_url || `${Deno.env.get('SITE_URL') || 'https://pickevent.com'}/salon?payment=success`,
        failure: failure_url || `${Deno.env.get('SITE_URL') || 'https://pickevent.com'}/salon?payment=failure`,
        pending: success_url || `${Deno.env.get('SITE_URL') || 'https://pickevent.com'}/salon?payment=pending`,
      },
      auto_return: "approved",
      external_reference: externalReference,
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook-subscription`,
      statement_descriptor: "PICKEVENT SUSCRIPCION",
      metadata: {
        type: "salon_subscription",
        salon_id: salon_id,
        plan_events_limit: PLAN_EVENTS_LIMIT,
        plan_price: PLAN_PRICE,
      },
    };

    console.log('Creating MP preference with external_reference:', externalReference);

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceData),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text();
      console.error('MP API error:', errorData);
      throw new Error(`Mercado Pago API error: ${mpResponse.status}`);
    }

    const preference = await mpResponse.json();
    console.log('MP preference created:', preference.id);

    // Registrar el intento de pago en la tabla pagos
    const { error: insertError } = await supabase
      .from('pagos')
      .insert({
        tipo: 'suscripcion_mensual',
        monto: PLAN_PRICE,
        pasarela: 'mercadopago_ar',
        estado: 'pendiente',
        payment_id_externo: preference.id,
        metadata: {
          salon_id: salon_id,
          external_reference: externalReference,
          plan_events_limit: PLAN_EVENTS_LIMIT,
          type: 'salon_subscription',
        },
      });

    if (insertError) {
      console.error('Error inserting payment record:', insertError);
      // No fallo, continúo con el checkout
    }

    return new Response(
      JSON.stringify({
        success: true,
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Error creating subscription payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
