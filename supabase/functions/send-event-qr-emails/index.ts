import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getBaseUrl(): string {
  return Deno.env.get('APP_BASE_URL') || 'https://pickevent.site';
}

function getQRCodeUrl(data: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
}

// Format currency based on gateway
function formatCurrency(amount: number, gateway: string): string {
  if (gateway.startsWith('mercadopago_ar') || gateway === 'mercadopago_ar') {
    return `ARS $${amount.toLocaleString('es-AR')}`;
  }
  if (gateway.startsWith('mercadopago_br') || gateway === 'mercadopago_br') {
    return `BRL R$${amount.toLocaleString('pt-BR')}`;
  }
  if (gateway === 'stripe') {
    return `USD $${amount.toLocaleString('en-US')}`;
  }
  return `$${amount}`;
}

function getGatewayLabel(gateway: string): string {
  const labels: Record<string, string> = {
    'mercadopago_ar': 'Mercado Pago (Argentina)',
    'mercadopago_br': 'Mercado Pago (Brasil)',
    'mercadopago_py': 'Mercado Pago (Paraguay)',
    'stripe': 'Stripe',
    'bancard': 'Bancard',
  };
  return labels[gateway] || gateway;
}

// Build payment confirmation HTML block
function buildPaymentSection(paymentInfo: { monto: number; pasarela: string; transaccion_id: string }): string {
  const { monto, pasarela, transaccion_id } = paymentInfo;
  return `
    <!-- Payment Confirmation -->
    <div style="background-color: #18181b; border: 1px solid #22c55e; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
      <h3 style="margin: 0 0 16px 0; color: #22c55e; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">✅ Pago Confirmado</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #a1a1aa; font-size: 14px;">Monto:</td>
          <td style="padding: 8px 0; color: #ffffff; font-size: 16px; font-weight: 600; text-align: right;">${formatCurrency(monto, pasarela)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #a1a1aa; font-size: 14px; border-top: 1px solid #27272a;">Método:</td>
          <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right; border-top: 1px solid #27272a;">${getGatewayLabel(pasarela)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #a1a1aa; font-size: 14px; border-top: 1px solid #27272a;">ID Transacción:</td>
          <td style="padding: 8px 0; color: #a1a1aa; font-size: 12px; text-align: right; border-top: 1px solid #27272a; font-family: monospace;">${transaccion_id}</td>
        </tr>
      </table>
    </div>
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Accept optional paymentInfo: { monto, pasarela, transaccion_id }
    const { evento_id, recipientEmails, paymentInfo } = await req.json();

    if (!evento_id || !recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return new Response(
        JSON.stringify({ error: 'evento_id and recipientEmails array are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching event data for:', evento_id);

    const { data: evento, error: eventoError } = await supabase
      .from('eventos')
      .select(`
        id, nombre, fecha_evento, hora_inicio,
        qr_pantalla_token, qr_invitados_token, qr_descarga_token,
        cliente_user_id
      `)
      .eq('id', evento_id)
      .single();

    if (eventoError || !evento) {
      console.error('Event not found:', eventoError);
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('nombre')
      .eq('id', evento.cliente_user_id)
      .single();

    const clienteName = profile?.nombre || 'Cliente';

    const baseUrl = getBaseUrl();
    const muroUrl = `${baseUrl}/muro/${evento.qr_pantalla_token}`;
    const invitadosUrl = `${baseUrl}/subir/${evento.qr_invitados_token}`;
    const descargaUrl = `${baseUrl}/album/${evento.qr_descarga_token}`;

    const fechaFormateada = new Date(evento.fecha_evento).toLocaleDateString('es-AR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Build payment section HTML if paymentInfo is provided
    const paymentSectionHtml = paymentInfo?.monto && paymentInfo?.pasarela && paymentInfo?.transaccion_id
      ? buildPaymentSection(paymentInfo)
      : '';

    console.log('Sending emails to:', recipientEmails, paymentInfo ? 'with payment info' : 'without payment info');

    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: 'PickEvent <noreply@pickevent.site>',
      to: recipientEmails,
      subject: `🎉 ¡Tu evento "${evento.nombre}" está listo!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tu evento está listo</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-size: 32px; margin: 0; background: linear-gradient(135deg, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                PickEvent
              </h1>
            </div>

            <!-- Success Banner -->
            <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2)); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 30px;">
              <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
              <h2 style="margin: 0 0 8px 0; font-size: 24px; color: #ffffff;">¡Felicidades, ${clienteName}!</h2>
              <p style="margin: 0; color: #a1a1aa; font-size: 16px;">Tu evento ha sido creado exitosamente</p>
            </div>

            <!-- Event Info -->
            <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 16px 0; color: #a855f7; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Detalles del Evento</h3>
              <p style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #ffffff;">${evento.nombre}</p>
              <p style="margin: 0; color: #a1a1aa;">📅 ${fechaFormateada}</p>
              <p style="margin: 8px 0 0 0; color: #a1a1aa;">🕐 ${evento.hora_inicio} hs</p>
            </div>

            ${paymentSectionHtml}

            <!-- QR Codes Section -->
            <h3 style="text-align: center; margin-bottom: 24px; color: #ffffff;">Tus códigos QR</h3>

            <!-- QR 1: Pantalla -->
            <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <span style="font-size: 24px; margin-right: 12px;">📺</span>
                <div>
                  <h4 style="margin: 0; color: #ffffff; font-size: 16px;">QR Pantalla (Muro en vivo)</h4>
                  <p style="margin: 4px 0 0 0; color: #71717a; font-size: 14px;">Proyectá este QR o abrí el link en una pantalla grande para mostrar las fotos en tiempo real</p>
                </div>
              </div>
              <div style="text-align: center; margin: 16px 0;">
                <img src="${getQRCodeUrl(muroUrl)}" alt="QR Pantalla" style="width: 180px; height: 180px; border-radius: 8px;">
              </div>
              <div style="background-color: #27272a; border-radius: 8px; padding: 12px;">
                <p style="margin: 0; font-size: 12px; color: #a1a1aa; word-break: break-all;">${muroUrl}</p>
              </div>
            </div>

            <!-- QR 2: Invitados -->
            <div style="background-color: #18181b; border: 1px solid #3b82f6; border-radius: 12px; padding: 24px; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <span style="font-size: 24px; margin-right: 12px;">📱</span>
                <div>
                  <h4 style="margin: 0; color: #ffffff; font-size: 16px;">QR Invitados (Subir fotos)</h4>
                  <p style="margin: 4px 0 0 0; color: #71717a; font-size: 14px;">Imprimí este QR y ponelo visible para que los invitados suban sus fotos y videos</p>
                </div>
              </div>
              <div style="text-align: center; margin: 16px 0;">
                <img src="${getQRCodeUrl(invitadosUrl)}" alt="QR Invitados" style="width: 180px; height: 180px; border-radius: 8px;">
              </div>
              <div style="background-color: #27272a; border-radius: 8px; padding: 12px;">
                <p style="margin: 0; font-size: 12px; color: #a1a1aa; word-break: break-all;">${invitadosUrl}</p>
              </div>
            </div>

            <!-- QR 3: Descarga -->
            <div style="background-color: #18181b; border: 1px solid #22c55e; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
              <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <span style="font-size: 24px; margin-right: 12px;">💾</span>
                <div>
                  <h4 style="margin: 0; color: #ffffff; font-size: 16px;">QR Descarga (Álbum)</h4>
                  <p style="margin: 4px 0 0 0; color: #71717a; font-size: 14px;">Después del evento, compartí este link para que descarguen todas las fotos</p>
                </div>
              </div>
              <div style="text-align: center; margin: 16px 0;">
                <img src="${getQRCodeUrl(descargaUrl)}" alt="QR Descarga" style="width: 180px; height: 180px; border-radius: 8px;">
              </div>
              <div style="background-color: #27272a; border-radius: 8px; padding: 12px;">
                <p style="margin: 0; font-size: 12px; color: #a1a1aa; word-break: break-all;">${descargaUrl}</p>
              </div>
            </div>

            <!-- Tips Section -->
            <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 16px 0; color: #a855f7; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">💡 Consejos</h3>
              <ul style="margin: 0; padding-left: 20px; color: #a1a1aa;">
                <li style="margin-bottom: 8px;">Imprimí el QR de invitados y ponelo en un lugar visible</li>
                <li style="margin-bottom: 8px;">Abrí el muro en vivo en una TV o proyector</li>
                <li style="margin-bottom: 8px;">El álbum estará disponible por 30 días después del evento</li>
              </ul>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 40px;">
              <a href="${baseUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Ir a mi Panel
              </a>
            </div>

            <!-- Footer -->
            <div style="text-align: center; color: #71717a; font-size: 14px; border-top: 1px solid #27272a; padding-top: 24px;">
              <p style="margin: 0 0 8px 0;">¿Tenés preguntas? Respondé a este email</p>
              <p style="margin: 0;">© 2026 PickEvent - Momentos que perduran</p>
            </div>

          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error('Email send error:', emailError);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: emailError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Email sent successfully:', emailResult);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-event-qr-emails:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
