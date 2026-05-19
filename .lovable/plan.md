
# Plan: Cerrar MVP de Certificados

Buena noticia: revisando el código actual, algunas piezas del "qué falta" ya están hechas parcialmente (UI de firmas, logo secundario, fondo, badge "Enviado"). Este plan completa lo que realmente queda para dejar el módulo listo para producción.

## Estado actual (verificado en código)

| Pieza | Estado |
|---|---|
| QR de verificación en el PDF | ❌ No se renderiza (la página `/certificado/:codigo` existe pero el PDF no la referencia visualmente) |
| Editor de firmas (hasta 2, con upload PNG) | ✅ Ya implementado en `CertificadoEditor.tsx` |
| Upload de logo secundario y fondo | ✅ Ya implementado (campos `FileField`) |
| Variables `{lugar}` y `{organizador}` | ✅ Soportadas en `renderTexto` y editables |
| Badge "Enviado" en lista | ✅ Existe, pero falta fecha y botón "Reenviar" explícito |
| Template de email | ⚠️ Existe pero es básico, sin imagen del certificado ni link de descarga claro |

Por lo tanto el plan se concentra en **4 entregables** concretos.

---

## 1. QR de verificación impreso en el PDF

**Objetivo:** que cada certificado lleve el QR que apunta a `/certificado/{codigo}` para validar autenticidad escaneando.

**Implementación:**
- Reutilizar la librería QR que ya usa el proyecto (`qrcode` o `qrcode.react` — verificar cuál está instalada en `package.json` y usar esa, no agregar otra).
- En `CertificadoPreview.tsx`, agregar en cada una de las 3 plantillas (moderna, clasica, festiva) un slot fijo en la esquina inferior derecha con:
  - QR (≈70×70 px) generado a partir de `verifyUrl`
  - Debajo: texto chico `Código: {codigo}` y `Verificá en pickevent.site/certificado/{codigo}`
- Asegurar que el QR se renderice como `<canvas>` o `<svg>` inline para que `html2canvas` lo capture sin problema.
- Ajustar las "safe zones" de cada plantilla para que el contenido principal no se pise con el bloque QR.

**Archivos:** `src/components/certificados/CertificadoPreview.tsx` únicamente.

---

## 2. Mejorar UX de firmas y fondo (pulir lo existente)

Lo grueso ya está. Falta pulir:

- **Validar dimensiones de firma**: hoy se acepta cualquier PNG, mostrar warning si supera 800px de alto (queda gigante en el PDF). Solo aviso visual, no bloqueante.
- **Preview de la firma en el editor**: ya se muestra el thumbnail genérico — agregar fondo cuadriculado tipo Photoshop para distinguir transparencia real vs blanco opaco (ayuda al usuario a saber si subió el PNG correcto).
- **Cuando hay fondo personalizado**: agregar un slider de "opacidad del fondo" (0–100%) para que el texto se lea bien. Guardarlo como `fondo_opacidad` en el JSON de `colores` (sin cambiar schema; usar el jsonb que ya existe) o agregar columna `fondo_opacidad numeric default 0.3`.
- **Botón "Restablecer a valores por defecto"** en el editor (resetea al `DEFAULT` del preset elegido).

**Decisión a confirmar con vos:** ¿agregamos la columna `fondo_opacidad` (migración chica) o lo metemos dentro del campo `colores` jsonb que ya existe?

**Archivos:** `CertificadoEditor.tsx`, `CertificadoPreview.tsx`, posible migración mínima.

---

## 3. Estado de envío + Reenviar

**Objetivo:** que el organizador vea claramente quién ya recibió el certificado y pueda reenviar uno puntual.

**Implementación en `EmisionList.tsx`:**
- Badge "Enviado" ya existe → agregarle tooltip con fecha (`enviado_at` formateado: "hace 3h" o "12 nov 14:30").
- Botón **"Reenviar"** (icono `RotateCw`) visible solo si `emitido?.enviado_email === true`. Reusa la misma función `handleEmit(..., 'email')` que ya regenera y reenvía.
- Mostrar el **código de verificación** debajo del nombre cuando ya está emitido, con un botón "Copiar link" que copia `https://pickevent.site/certificado/{codigo}` al portapapeles.
- En el resumen de la card (`Confirmados X · Asistieron Y · Emitidos Z`): agregar `Enviados W` calculado de `emitidos.filter(e => e.enviado_email).length`.
- En el envío masivo, al terminar mostrar resumen detallado con lista de errores (los nombres que fallaron) en un toast extendido o pequeño dialog.

**Archivos:** `EmisionList.tsx` únicamente.

---

## 4. Template de email decente

**Objetivo:** mail profesional, con preview visual del certificado y link de descarga claro (no solo adjunto).

**Implementación en `supabase/functions/enviar-certificado/index.ts`:**

Mejoras al HTML actual:
- **Imagen de preview del certificado**: usar el primer fotograma del PDF como `<img>` thumbnail al inicio del mail. Solución simple: en el edge function, ya tenemos `pdf_base64` → generar un JPG thumbnail (libreria `pdf-lib` o `pdfjs` en Deno es pesada; alternativa más fácil: que el cliente envíe también la imagen JPG del certificado renderizada por html2canvas — ya la tenemos antes de meterla al PDF). Agregar parámetro opcional `thumbnail_base64` al body del edge function. Subirlo a storage como `thumbnails/{evento_id}/{codigo}.jpg` y embeberlo con `<img src="{publicUrl}">` en el mail.
- **Dos CTAs claros**: `[Descargar PDF]` (link a `pdf_url` en storage) y `[Verificar autenticidad]` (link a `/certificado/{codigo}`).
- **Cuerpo del mail rediseñado** con paleta del evento (`color_banner` del evento + `color_primario` del certificado), tipografía pulida, footer con logo PickEvent + "Este certificado tiene validez verificable online".
- **Subject mejorado**: `🎓 {nombre_destinatario}, tu {titulo} de {evento_nombre} está listo`.
- **Mantener** el PDF adjunto (algunos usuarios lo guardan directo del mail).
- **Texto plano alternativo**: agregar `text:` además de `html:` en el call a Resend para evitar caer en spam.

**Archivos:** `supabase/functions/enviar-certificado/index.ts` + ajuste mínimo en `EmisionList.tsx` y `CertificadoEditor.tsx` para enviar el `thumbnail_base64` (extraído del mismo canvas que ya genera html2canvas, antes de convertirlo a PDF).

---

## Orden de implementación sugerido

1. **QR en PDF** (entregable #1) — autocontenido, alto impacto visual.
2. **Estado de envío + Reenviar** (entregable #3) — UI puro, sin backend.
3. **Template de email** (entregable #4) — backend + ajuste cliente para mandar el thumbnail.
4. **Pulido de firmas/fondo** (entregable #2) — el más cosmético, lo dejamos para el final.

Todo entra en un solo sprint. No requiere cambios destructivos al schema (solo eventualmente la columna `fondo_opacidad` que es opcional).

---

## Lo que NO incluye este plan (lo dejamos para Fase 3)

- Generación masiva server-side (Puppeteer en edge) — esperamos a tener evento real con >100 invitados.
- Cache de PDFs en storage para no regenerar.
- Métricas de admin (cuántos certificados generados/enviados por tenant).
- Feature flag por tenant y cobro como add-on (Fase 3 cuando lo monetices).

---

## Pregunta única antes de implementar

¿Va bien el orden 1→2→3→4? ¿O preferís que arranque por el template de email primero (#4) porque ya estás a punto de probarlo con un evento real?
