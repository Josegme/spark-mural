/**
 * Renderiza el certificado como un componente React.
 * Es la única fuente de verdad visual: lo que se ve en preview es lo que va al PDF.
 * Soporta 3 plantillas: moderna, clasica, festiva.
 */
import React from 'react';
import type { Certificado } from '@/hooks/useCertificados';
import { renderTexto } from '@/hooks/useCertificados';
import { QRCodeSVG } from 'qrcode.react';

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
  script: '"Segoe Script", "Lucida Handwriting", "Brush Script MT", cursive',
  mixta: '"Georgia", serif',
};

const fitTextSize = (text: string, base: number, maxChars: number, min = 24) => {
  const length = text.trim().length;
  if (length <= maxChars) return base;
  return Math.max(min, Math.round(base * (maxChars / length)));
};

export const CertificadoPreview = React.forwardRef<HTMLDivElement, Props>(
  ({ cert, nombre, evento, fecha, codigo, verifyUrl }, ref) => {
    const horizontal = cert.orientacion === 'horizontal';
    const width = horizontal ? 1123 : 794;
    const height = horizontal ? 794 : 1123;
    const scale = horizontal ? 0.6 : 0.55;

    const texto = renderTexto(cert.texto_principal, {
      nombre,
      evento,
      fecha,
      lugar: cert.lugar || '',
      organizador: cert.organizador || '',
    });
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
              position: 'relative',
              color: '#1a1a1a',
              boxSizing: 'border-box',
              overflow: 'hidden',
              background: '#ffffff',
            }}
          >
            {cert.fondo_url && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `url(${cert.fondo_url}) center/cover`,
                  opacity: cert.fondo_opacidad ?? 0.3,
                  pointerEvents: 'none',
                }}
              />
            )}
            {cert.plantilla === 'clasica' && (
              <PlantillaClasica
                cert={cert}
                nombre={nombre}
                texto={texto}
                horizontal={horizontal}
                codigo={codigo}
                verifyUrl={verifyUrl}
              />
            )}
            {cert.plantilla === 'festiva' && (
              <PlantillaFestiva
                cert={cert}
                nombre={nombre}
                texto={texto}
                horizontal={horizontal}
                codigo={codigo}
                verifyUrl={verifyUrl}
              />
            )}
            {(!cert.plantilla || cert.plantilla === 'moderna') && (
              <PlantillaModerna
                cert={cert}
                nombre={nombre}
                texto={texto}
                horizontal={horizontal}
                codigo={codigo}
                verifyUrl={verifyUrl}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
);

CertificadoPreview.displayName = 'CertificadoPreview';

interface PlantillaProps {
  cert: Certificado;
  nombre: string;
  texto: string;
  horizontal: boolean;
  codigo?: string;
  verifyUrl?: string;
}

/* =================== MODERNA =================== */
function PlantillaModerna({ cert, nombre, texto, horizontal, codigo, verifyUrl }: PlantillaProps) {
  return (
    <>
      {!cert.fondo_url && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 24,
          border: `2px solid ${cert.color_primario}`,
          borderRadius: 8,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 36,
          border: `1px solid ${cert.color_secundario}66`,
          borderRadius: 4,
        }}
      />
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
      <ContentBlock
        cert={cert}
        nombre={nombre}
        texto={texto}
        horizontal={horizontal}
        codigo={codigo}
        verifyUrl={verifyUrl}
        titleStyle={{
          fontSize: horizontal ? 42 : 38,
          fontWeight: 700,
          color: cert.color_primario,
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
        nameStyle={{ fontStyle: cert.tipografia === 'script' || cert.tipografia === 'mixta' ? 'italic' : 'normal' }}
      />
    </>
  );
}

/* =================== CLÁSICA =================== */
function PlantillaClasica({ cert, nombre, texto, horizontal, codigo, verifyUrl }: PlantillaProps) {
  const corner = (rotate: string) => (
    <div
      style={{
        position: 'absolute',
        width: 110,
        height: 110,
        transform: rotate,
        border: `3px double ${cert.color_primario}`,
        borderRight: 'none',
        borderBottom: 'none',
      }}
    />
  );
  return (
    <>
      {!cert.fondo_url && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, #fffaf0 0%, #f5ecd9 100%)`,
          }}
        />
      )}
      {/* Doble marco ornamental */}
      <div
        style={{
          position: 'absolute',
          inset: 30,
          border: `4px double ${cert.color_primario}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 50,
          border: `1px solid ${cert.color_primario}99`,
        }}
      />
      {/* Esquinas decorativas */}
      <div style={{ position: 'absolute', top: 60, left: 60 }}>{corner('rotate(0deg)')}</div>
      <div style={{ position: 'absolute', top: 60, right: 60 }}>{corner('rotate(90deg)')}</div>
      <div style={{ position: 'absolute', bottom: 60, right: 60 }}>{corner('rotate(180deg)')}</div>
      <div style={{ position: 'absolute', bottom: 60, left: 60 }}>{corner('rotate(270deg)')}</div>
      {/* Medallón superior */}
      <div
        style={{
          position: 'absolute',
          top: horizontal ? 70 : 90,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${cert.color_primario}, ${cert.color_secundario})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 28,
          boxShadow: `0 0 0 4px #fffaf0, 0 0 0 6px ${cert.color_primario}`,
        }}
      >
        ★
      </div>
      <ContentBlock
        cert={cert}
        nombre={nombre}
        texto={texto}
        horizontal={horizontal}
        codigo={codigo}
        verifyUrl={verifyUrl}
        padding={horizontal ? '160px 120px 90px' : '180px 100px 110px'}
        titleStyle={{
          fontFamily: '"Times New Roman", Georgia, serif',
          fontSize: horizontal ? 46 : 40,
          fontWeight: 700,
          color: cert.color_primario,
          letterSpacing: 4,
          textTransform: 'uppercase',
          fontVariant: 'small-caps',
        }}
        nameStyle={{
          fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive',
          fontStyle: 'italic',
          fontSize: horizontal ? 72 : 60,
        }}
        textStyle={{ fontFamily: '"Times New Roman", Georgia, serif', fontSize: 19 }}
      />
    </>
  );
}

/* =================== FESTIVA =================== */
function PlantillaFestiva({ cert, nombre, texto, horizontal, codigo, verifyUrl }: PlantillaProps) {
  return (
    <>
      {!cert.fondo_url && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${cert.color_primario}15 0%, ${cert.color_secundario}15 100%)`,
          }}
        />
      )}
      {/* Confeti decorativo */}
      {[
        { top: 40, left: 60, size: 14, color: cert.color_primario, rot: 25 },
        { top: 80, left: 200, size: 10, color: cert.color_secundario, rot: -15 },
        { top: 50, right: 100, size: 16, color: cert.color_secundario, rot: 45 },
        { top: 120, right: 220, size: 8, color: cert.color_primario, rot: 0 },
        { bottom: 60, left: 90, size: 12, color: cert.color_secundario, rot: 30 },
        { bottom: 100, left: 240, size: 9, color: cert.color_primario, rot: -25 },
        { bottom: 50, right: 130, size: 14, color: cert.color_primario, rot: 60 },
        { bottom: 130, right: 60, size: 11, color: cert.color_secundario, rot: -40 },
      ].map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: c.top,
            left: c.left,
            right: c.right,
            bottom: c.bottom,
            width: c.size,
            height: c.size,
            background: c.color,
            transform: `rotate(${c.rot}deg)`,
            borderRadius: i % 3 === 0 ? '50%' : '2px',
            opacity: 0.8,
          }}
        />
      ))}
      {/* Arco superior */}
      <div
        style={{
          position: 'absolute',
          top: -100,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 200,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${cert.color_primario}, ${cert.color_secundario})`,
        }}
      />
      {/* Onda inferior */}
      <div
        style={{
          position: 'absolute',
          bottom: -80,
          left: -50,
          right: -50,
          height: 180,
          borderRadius: '50% 50% 0 0',
          background: `linear-gradient(135deg, ${cert.color_secundario}, ${cert.color_primario})`,
          opacity: 0.85,
        }}
      />
      <ContentBlock
        cert={cert}
        nombre={nombre}
        texto={texto}
        horizontal={horizontal}
        codigo={codigo}
        verifyUrl={verifyUrl}
        padding={horizontal ? '110px 100px 100px' : '130px 80px 120px'}
        titleStyle={{
          fontSize: horizontal ? 48 : 42,
          fontWeight: 800,
          color: cert.color_primario,
          letterSpacing: 1,
        }}
        nameStyle={{
          fontStyle: 'italic',
          color: cert.color_primario,
          fontSize: horizontal ? 60 : 52,
        }}
      />
    </>
  );
}

/* =================== Bloque común de contenido =================== */
function ContentBlock({
  cert,
  nombre,
  texto,
  horizontal,
  codigo,
  verifyUrl,
  padding,
  titleStyle,
  nameStyle,
  textStyle,
}: PlantillaProps & {
  padding?: string;
  titleStyle?: React.CSSProperties;
  nameStyle?: React.CSSProperties;
  textStyle?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: padding || (horizontal ? '90px 100px 70px' : '110px 80px 90px'),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {(cert.logo_principal_url || cert.logo_secundario_url) && (
        <div style={{ display: 'flex', gap: 32, alignItems: 'center', marginBottom: 16 }}>
          {cert.logo_principal_url && (
            <img
              src={cert.logo_principal_url}
              alt="logo"
              crossOrigin="anonymous"
              style={{ maxHeight: 70, maxWidth: 200, objectFit: 'contain' }}
            />
          )}
          {cert.logo_secundario_url && (
            <img
              src={cert.logo_secundario_url}
              alt="logo 2"
              crossOrigin="anonymous"
              style={{ maxHeight: 70, maxWidth: 200, objectFit: 'contain' }}
            />
          )}
        </div>
      )}

      <div style={{ marginBottom: 8, ...titleStyle }}>{cert.titulo}</div>
      <div
        style={{
          width: 80,
          height: 3,
          background: cert.color_secundario,
          marginBottom: 28,
        }}
      />

      <div style={{ fontSize: 18, color: '#525252', marginBottom: 4 }}>Otorgado a</div>
      <div
        style={{
          fontSize: horizontal ? 56 : 48,
          fontWeight: 700,
          color: '#1a1a1a',
          marginBottom: 24,
          lineHeight: 1.1,
          maxWidth: '90%',
          ...nameStyle,
        }}
      >
        {nombre || 'Nombre del Participante'}
      </div>

      <div
        style={{
          fontSize: 18,
          lineHeight: 1.6,
          color: '#404040',
          maxWidth: horizontal ? 800 : 600,
          marginBottom: 16,
          ...textStyle,
        }}
      >
        {texto}
      </div>

      {cert.texto_secundario && (
        <div style={{ fontSize: 14, color: '#737373', maxWidth: 700, marginBottom: 16 }}>
          {cert.texto_secundario}
        </div>
      )}

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
              <img
                src={f.imagen_url}
                alt="firma"
                crossOrigin="anonymous"
                style={{ maxHeight: 60, maxWidth: 180, objectFit: 'contain', marginBottom: 4 }}
              />
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
              <QRCodeSVG value={verifyUrl || codigo} size={80} level="M" />
            </div>
            <div style={{ fontSize: 10, color: '#737373', marginTop: 4 }}>
              Código: <strong>{codigo}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
