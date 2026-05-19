# Módulo de Certificados Personalizables

Sistema para generar certificados (participación, asistencia, agradecimiento, diploma, etc.) por evento, con datos auto-completados del invitado y envío por email o descarga individual/masiva.

## Alcance del MVP

Se entrega como funcionalidad incluida (no add-on todavía) dentro del panel de cada evento, en una nueva pestaña **"Certificados"** dentro de `InvitacionesPanel` o como módulo hermano. Lo probás con eventos reales y luego lo convertimos en add-on con flag y cobro.

## Tipos de certificado soportados (presets)

El usuario elige un preset al crear el certificado, que define textos por defecto editables:
- **Participación** ("certifica que {nombre} participó en…")
- **Asistencia** ("certifica la asistencia de {nombre} a…")
- **Agradecimiento** ("agradecemos a {nombre} por acompañarnos en…")
- **Finalización de curso / Diploma** ("ha completado satisfactoriamente…")
- **Personalizado** (texto libre)

## Personalización disponible

Por cada certificado de evento, el organizador podrá configurar:

**Contenido**
- Título del certificado (ej. "Certificado de Participación")
- Nombre del evento/curso (autollenado desde `eventos.nombre`, editable)
- Texto principal con variables: `{nombre}`, `{evento}`, `{fecha}`, `{duracion}`, `{lugar}`, `{organizador}`
- Texto secundario / descripción (opcional)
- Fecha de emisión (auto o manual)
- Código de verificación único por certificado (UUID corto)

**Identidad visual**
- Logo principal (reutiliza `eventos.logo_url` o sube uno nuevo)
- Logo secundario opcional (auspiciante / institución)
- Firma digital (imagen PNG con transparencia) + nombre y cargo del firmante
- Hasta 2 firmas
- Color primario y secundario
- Fondo: plantilla predefinida (3-4 opciones) o imagen propia
- Orientación: horizontal (apaisado) o vertical
- Tipografía: 3-4 opciones (serif clásica, sans moderna, script elegante, mixta)

**Plantillas iniciales (MVP: 3)**
1. **Clásica** — bordes ornamentales, serif, ideal cursos/diplomas
2. **Moderna** — minimalista, sans-serif, ideal corporativos
3. **Festiva** — colorida, ideal cumpleaños/bodas/agradecimientos

## Flujo de uso

1. Organizador entra al evento → pestaña **Certificados**
2. Click "Crear certificado" → elige preset y plantilla
3. Configura textos, sube logos/firmas, ajusta colores
4. **Vista previa en vivo** con datos de un invitado real (o demo)
5. Define audiencia:
   - Todos los confirmados (`invitaciones.estado = 'confirmado'`)
   - Solo los que hicieron check-in (`checkins`)
   - Selección manual
6. Acciones disponibles:
   - **Descargar individual** (PDF de un invitado)
   - **Descargar todos** (ZIP con un PDF por invitado)
   - **Enviar por email** (a uno, a varios o a todos vía Resend)
   - Compartir link público de verificación (`/certificado/{codigo}`)

## Arquitectura técnica

```text
┌──────────────────────┐      ┌─────────────────────────┐
│ CertificadosPanel    │ ───► │ useCertificados (hook)  │
│ (UI configuración    │      └─────────────────────────┘
│  + preview en vivo)  │                 │
└──────────────────────┘                 ▼
            │                ┌─────────────────────────┐
            │                │ Supabase: certificados, │
            │                │ certificados_emitidos   │
            │                └─────────────────────────┘
            ▼                            │
┌──────────────────────┐                 ▼
│ Edge Function:       │      ┌─────────────────────────┐
│ generar-certificado  │ ───► │ Storage: certificados/  │
│ (HTML→PDF Puppeteer  │      │ (PDFs generados)        │
│  o pdf-lib)          │      └─────────────────────────┘
└──────────────────────┘                 │
            │                            ▼
            ▼                ┌─────────────────────────┐
┌──────────────────────┐     │ Edge Function:          │
│ Vista pública:       │     │ enviar-certificados     │
│ /certificado/:codigo │     │ (Resend, batch)         │
└──────────────────────┘     └─────────────────────────┘
```

### Tablas nuevas

**`certificados`** (plantilla configurada por evento)
- `evento_id`, `tipo` (preset), `plantilla` (clásica/moderna/festiva), `orientacion`
- `titulo`, `texto_principal`, `texto_secundario`
- `logo_principal_url`, `logo_secundario_url`
- `firmas` (jsonb: `[{nombre, cargo, imagen_url}]`)
- `colores` (jsonb), `tipografia`
- `fondo_url` (opcional), `activo` (bool)
- `created_at`, `updated_at`

**`certificados_emitidos`** (un registro por invitado/certificado emitido)
- `certificado_id`, `invitacion_id`, `evento_id`
- `nombre_destinatario`, `email_destinatario`
- `codigo_verificacion` (único, 8 chars)
- `pdf_url` (storage), `enviado_email` (bool), `enviado_at`
- `created_at`

### Storage
- Bucket nuevo `certificados` (público para PDFs y assets)
- Subcarpetas: `/firmas/`, `/logos/`, `/pdfs/{evento_id}/`

### Edge Functions
1. **`generar-certificado`** — recibe `certificado_id` + `invitacion_id[]`, renderiza HTML con variables reemplazadas, convierte a PDF (Puppeteer/Deno o `pdf-lib`), sube a storage, inserta en `certificados_emitidos`.
2. **`enviar-certificados`** — recibe lista de `certificados_emitidos.id`, genera lo que falte y envía email vía Resend con el PDF adjunto.

### RPC pública
- `get_certificado_by_codigo(_codigo text)` → devuelve datos públicos para verificación sin exponer email/teléfono.

### Frontend
- `src/components/certificados/CertificadosPanel.tsx` — panel principal en el evento
- `src/components/certificados/CertificadoEditor.tsx` — formulario + preview en vivo
- `src/components/certificados/CertificadoPreview.tsx` — renderiza el HTML/SVG del certificado (es lo mismo que renderiza el edge function)
- `src/components/certificados/plantillas/{Clasica,Moderna,Festiva}.tsx`
- `src/hooks/useCertificados.ts`
- `src/pages/CertificadoVerificacionPage.tsx` — ruta pública `/certificado/:codigo`

## Decisión clave: motor de PDF

Recomiendo **HTML + Puppeteer** en edge function porque:
- Misma plantilla React renderiza preview y PDF (single source of truth)
- Fácil iterar diseño con CSS
- Soporta fuentes web, gradientes, sombras

Alternativa más liviana: **pdf-lib** (sin Puppeteer) — más rápido y barato pero diseño limitado a posicionar texto/imágenes manualmente. Si el costo/latencia de Puppeteer molesta, migramos a pdf-lib en una fase posterior.

## Fases de implementación

**Fase 1 — MVP (este sprint)**
- Tablas + RLS + storage bucket
- 1 plantilla (Moderna) bien pulida
- Editor con preview en vivo
- Generación individual y descarga PDF
- Envío por email vía Resend (uno a uno)
- Página pública de verificación

**Fase 2 (siguiente sprint, si te gusta el MVP)**
- 2 plantillas adicionales (Clásica, Festiva)
- Generación masiva (ZIP) + envío masivo (batch)
- Selector de audiencia (solo check-in, manual)
- Variables avanzadas y fondo personalizado

**Fase 3 (cuando sea add-on)**
- Feature flag `certificados_enabled` por tenant/evento
- Cobro como add-on (precio en `configuracion_global`)
- Métricas: cuántos generados, cuántos enviados
- QR de verificación impreso en el PDF

## Riesgos y consideraciones

- **Peso de Puppeteer en edge**: arranque frío ~3-5s. Aceptable para generación on-demand; si hacemos batch grande, encolamos.
- **Fuentes**: usar fuentes self-hosted o Google Fonts permitidas, embeber en el HTML.
- **Email deliverability**: PDFs adjuntos pesados pueden ir a spam. Alternativa: enviar link de descarga.
- **Seguridad**: códigos de verificación deben ser impredecibles (`gen_random_uuid` truncado a 8 chars + chequeo de unicidad).
- **Privacidad**: la página pública de verificación muestra solo nombre + evento + fecha, nunca email/teléfono.

## Qué construyo si aprobás

Arrancamos directo con la **Fase 1** completa: migración + storage + edge function de generación + plantilla Moderna + editor con preview + descarga individual + envío 1-a-1 + página de verificación. Una vez que lo probás con un evento real, definimos Fase 2.

¿Querés que arranque así, o preferís ajustar alguna decisión antes (plantilla inicial distinta, motor pdf-lib en vez de Puppeteer, alcance reducido)?
