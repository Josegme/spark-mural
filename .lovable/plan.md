# Tarjeta digital para invitaciones

Agregar una imagen opcional ("tarjeta digital") que el organizador sube y que se muestra como hero visual en la página pública de la invitación, en 3 formatos estándar.

## Formatos
- **Post (1:1)** — feed Instagram
- **Historia/Reel (9:16)** — stories, WhatsApp status
- **Horizontal (16:9)** — banner web

## Cambios

### 1. Base de datos (migración)
Agregar a `eventos`:
- `invitacion_tarjeta_url` (text, nullable)
- `invitacion_tarjeta_formato` (text, nullable) — valores: `post`, `historia`, `horizontal`

### 2. Storage
- Crear bucket público `invitacion-tarjetas`
- Policies: SELECT público; INSERT/UPDATE/DELETE solo si el path empieza con un `evento_id` del cual `auth.uid()` es `cliente_user_id` (o super admin)
- Validaciones en cliente: máx 5 MB, tipos `image/png|jpeg|webp`

### 3. RPC pública
Extender `get_invitacion_evento_by_token` para devolver:
- `tarjeta_url`
- `tarjeta_formato`

### 4. UI — `InvitacionesPanel.tsx`
Nueva sección "Tarjeta digital (opcional)" dentro del bloque activo:
- 3 chips selectores de formato con preview del aspect ratio
- Botón "Subir imagen" → upload directo a Storage
- Preview en el aspect ratio elegido
- Botón "Quitar tarjeta"
- Texto guía con dimensiones recomendadas (1080×1080 / 1080×1920 / 1200×675)

### 5. Página pública — `InvitacionPublicaPage.tsx`
Si hay tarjeta, mostrarla arriba del card de RSVP:
- `aspect-square` / `aspect-[9/16]` / `aspect-video` según formato
- `max-w-sm` para historia (no ocupa toda la pantalla en desktop), `max-w-md` para post, `max-w-2xl` para horizontal
- Bordes redondeados, sombra suave, respeta el banner de color existente
- `loading="eager"` para que aparezca rápido
- `alt` descriptivo con nombre del evento

### 6. Hook `useInvitaciones`
- Extender `InvitacionEventoPublico` con `tarjeta_url` y `tarjeta_formato`
- Extender `useActivarInvitaciones` payload con los dos campos nuevos
- Nuevo helper `uploadTarjetaInvitacion(eventoId, file)` que sube a Storage y devuelve URL pública

## Fuera de scope (futuro)
- Editor/canvas para crear la tarjeta dentro de la app
- Plantillas auto-generadas
- Incluir la tarjeta en el mail de confirmación (se puede agregar fácil después)

## Diagrama de flujo

```text
Organizador → Panel → elige formato → sube imagen
   → Storage (invitacion-tarjetas/{evento_id}/{uuid}.ext)
   → UPDATE eventos.invitacion_tarjeta_url + _formato

Invitado → /invitacion/:token
   → RPC get_invitacion_evento_by_token (incluye tarjeta)
   → Render hero con aspect ratio correcto + form RSVP
```
