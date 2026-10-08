import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const BASE_URL = Deno.env.get('APP_BASE_URL') || 'https://pickevent.site';
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const qrUrl = (d: string) => `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=10&data=${encodeURIComponent(d)}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) return json({ error: 'Servicio de email no configurado' }, 500);

    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'No autenticado' }, 401);

    const body = await req.json().catch(() => ({}));
    const { evento_id, asunto, mensaje, incluir_qr } = body ?? {};
    if (typeof evento_id !== 'string' || typeof asunto !== 'string' || typeof mensaje !== 'string'
      || !asunto.trim() || asunto.length > 200 || !mensaje.trim() || mensaje.length > 3000) {
      return json({ error: 'Datos inválidos' }, 400);
    }

    // Verifica permisos con la sesión del usuario (RLS)
    const { data: owns } = await userClient.rpc('user_owns_evento', { _evento_id: evento_id });
    if (!owns) return json({ error: 'Sin permisos sobre este evento' }, 403);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: ev } = await admin.from('eventos')
      .select('nombre, fecha_evento, hora_inicio, color_banner, logo_url').eq('id', evento_id).single();
    if (!ev) return json({ error: 'Evento no encontrado' }, 404);

    const { data: invs } = await admin.from('invitaciones')
      .select('nombre, email, qr_token').eq('evento_id', evento_id).eq('estado', 'confirmado').not('email', 'is', null);

    const fecha = new Date(ev.fecha_evento + 'T12:00:00').toLocaleDateString('es-AR',
      { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const hora = String(ev.hora_inicio || '').slice(0, 5);
    const banner = ev.color_banner || '#4c1d95';
    const resend = new Resend(resendKey);
    let enviados = 0; const fallidos: string[] = [];

    for (const inv of invs || []) {
      if (!inv.email) continue;
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#0a0a0a;color:#fff;">
<div style="max-width:600px;margin:0 auto;padding:32px 20px;">
  <div style="background:${banner};border-radius:16px;padding:28px 20px;text-align:center;margin-bottom:20px;">
    ${ev.logo_url ? `<img src="${ev.logo_url}" style="max-height:70px;margin-bottom:10px;">` : ''}
    <h2 style="margin:0;color:#fff;">${esc(ev.nombre)}</h2>
  </div>
  <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;margin-bottom:20px;">
    <div style="display:inline-block;padding:6px 14px;border-radius:999px;background:rgba(245,158,11,.15);color:#f59e0b;font-size:13px;font-weight:600;margin-bottom:14px;">📅 Cambio de fecha</div>
    <h3 style="margin:0 0 12px;color:#fff;">Hola, ${esc(inv.nombre)}</h3>
    <p style="margin:0 0 16px;color:#d4d4d8;font-size:15px;line-height:1.6;white-space:pre-line;">${esc(mensaje)}</p>
    <div style="background:#0a0a0a;border-radius:8px;padding:14px;color:#fff;font-size:15px;">
      <strong>Nueva fecha:</strong> ${fecha}<br><strong>Hora:</strong> ${hora} hs
    </div>
  </div>
  ${incluir_qr ? `<div style="text-align:center;margin-bottom:20px;">
    <p style="color:#a1a1aa;font-size:14px;">Tu QR de ingreso sigue siendo válido:</p>
    <div style="background:#fff;display:inline-block;padding:12px;border-radius:12px;"><img src="${qrUrl(inv.qr_token)}" width="220" height="220" style="display:block;"></div>
    <div style="margin-top:16px;"><a href="${BASE_URL}/mi-invitacion/${inv.qr_token}" style="display:inline-block;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Ver mi invitación</a></div>
  </div>` : ''}
  <div style="border-top:1px solid #27272a;padding-top:16px;text-align:center;color:#71717a;font-size:12px;">© 2026 PickEvent</div>
</div></body></html>`;
      const { error } = await resend.emails.send({
        from: 'PickEvent <noreply@pickevent.site>', to: [inv.email], subject: asunto.trim(), html,
      });
      if (error) { console.error('Resend', inv.email, error); fallidos.push(inv.email); } else enviados++;
      await new Promise((r) => setTimeout(r, 550)); // respeta límite de Resend (2/s)
    }

    return json({ success: true, enviados, fallidos });
  } catch (e) {
    console.error('notificar-cambio-fecha', e);
    return json({ error: e instanceof Error ? e.message : 'Error' }, 500);
  }
});
