/**
 * Renderiza el certificado como un componente React.
 * Es la única fuente de verdad visual: lo que se ve en preview es lo que va al PDF.
 */
import React from 'react';
import type { Certificado } from '@/hooks/useCertificados';
import { renderTexto } from '@/hooks/useCertificados';
import QRCode from 'qrcode.react';

interface Props {
  cert: Certificado;
  nombre: string;
  evento: string;
  fecha: string;
  codigo?: string;
  verifyUrl?: string;
}

const FONT_FAMILY: Record<string, string> = {
  sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  serif: '"Times New Roman", Georgia, serif',
  script: '"Brush Script MT", "Lucida Handwriting", cursive',
  mixta: '"Georgia", serif',
};

export const CertificadoPreview = React.forwardRef<HTMLDivElement, Props>(
  ({ cert, nombre, evento, fecha, codigo, verifyUrl }, ref) => {
    const horizontal = cert.orientacion === 'horizontal';
    // Tamaño base: A4 a 96dpi
    const width = horizontal ? 1123 : 794;
    const height = horizontal ? 794 : 1123;
    const scale = horizontal ? 0.6 : 0.55; // para preview

    const texto = renderTexto(cert.texto_principal, { nombre, evento, fecha, lugar: cert.lugar || '', organizador: cert.organizador || '' });
    const fontFamily = FONT_FAMILY[cert.tipografia] || FONT_FAMILY.sans;

    return (
      <div className="flex justify-center w-full overflow-hidden">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            width,
            height,
            marginBottom: -(height * (1 - scale)),
          }}
        >
          <div
            ref={ref}
            style={{
              width,
              height,
              fontFamily,
              background: cert.fondo_url
                ? `url(${cert.fondo_url}) center/cover`
                : `linear-gradient(135deg, #fafafa 0%, #ffffff 100%)`,
              position: 'relative',
              color: '#1a1a1a',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            {/* Bordes decorativos */}
            <div
              style={{
                position: 'absolute',
                inset: 24,
                border: `2px solid ${cert.color_primario}`,
                borderRadius: 8,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 36,
                border: `1px solid ${cert.color_secundario}66`,
                borderRadius: 4,
                pointerEvents: 'none',
              }}
            />

            {/* Banda superior de color */}
            <div
              style={{
                position: 'absolute',
                top: 36,
                left: 36,
                right: 36,
                height: 8,
                background: `linear-gradient(90deg, ${cert.color_primario}, ${cert.color_secundario})`,
                borderRadius: 4,
              }}
            />

            {/* Contenido */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                padding: horizontal ? '90px 100px 70px' : '110px 80px 90px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {/* Logos */}
              {(cert.logo_principal_url || cert.logo_secundario_url) && (
                <div style={{ display: 'flex', gap: 32, alignItems: 'center', marginBottom: 16 }}>
                  {cert.logo_principal_url && (
                    <img src={cert.logo_principal_url} alt="logo" crossOrigin="anonymous" style={{ maxHeight: 70, maxWidth: 200, objectFit: 'contain' }} />
                  )}
                  {cert.logo_secundario_url && (
                    <img src={cert.logo_secundario_url} alt="logo 2" crossOrigin="anonymous" style={{ maxHeight: 70, maxWidth: 200, objectFit: 'contain' }} />
                  )}
                </div>
              )}

              {/* Título */}
              <div
                style={{
                  fontSize: horizontal ? 42 : 38,
                  fontWeight: 700,
                  color: cert.color_primario,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                {cert.titulo}
              </div>
              <div
                style={{
                  width: 80,
                  height: 3,
                  background: cert.color_secundario,
                  marginBottom: 28,
                }}
              />

              {/* Nombre destacado */}
              <div style={{ fontSize: 18, color: '#525252', marginBottom: 4 }}>Otorgado a</div>
              <div
                style={{
                  fontSize: horizontal ? 56 : 48,
                  fontWeight: 700,
                  color: '#1a1a1a',
                  fontStyle: cert.tipografia === 'script' || cert.tipografia === 'mixta' ? 'italic' : 'normal',
                  marginBottom: 24,
                  lineHeight: 1.1,
                  maxWidth: '90%',
                }}
              >
                {nombre || 'Nombre del Participante'}
              </div>

              {/* Texto principal */}
              <div
                style={{
                  fontSize: 18,
                  lineHeight: 1.6,
                  color: '#404040',
                  maxWidth: horizontal ? 800 : 600,
                  marginBottom: 16,
                }}
              >
                {texto}
              </div>

              {cert.texto_secundario && (
                <div style={{ fontSize: 14, color: '#737373', maxWidth: 700, marginBottom: 16 }}>
                  {cert.texto_secundario}
                </div>
              )}

              {/* Firmas + QR */}
              <div
                style={{
                  marginTop: 'auto',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-around',
                  alignItems: 'flex-end',
                  gap: 24,
                }}
              >
                {cert.firmas.slice(0, 2).map((f, idx) => (
                  <div key={idx} style={{ textAlign: 'center', minWidth: 180 }}>
                    {f.imagen_url ? (
                      <img src={f.imagen_url} alt="firma" crossOrigin="anonymous" style={{ maxHeight: 60, maxWidth: 180, objectFit: 'contain', marginBottom: 4 }} />
                    ) : (
                      <div style={{ height: 60 }} />
                    )}
                    <div style={{ borderTop: '1px solid #525252', paddingTop: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{f.nombre}</div>
                      <div style={{ fontSize: 12, color: '#737373' }}>{f.cargo}</div>
                    </div>
                  </div>
                ))}

                {codigo && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ background: '#fff', padding: 6, display: 'inline-block', borderRadius: 4 }}>
                      <QRCode value={verifyUrl || codigo} size={80} level="M" />
                    </div>
                    <div style={{ fontSize: 10, color: '#737373', marginTop: 4 }}>
                      Código: <strong>{codigo}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CertificadoPreview.displayName = 'CertificadoPreview';
