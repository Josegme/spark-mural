import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = Deno.env.get('APP_BASE_URL') || 'https://pickevent.site';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { certificado_emitido_id, pdf_base64, email_to } = body;

    if (!certificado_emitido_id || !pdf_base64) {
      return new Response(JSON.stringify({ error: 'certificado_emitido_id y pdf_base64 requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Cargar certificado emitido + plantilla + evento
    const { data: emit, error: emitErr } = await supabase
      .from('certificados_emitidos')
      .select('id, evento_id, codigo_verificacion, nombre_destinatario, email_destinatario, certificado_id')
      .eq('id', certificado_emitido_id)
      .single();

    if (emitErr || !emit) {
      return new Response(JSON.stringify({ error: 'Certificado emitido no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const recipient = email_to || emit.email_destinatario;

    // Subir PDF a storage
    const pdfBytes = Uint8Array.from(atob(pdf_base64), c => c.charCodeAt(0));
    const path = `pdfs/${emit.evento_id}/${emit.codigo_verificacion}.pdf`;
    const { error: upErr } = await supabase.storage
      .from('certificados')
      .upload(path, pdfBytes, { contentType: 'application/pdf', upsert: true });

    if (upErr) {
      console.error('Storage upload error:', upErr);
    }

    const { data: pubData } = supabase.storage.from('certificados').getPublicUrl(path);
    const pdfUrl = pubData.publicUrl;

    // Cargar datos del certificado y evento para el email
    const { data: cert } = await supabase
      .from('certificados')
      .select('titulo, color_primario, color_secundario')
      .eq('id', emit.certificado_id)
      .single();

    const { data: ev } = await supabase
      .from('eventos')
      .select('nombre, color_banner, logo_url')
      .eq('id', emit.evento_id)
      .single();

    const verifyUrl = `${BASE_URL}/certificado/${emit.codigo_verificacion}`;
    const color = cert?.color_primario || ev?.color_banner || '#4c1d95';
    const titulo = cert?.titulo || 'Tu certificado';
    const eventoNombre = ev?.nombre || 'el evento';

    let emailId: string | null = null;
    if (recipient) {
      const resend = new Resend(resendKey);
      const { data: result, error: emailError } = await resend.emails.send({
        from: 'PickEvent <noreply@pickevent.site>',
        to: [recipient],
        subject: `🎓 ${titulo} — ${eventoNombre}`,
        html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#0a0a0a;color:#fff;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="font-size:28px;margin:0;background:linear-gradient(135deg,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">PickEvent</h1>
    </div>
    <div style="background:linear-gradient(135deg,${color},${color}cc);border-radius:16px;padding:32px 20px;text-align:center;margin-bottom:24px;">
      ${ev?.logo_url ? `<img src="${ev.logo_url}" alt="${eventoNombre}" style="max-height:80px;margin-bottom:12px;">` : ''}
      <h2 style="margin:0;font-size:24px;color:#fff;">${titulo}</h2>
      <p style="margin:8px 0 0 0;color:rgba(255,255,255,.85);font-size:14px;">${eventoNombre}</p>
    </div>
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
      <h3 style="margin:0 0 8px 0;color:#fff;font-size:20px;">Hola, ${emit.nombre_destinatario}</h3>
      <p style="margin:0 0 16px 0;color:#a1a1aa;font-size:14px;">Adjuntamos tu certificado en formato PDF. También podés verificarlo o descargarlo desde el siguiente link:</p>
      <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,${color},${color}99);color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;">Verificar certificado</a>
      <p style="margin:16px 0 0 0;color:#71717a;font-size:12px;">Código: <strong>${emit.codigo_verificacion}</strong></p>
    </div>
    <p style="text-align:center;color:#71717a;font-size:12px;margin:0;">Gracias por participar.</p>
    <div style="border-top:1px solid #27272a;margin-top:24px;padding-top:16px;text-align:center;color:#71717a;font-size:12px;">© 2026 PickEvent</div>
  </div>
</body></html>`,
        attachments: [
          {
            filename: `certificado-${emit.nombre_destinatario.replace(/\s+/g, '_')}.pdf`,
            content: pdf_base64,
          },
        ],
      });

      if (emailError) {
        console.error('Resend error:', emailError);
        return new Response(JSON.stringify({ error: 'Failed to send', details: emailError, pdf_url: pdfUrl }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      emailId = result?.id || null;
    }

    // Actualizar registro
    await supabase
      .from('certificados_emitidos')
      .update({
        pdf_url: pdfUrl,
        enviado_email: !!recipient,
        enviado_at: recipient ? new Date().toISOString() : null,
      })
      .eq('id', emit.id);

    return new Response(JSON.stringify({ success: true, emailId, pdf_url: pdfUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('enviar-certificado error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
