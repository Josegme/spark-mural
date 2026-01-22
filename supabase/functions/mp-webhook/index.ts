import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate unique QR tokens
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook data
    const url = new URL(req.url);
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    const id = url.searchParams.get('id') || url.searchParams.get('data.id');

    // Also check body for newer webhook format
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body might be empty for some webhook types
    }

    const paymentId = id || body?.data?.id;
    const action = topic || body?.action || body?.type;

    console.log('Webhook received:', { action, paymentId, body });

    // Only process payment notifications
    if (action !== 'payment' && action !== 'payment.created' && action !== 'payment.updated') {
      console.log('Ignoring non-payment webhook:', action);
      return new Response(
        JSON.stringify({ received: true, ignored: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!paymentId) {
      console.log('No payment ID in webhook');
      return new Response(
        JSON.stringify({ received: true, error: 'No payment ID' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get payment details from Mercado Pago
    console.log('Fetching payment details for:', paymentId);
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
      },
    });

    if (!mpResponse.ok) {
      console.error('Failed to fetch MP payment:', await mpResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to fetch payment details' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payment = await mpResponse.json();
    console.log('Payment details:', {
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
      metadata: payment.metadata,
    });

    // Map MP status to our status
    const statusMap: Record<string, string> = {
      'approved': 'aprobado',
      'pending': 'pendiente',
      'in_process': 'pendiente',
      'rejected': 'rechazado',
      'refunded': 'reembolsado',
      'cancelled': 'rechazado',
    };

    const nuevoEstado = statusMap[payment.status] || 'pendiente';

    // Find existing payment record by preference_id or external_reference
    const { data: existingPayment, error: findError } = await supabase
      .from('pagos')
      .select('*')
      .or(`payment_id_externo.eq.${payment.preference_id},metadata->>external_reference.eq.${payment.external_reference}`)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error('Error finding payment:', findError);
    }

    // Update or insert payment record
    if (existingPayment) {
      console.log('Updating existing payment:', existingPayment.id);
      
      const { error: updateError } = await supabase
        .from('pagos')
        .update({
          estado: nuevoEstado,
          payment_id_externo: payment.id.toString(),
          metadata: {
            ...existingPayment.metadata,
            mp_payment_id: payment.id,
            mp_status: payment.status,
            mp_status_detail: payment.status_detail,
            updated_at: new Date().toISOString(),
          },
        })
        .eq('id', existingPayment.id);

      if (updateError) {
        console.error('Error updating payment:', updateError);
      }

      // If payment approved and no event exists yet, create it
      if (nuevoEstado === 'aprobado' && !existingPayment.evento_id && payment.metadata?.evento_data) {
        console.log('Creating event after approved payment');
        
        let eventoData;
        try {
          eventoData = typeof payment.metadata.evento_data === 'string' 
            ? JSON.parse(payment.metadata.evento_data)
            : payment.metadata.evento_data;
        } catch (e) {
          console.error('Failed to parse evento_data:', e);
          eventoData = null;
        }

        if (eventoData && payment.metadata?.user_id) {
          const qr_pantalla_token = generateQRToken();
          const qr_invitados_token = generateQRToken();
          const qr_descarga_token = generateQRToken();

          const { data: evento, error: eventoError } = await supabase
            .from('eventos')
            .insert({
              cliente_user_id: payment.metadata.user_id,
              nombre: existingPayment.metadata?.nombre_evento || 'Nuevo Evento',
              tipo: eventoData.tipo || 'cumpleanos',
              fecha_evento: eventoData.fecha_evento,
              hora_inicio: eventoData.hora_inicio || '20:00',
              duracion_horas: eventoData.duracion_horas || 6,
              es_premium: payment.metadata?.es_premium || false,
              tema_ia: eventoData.tema_ia || null,
              estilo_ia: eventoData.estilo_ia || null,
              logo_url: eventoData.logo_url || null,
              color_banner: eventoData.color_banner || '#4c1d95',
              limite_subidas_por_invitado: eventoData.limite_subidas_por_invitado || null,
              moderacion_activa: eventoData.moderacion_activa || false,
              precio_pagado: payment.transaction_amount,
              qr_pantalla_token,
              qr_invitados_token,
              qr_descarga_token,
              estado: 'programado',
              pasarela_pago: 'mercadopago_ar',
              payment_id: payment.id.toString(),
            })
              .select('id')
              .single();

          if (eventoError) {
            console.error('Error creating event:', eventoError);
          } else {
            console.log('Event created:', evento.id);
            
            // Link payment to event
            await supabase
              .from('pagos')
              .update({ evento_id: evento.id })
              .eq('id', existingPayment.id);

            // Send QR codes email automatically
            console.log('Triggering email send for event:', evento.id);
            try {
              const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-event-qr-emails`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({ evento_id: evento.id }),
              });
              const emailResult = await emailResponse.json();
              console.log('Email send result:', emailResult);
            } catch (emailError) {
              console.error('Failed to send QR emails:', emailError);
              // Don't fail the webhook if email fails
            }
          }
        }
      }
    } else {
      console.log('Creating new payment record for:', payment.id);
      
      // Create new payment record
      const { error: insertError } = await supabase
        .from('pagos')
        .insert({
          monto: payment.transaction_amount,
          pasarela: 'mercadopago_ar',
          tipo: 'evento_unico',
          estado: nuevoEstado,
          payment_id_externo: payment.id.toString(),
          metadata: {
            mp_payment_id: payment.id,
            mp_status: payment.status,
            mp_status_detail: payment.status_detail,
            external_reference: payment.external_reference,
            ...payment.metadata,
          },
        });

      if (insertError) {
        console.error('Error inserting payment:', insertError);
      }
    }

    console.log('Webhook processed successfully');
    return new Response(
      JSON.stringify({ received: true, status: nuevoEstado }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
