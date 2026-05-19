import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = Deno.env.get('APP_BASE_URL') || 'https://pickevent.site';

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { certificado_emitido_id, pdf_base64, email_to, thumbnail_base64 } = body;

    if (!certificado_emitido_id || !pdf_base64) {
      return new Response(JSON.stringify({ error: 'certificado_emitido_id y pdf_base64 requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

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
    const pdfPath = `pdfs/${emit.evento_id}/${emit.codigo_verificacion}.pdf`;
    const { error: upErr } = await supabase.storage
      .from('certificados')
      .upload(pdfPath, pdfBytes, { contentType: 'application/pdf', upsert: true });
    if (upErr) console.error('PDF upload error:', upErr);

    const { data: pubPdf } = supabase.storage.from('certificados').getPublicUrl(pdfPath);
    const pdfUrl = pubPdf.publicUrl;

    // Subir thumbnail si vino
    let thumbnailUrl: string | null = null;
    if (thumbnail_base64) {
      try {
        const thumbBytes = Uint8Array.from(atob(thumbnail_base64), c => c.charCodeAt(0));
        const thumbPath = `thumbnails/${emit.evento_id}/${emit.codigo_verificacion}.jpg`;
        const { error: thumbErr } = await supabase.storage
          .from('certificados')
          .upload(thumbPath, thumbBytes, { contentType: 'image/jpeg', upsert: true });
        if (!thumbErr) {
          const { data: pubThumb } = supabase.storage.from('certificados').getPublicUrl(thumbPath);
          thumbnailUrl = pubThumb.publicUrl;
        } else {
          console.error('Thumbnail upload error:', thumbErr);
        }
      } catch (e) {
        console.error('Thumbnail decode error:', e);
      }
    }

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
    const color2 = cert?.color_secundario || '#ec4899';
    const titulo = cert?.titulo || 'Tu certificado';
    const eventoNombre = ev?.nombre || 'el evento';
    const safeNombre = escapeHtml(emit.nombre_destinatario);
    const safeTitulo = escapeHtml(titulo);
    const safeEvento = escapeHtml(eventoNombre);

    let emailId: string | null = null;
    if (recipient) {
      const resend = new Resend(resendKey);

      const subject = `🎓 ${emit.nombre_destinatario}, tu ${titulo} de ${eventoNombre} está listo`;

      const textAlt = `Hola ${emit.nombre_destinatario},

Tu ${titulo} por ${eventoNombre} ya está disponible.

Descargar PDF: ${pdfUrl}
Verificar autenticidad: ${verifyUrl}
Código de verificación: ${emit.codigo_verificacion}

Gracias por participar.
— PickEvent`;

      const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18181b;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;">
    <!-- Header con color del evento -->
    <div style="background:linear-gradient(135deg,${color},${color2});padding:32px 24px;text-align:center;">
      ${ev?.logo_url ? `<img src="${ev.logo_url}" alt="${safeEvento}" style="max-height:64px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;">` : ''}
      <h1 style="margin:0;font-size:24px;color:#ffffff;font-weight:700;">${safeTitulo}</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.92);font-size:14px;">${safeEvento}</p>
    </div>

    <!-- Saludo -->
    <div style="padding:32px 32px 16px;">
      <h2 style="margin:0 0 8px;font-size:22px;color:#18181b;">¡Hola, ${safeNombre}!</h2>
      <p style="margin:0;font-size:15px;line-height:1.6;color:#52525b;">
        Tu certificado ya está listo. Te lo enviamos adjunto en PDF y también podés descargarlo o verificar su autenticidad desde los botones de abajo.
      </p>
    </div>

    ${thumbnailUrl ? `
    <!-- Preview del certificado -->
    <div style="padding:8px 32px 24px;text-align:center;">
      <a href="${pdfUrl}" target="_blank" style="display:inline-block;text-decoration:none;">
        <img src="${thumbnailUrl}" alt="Vista previa del certificado" style="max-width:100%;width:100%;height:auto;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);border:1px solid #e4e4e7;">
      </a>
    </div>
    ` : ''}

    <!-- CTAs -->
    <div style="padding:0 32px 24px;text-align:center;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="padding:0 6px;">
            <a href="${pdfUrl}" target="_blank" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:600;font-size:14px;">
              📄 Descargar PDF
            </a>
          </td>
          <td style="padding:0 6px;">
            <a href="${verifyUrl}" target="_blank" style="display:inline-block;background:#ffffff;color:${color};border:2px solid ${color};text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;">
              ✓ Verificar autenticidad
            </a>
          </td>
        </tr>
      </table>
    </div>

    <!-- Bloque de verificación -->
    <div style="margin:0 32px 32px;padding:16px;background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Código de verificación</p>
      <p style="margin:0;font-size:20px;font-family:'SF Mono',Menlo,Monaco,Consolas,monospace;font-weight:700;color:${color};letter-spacing:2px;">
        ${emit.codigo_verificacion}
      </p>
      <p style="margin:8px 0 0;font-size:12px;color:#71717a;">
        Este certificado tiene validez verificable online.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #e4e4e7;padding:20px 32px;text-align:center;background:#fafafa;">
      <p style="margin:0 0 4px;font-size:13px;color:#52525b;">Gracias por participar 🙌</p>
      <p style="margin:0;font-size:11px;color:#a1a1aa;">
        Enviado por <a href="${BASE_URL}" style="color:#a1a1aa;text-decoration:none;font-weight:600;">PickEvent</a> · © ${new Date().getFullYear()}
      </p>
    </div>
  </div>
</body></html>`;

      const { data: result, error: emailError } = await resend.emails.send({
        from: 'PickEvent <noreply@pickevent.site>',
        to: [recipient],
        subject,
        html,
        text: textAlt,
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

    await supabase
      .from('certificados_emitidos')
      .update({
        pdf_url: pdfUrl,
        enviado_email: !!recipient,
        enviado_at: recipient ? new Date().toISOString() : null,
      })
      .eq('id', emit.id);

    return new Response(JSON.stringify({ success: true, emailId, pdf_url: pdfUrl, thumbnail_url: thumbnailUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('enviar-certificado error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
