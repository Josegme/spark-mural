import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = Deno.env.get('APP_BASE_URL') || 'https://pickevent.site';
const qrUrl = (data: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=10&data=${encodeURIComponent(data)}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { qr_token } = await req.json();
    if (!qr_token) {
      return new Response(JSON.stringify({ error: 'qr_token required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: inv, error: invErr } = await supabase
      .from('invitaciones')
      .select('id, nombre, email, acompanantes, evento_id, qr_token')
      .eq('qr_token', qr_token)
      .maybeSingle();

    if (invErr || !inv) {
      return new Response(JSON.stringify({ error: 'Invitación no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!inv.email) {
      return new Response(JSON.stringify({ skipped: true, reason: 'sin email' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: ev } = await supabase
      .from('eventos')
      .select('nombre, fecha_evento, hora_inicio, color_banner, logo_url')
      .eq('id', inv.evento_id)
      .single();

    const evento = ev || { nombre: 'Tu evento', fecha_evento: '', hora_inicio: '', color_banner: '#4c1d95', logo_url: null };
    const fecha = evento.fecha_evento
      ? new Date(evento.fecha_evento).toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : '';
    const miInvitacionUrl = `${BASE_URL}/mi-invitacion/${qr_token}`;
    const banner = evento.color_banner || '#4c1d95';

    const resend = new Resend(resendKey);
    const { data: result, error: emailError } = await resend.emails.send({
      from: 'PickEvent <noreply@pickevent.site>',
      to: [inv.email],
      subject: `🎟️ Tu invitación a "${evento.nombre}"`,
      html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Tu invitación</title></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#0a0a0a;color:#fff;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="font-size:28px;margin:0;background:linear-gradient(135deg,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">PickEvent</h1>
    </div>
    <div style="background:linear-gradient(135deg,${banner},${banner}cc);border-radius:16px;padding:32px 20px;text-align:center;margin-bottom:24px;">
      ${evento.logo_url ? `<img src="${evento.logo_url}" alt="${evento.nombre}" style="max-height:80px;margin-bottom:12px;">` : ''}
      <h2 style="margin:0;font-size:24px;color:#fff;">${evento.nombre}</h2>
    </div>
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
      <div style="display:inline-block;padding:6px 14px;border-radius:999px;background:rgba(34,197,94,.15);color:#22c55e;font-size:13px;font-weight:600;margin-bottom:16px;">✓ Asistencia confirmada</div>
      <h3 style="margin:0 0 8px 0;color:#fff;font-size:20px;">Hola, ${inv.nombre}</h3>
      <p style="margin:0 0 20px 0;color:#a1a1aa;font-size:14px;">Mostrá este QR en el ingreso del evento</p>
      <div style="background:#fff;display:inline-block;padding:12px;border-radius:12px;">
        <img src="${qrUrl(qr_token)}" alt="QR de invitación" width="240" height="240" style="display:block;">
      </div>
      <div style="margin-top:20px;color:#a1a1aa;font-size:14px;">
        📅 ${fecha}<br>
        🕐 ${evento.hora_inicio} hs
        ${inv.acompanantes > 0 ? `<br>👥 Acompañantes: ${inv.acompanantes}` : ''}
      </div>
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${miInvitacionUrl}" style="display:inline-block;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;">Ver mi invitación</a>
    </div>
    <p style="text-align:center;color:#71717a;font-size:12px;margin:0;">Guardá este email o el link. Lo vas a necesitar el día del evento.</p>
    <div style="border-top:1px solid #27272a;margin-top:24px;padding-top:16px;text-align:center;color:#71717a;font-size:12px;">© 2026 PickEvent</div>
  </div>
</body></html>`,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return new Response(JSON.stringify({ error: 'Failed to send', details: emailError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, emailId: result?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('send-invitacion-qr error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
