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

    console.log('=== MP WEBHOOK RECEIVED ===');
    console.log('Action:', action);
    console.log('Payment ID:', paymentId);
    console.log('Body:', JSON.stringify(body, null, 2));

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
    console.log('Fetching payment details from MP for payment_id:', paymentId);
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
    console.log('=== MP PAYMENT DETAILS ===');
    console.log('Payment ID:', payment.id);
    console.log('Status:', payment.status);
    console.log('External Reference:', payment.external_reference);
    console.log('Preference ID:', payment.preference_id);
    console.log('Transaction Amount:', payment.transaction_amount);
    console.log('Metadata:', JSON.stringify(payment.metadata, null, 2));

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
    console.log('Mapped status:', payment.status, '->', nuevoEstado);

    // IMPROVED: Find existing payment record using multiple strategies
    // Strategy 1: Try to find by preference_id (stored in payment_id_externo when created)
    // Strategy 2: Try to find by external_reference in metadata
    // Strategy 3: Try to find pending payments by user_id from external_reference
    
    let existingPayment = null;
    let findError = null;

    // Strategy 1: By preference_id
    if (payment.preference_id) {
      console.log('Strategy 1: Looking for payment with preference_id:', payment.preference_id);
      const result = await supabase
        .from('pagos')
        .select('*')
        .eq('payment_id_externo', payment.preference_id)
        .maybeSingle();
      
      if (result.data) {
        console.log('Found payment by preference_id:', result.data.id);
        existingPayment = result.data;
      } else if (result.error && result.error.code !== 'PGRST116') {
        findError = result.error;
      }
    }

    // Strategy 2: By external_reference in metadata
    if (!existingPayment && payment.external_reference) {
      console.log('Strategy 2: Looking for payment with external_reference in metadata:', payment.external_reference);
      const result = await supabase
        .from('pagos')
        .select('*')
        .eq('estado', 'pendiente')
        .maybeSingle();
      
      // Filter in memory for external_reference match
      if (result.data && result.data.metadata?.external_reference === payment.external_reference) {
        console.log('Found payment by external_reference match:', result.data.id);
        existingPayment = result.data;
      }
    }

    // Strategy 3: Get all pending payments and find by external_reference or user_id
    if (!existingPayment && payment.external_reference) {
      console.log('Strategy 3: Searching all pending payments for external_reference match');
      const { data: pendingPayments, error: pendingError } = await supabase
        .from('pagos')
        .select('*')
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!pendingError && pendingPayments) {
        console.log('Found', pendingPayments.length, 'pending payments to check');
        
        for (const pago of pendingPayments) {
          const metadata = pago.metadata as any;
          
          // Check if external_reference matches
          if (metadata?.external_reference === payment.external_reference) {
            console.log('Match found by external_reference:', pago.id);
            existingPayment = pago;
            break;
          }
          
          // Also check if user_id from external_reference matches
          // External reference format: evt_{user_id}_{timestamp}
          if (payment.external_reference && metadata?.user_id) {
            const refParts = payment.external_reference.split('_');
            if (refParts.length >= 2 && refParts[1] === metadata.user_id) {
              console.log('Match found by user_id from external_reference:', pago.id);
              existingPayment = pago;
              break;
            }
          }
        }
      }
    }

    if (findError) {
      console.error('Error finding payment:', findError);
    }

    // Update or insert payment record
    if (existingPayment) {
      console.log('=== UPDATING EXISTING PAYMENT ===');
      console.log('Payment DB ID:', existingPayment.id);
      console.log('Current status:', existingPayment.estado);
      console.log('New status:', nuevoEstado);
      
      const { error: updateError } = await supabase
        .from('pagos')
        .update({
          estado: nuevoEstado,
          payment_id_externo: payment.id.toString(),
          metadata: {
            ...((existingPayment.metadata as any) || {}),
            mp_payment_id: payment.id,
            mp_status: payment.status,
            mp_status_detail: payment.status_detail,
            mp_preference_id: payment.preference_id,
            updated_at: new Date().toISOString(),
          },
        })
        .eq('id', existingPayment.id);

      if (updateError) {
        console.error('Error updating payment:', updateError);
      } else {
        console.log('Payment updated successfully');
      }

      // If payment approved, handle event creation or update
      const metadata = existingPayment.metadata as any;
      
      // CASE 1: Event already exists (created by asistente when generating payment link)
      if (nuevoEstado === 'aprobado' && existingPayment.evento_id) {
        console.log('=== PAYMENT APPROVED FOR EXISTING EVENT ===');
        console.log('Event ID:', existingPayment.evento_id);
        
        // Get event data to access tenant_id
        const { data: eventoData, error: eventoError } = await supabase
          .from('eventos')
          .select('id, tenant_id, nombre')
          .eq('id', existingPayment.evento_id)
          .single();
        
        if (eventoError) {
          console.error('Error fetching event:', eventoError);
        } else {
          console.log('Found event:', eventoData.nombre);
          
          // If tenant exists (asistente flow), increment sales counter
          if (eventoData.tenant_id) {
            console.log('=== UPDATING ASISTENTE SALES COUNTER ===');
            try {
              const { data: tenantData, error: tenantError } = await supabase
                .from('tenants')
                .select('eventos_vendidos_total, eventos_cortesia_disponibles')
                .eq('id', eventoData.tenant_id)
                .single();

              if (!tenantError && tenantData) {
                const currentSales = tenantData.eventos_vendidos_total || 0;
                const newSales = currentSales + 1;
                
                // Check if we've hit a 30-sale milestone
                const oldMilestones = Math.floor(currentSales / 30);
                const newMilestones = Math.floor(newSales / 30);
                const unlockedNewCourtesy = newMilestones > oldMilestones;
                
                const updateData: any = { eventos_vendidos_total: newSales };
                
                if (unlockedNewCourtesy) {
                  const currentCourtesy = tenantData.eventos_cortesia_disponibles || 0;
                  updateData.eventos_cortesia_disponibles = currentCourtesy + 2;
                  console.log('🎉 Milestone reached! Unlocking 2 courtesy events.');
                }

                const { error: updateTenantError } = await supabase
                  .from('tenants')
                  .update(updateData)
                  .eq('id', eventoData.tenant_id);
                
                if (updateTenantError) {
                  console.error('Error updating tenant sales counter:', updateTenantError);
                } else {
                  console.log('Tenant sales counter updated. New total:', newSales);
                }
              }
            } catch (tenantUpdateError) {
              console.error('Failed to update tenant sales counter:', tenantUpdateError);
            }
          }

          // Send QR codes email to both user and client
          console.log('Triggering email send for existing event:', existingPayment.evento_id);
          try {
            // Get user and client emails
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', payment.metadata?.user_id || eventoData?.cliente_user_id)
              .single();
            
            const recipientEmails = [];
            if (userProfile?.email) recipientEmails.push(userProfile.email);
            if (payment.payer?.email && payment.payer.email !== userProfile?.email) {
              recipientEmails.push(payment.payer.email);
            }
            
            if (recipientEmails.length > 0) {
              const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-event-qr-emails`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({ 
                  evento_id: existingPayment.evento_id,
                  recipientEmails 
                }),
              });
              const emailResult = await emailResponse.json();
              console.log('Email send result:', emailResult);
            }
          } catch (emailError) {
            console.error('Failed to send QR emails:', emailError);
          }
        }
      }
      // CASE 2: No event exists yet, create it (direct client payment flow)
      else if (nuevoEstado === 'aprobado' && !existingPayment.evento_id && metadata?.evento_data) {
        console.log('=== CREATING EVENT AFTER APPROVED PAYMENT ===');
        
        let eventoData;
        try {
          eventoData = typeof metadata.evento_data === 'string' 
            ? JSON.parse(metadata.evento_data)
            : metadata.evento_data;
        } catch (e) {
          console.error('Failed to parse evento_data:', e);
          eventoData = null;
        }

        console.log('Event data:', JSON.stringify(eventoData, null, 2));
        console.log('User ID:', metadata?.user_id);

        if (eventoData && metadata?.user_id) {
          const qr_pantalla_token = generateQRToken();
          const qr_invitados_token = generateQRToken();
          const qr_descarga_token = generateQRToken();

          console.log('Generated QR tokens:', { qr_pantalla_token, qr_invitados_token, qr_descarga_token });

          // Get user's tenant_id if they're an asistente
          let tenantId = null;
          try {
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('tenant_id, rol')
              .eq('id', metadata.user_id)
              .single();
            
            if (userProfile?.rol === 'asistente' && userProfile?.tenant_id) {
              tenantId = userProfile.tenant_id;
              console.log('User is asistente with tenant_id:', tenantId);
            }
          } catch (e) {
            console.log('Could not fetch user profile for tenant lookup');
          }

          const { data: evento, error: eventoError } = await supabase
            .from('eventos')
            .insert({
              cliente_user_id: metadata.user_id,
              nombre: metadata?.nombre_evento || 'Nuevo Evento',
              tipo: eventoData.tipo || 'cumpleanos',
              fecha_evento: eventoData.fecha_evento,
              hora_inicio: eventoData.hora_inicio || '20:00',
              duracion_horas: eventoData.duracion_horas || 6,
              es_premium: metadata?.es_premium || false,
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
              tenant_id: tenantId,
            })
            .select('id')
            .single();

          if (eventoError) {
            console.error('Error creating event:', eventoError);
          } else {
            console.log('Event created successfully:', evento.id);
            
            // Link payment to event
            const { error: linkError } = await supabase
              .from('pagos')
              .update({ evento_id: evento.id })
              .eq('id', existingPayment.id);
            
            if (linkError) {
              console.error('Error linking payment to event:', linkError);
            } else {
              console.log('Payment linked to event successfully');
            }

            // If tenant exists (asistente flow), increment sales counter and check for courtesy unlock
            if (tenantId) {
              console.log('=== UPDATING ASISTENTE SALES COUNTER ===');
              try {
                const { data: tenantData, error: tenantError } = await supabase
                  .from('tenants')
                  .select('eventos_vendidos_total, eventos_cortesia_disponibles')
                  .eq('id', tenantId)
                  .single();

                if (!tenantError && tenantData) {
                  const currentSales = tenantData.eventos_vendidos_total || 0;
                  const newSales = currentSales + 1;
                  
                  const oldMilestones = Math.floor(currentSales / 30);
                  const newMilestones = Math.floor(newSales / 30);
                  const unlockedNewCourtesy = newMilestones > oldMilestones;
                  
                  const updateData: any = { eventos_vendidos_total: newSales };
                  
                  if (unlockedNewCourtesy) {
                    const currentCourtesy = tenantData.eventos_cortesia_disponibles || 0;
                    updateData.eventos_cortesia_disponibles = currentCourtesy + 2;
                    console.log('🎉 Milestone reached! Unlocking 2 courtesy events.');
                  }
                  
                  const { error: updateTenantError } = await supabase
                    .from('tenants')
                    .update(updateData)
                    .eq('id', tenantId);
                  
                  if (updateTenantError) {
                    console.error('Error updating tenant sales counter:', updateTenantError);
                  } else {
                    console.log('Tenant sales counter updated. New total:', newSales);
                  }
                }
              } catch (tenantUpdateError) {
                console.error('Failed to update tenant sales counter:', tenantUpdateError);
              }
            }

            // Send QR codes email to both user and client
            console.log('Triggering email send for event:', evento.id);
            try {
              // Get user profile for email
              const { data: userProfile } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', metadata.user_id)
                .single();
              
              const recipientEmails = [];
              if (userProfile?.email) recipientEmails.push(userProfile.email);
              if (payment.payer?.email && payment.payer.email !== userProfile?.email) {
                recipientEmails.push(payment.payer.email);
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
                    recipientEmails 
                  }),
                });
                const emailResult = await emailResponse.json();
                console.log('Email send result:', emailResult);
              }
            } catch (emailError) {
              console.error('Failed to send QR emails:', emailError);
            }
          }
        } else {
          console.log('Missing evento_data or user_id, cannot create event');
        }
      }
    } else {
      console.log('=== NO EXISTING PAYMENT FOUND - Creating new record ===');
      
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
            mp_preference_id: payment.preference_id,
            external_reference: payment.external_reference,
            ...payment.metadata,
          },
        });

      if (insertError) {
        console.error('Error inserting payment:', insertError);
      } else {
        console.log('New payment record created');
      }
    }

    console.log('=== WEBHOOK PROCESSED SUCCESSFULLY ===');
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
