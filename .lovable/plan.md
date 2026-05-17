
# MVP — Invitaciones Digitales PickEvent

Servicio extra activable al crear el evento. Reutiliza patrones ya existentes: tokens públicos tipo `qr_*_token`, RPCs `SECURITY DEFINER` para acceso anónimo, extras pagos como los juegos.

---

## 1. Alcance del MVP (qué entra y qué NO)

**Entra:**
- Activación del extra "Invitaciones digitales" en el wizard de creación de eventos.
- Página pública de invitación (link/QR maestro) con RSVP.
- QR personal por invitado tras confirmar.
- Pantalla de check-in para el organizador (cámara del celular).
- Dashboard del organizador: contador confirmados / pendientes / ingresaron, lista exportable.

**NO entra (fase 2):**
- Apple/Google Wallet, mesas, segmentación por canal, recordatorios automáticos, lista de espera, modo offline.

---

## 2. Modelo de datos (3 tablas nuevas + extensión)

### `eventos` (extensión)
- `invitaciones_activas` (bool, default false)
- `invitaciones_cupo_maximo` (int, nullable) — null = sin límite
- `invitaciones_acompanantes_max` (int, default 0)
- `invitaciones_fecha_limite_rsvp` (timestamptz, nullable)
- `invitaciones_mensaje` (text, nullable) — copy custom de la invitación
- `qr_invitaciones_token` (text, único) — token maestro público
- `qr_checkin_token` (text, único) — token privado para modo recepción

### `invitaciones` (cada invitado individual)
- `id`, `evento_id`, `created_at`
- `nombre`, `email` (nullable), `telefono` (nullable)
- `qr_token` (text único, crypto random) — el QR personal
- `estado` enum: `pendiente` | `confirmado` | `rechazado`
- `acompanantes` (int, default 0)
- `restricciones` (text, nullable)
- `mensaje_anfitrion` (text, nullable)
- `confirmado_at` (timestamptz, nullable)
- `device_id` (text, nullable) — anti-duplicado por dispositivo

### `checkins`
- `id`, `invitacion_id`, `evento_id`
- `ingreso_at` (timestamptz, default now)
- `operador_user_id` (uuid, nullable)
- Unique constraint sobre `invitacion_id` → un solo check-in por QR.

---

## 3. RPCs públicos (patrón actual con PII enmascarada)

- `get_invitacion_evento_by_token(_token)` → datos públicos del evento (nombre, fecha, lugar, mensaje, color, logo, cupo restante). Sin PII de otros invitados.
- `crear_rsvp(_token, _nombre, _email, _telefono, _acompanantes, _restricciones, _mensaje, _device_id)` → inserta en `invitaciones`, devuelve `qr_token` personal. Valida cupo, fecha límite, no duplicado por device/email.
- `get_invitacion_personal(_qr_token)` → datos de una invitación específica para mostrar el QR (sin exponer otras).
- `validar_checkin(_checkin_token, _invitacion_qr_token, _operador_id)` → valida que el `_checkin_token` pertenece al evento, inserta en `checkins`, devuelve estado: `ok` | `ya_ingreso` | `invalido` | `cupo_excedido`.

Todas `SECURITY DEFINER`, sin `.select()` en INSERTs anónimos (regla de seguridad del proyecto).

---

## 4. RLS

- `invitaciones`: SELECT solo por dueño del evento, tenant, super_admin. INSERT anónimo bloqueado a nivel tabla — solo vía RPC `crear_rsvp`.
- `checkins`: SELECT solo por dueño/tenant/super_admin. INSERT solo vía RPC `validar_checkin`.
- Extensión `eventos`: hereda RLS existente.

---

## 5. Rutas nuevas

```text
/invitacion/:token          → Página pública de la invitación + RSVP
/mi-invitacion/:qr_token    → Vista del invitado con su QR personal
/checkin/:checkin_token     → Modo recepción (scanner cámara)
```

Más, dentro del dashboard del cliente:
```text
/dashboard/evento/:id/invitaciones   → Gestión: lista, contador, exportar CSV
```

---

## 6. Componentes nuevos

```text
src/pages/
  InvitacionPublicaPage.tsx       (RSVP)
  MiInvitacionPage.tsx            (QR personal)
  CheckinPage.tsx                 (scanner)

src/components/invitaciones/
  RSVPForm.tsx
  QRInvitacionPersonal.tsx
  CheckinScanner.tsx              (usa @zxing/browser o html5-qrcode)
  CheckinResultBadge.tsx          (ok/ya/inválido)
  InvitacionesPanel.tsx           (dashboard cliente)
  InvitacionesStats.tsx
  InvitacionesList.tsx
  InvitacionesShareModal.tsx      (link maestro + QR + plantilla WhatsApp)

src/components/events/wizard/
  StepInvitacionesExtra.tsx       (toggle + config en wizard)

src/hooks/
  useInvitacionPublica.ts
  useRSVP.ts
  useCheckin.ts
  useInvitacionesAdmin.ts
```

---

## 7. Integración en el wizard de eventos

Nuevo extra en `StepConfiguration` (junto a juegos):
- Toggle "Activar invitaciones digitales".
- Si ON: cupo máximo, acompañantes max, fecha límite RSVP, mensaje custom.
- Al crear el evento, generar `qr_invitaciones_token` y `qr_checkin_token` (crypto random, mismo helper que los otros tokens).

Precio: nuevo entry en `configuracion_global` → `precios_invitaciones` (básico/pro). Sumado al total del paso de pago.

---

## 8. Flujo de datos end-to-end

```text
Organizador crea evento + activa invitaciones
        │
        ├─► Sistema genera 2 tokens (maestro + checkin)
        │
        ▼
Comparte /invitacion/:token por WhatsApp
        │
        ▼
Invitado abre → RSVP → RPC crear_rsvp
        │
        ▼
Redirige a /mi-invitacion/:qr_token → muestra QR
        │
Día del evento ───────────────────────────────────────────┐
        │                                                  │
Organizador abre /checkin/:checkin_token en su celular   │
        │                                                  │
Escanea QR del invitado → RPC validar_checkin            │
        │                                                  │
        ▼                                                  │
Resultado en pantalla + contador actualizado vía Realtime◄┘
```

---

## 9. Realtime

- Suscripción a `invitaciones` y `checkins` filtrada por `evento_id` para que el dashboard del organizador y la pantalla de check-in vean confirmaciones e ingresos en vivo. Habilitar publicación realtime en ambas tablas.

---

## 10. Seguridad y anti-fraude (MVP)

- Tokens crypto random (32 bytes hex), igual que los demás QR del proyecto.
- QR personal de un solo uso: unique constraint en `checkins.invitacion_id`.
- Anti-RSVP-duplicado: validación en RPC por `device_id` + `email` por evento.
- Rate limit suave en RPC `crear_rsvp` por IP/device.
- `checkin_token` distinto del `invitaciones_token` para que compartir la invitación no habilite controlar accesos.

---

## 11. Orden de implementación sugerido (incremental, sin refactor)

1. **Migración**: extensión `eventos` + tablas `invitaciones` y `checkins` + RLS + RPCs + tokens crypto.
2. **Wizard**: paso/toggle del extra + persistencia + precio.
3. **Página pública `/invitacion/:token`** + `RSVPForm` + hook `useRSVP`.
4. **Página `/mi-invitacion/:qr_token`** con QR personal (mismo helper `api.qrserver.com` ya usado).
5. **Página `/checkin/:checkin_token`** con scanner (`html5-qrcode`) + RPC validación + feedback.
6. **Dashboard cliente**: panel `InvitacionesPanel` con stats realtime, lista, share modal, export CSV.
7. **QA**: viewport mobile (es donde se usa todo), modo standalone (Add to Home Screen) para check-in.

---

## 12. Detalles técnicos clave

- **QR rendering**: reutilizar `generateQRImageUrl` ya existente en `QRCodesModal`.
- **Scanner**: `html5-qrcode` (liviano, sin build issues, funciona en iOS Safari ≥ 14.3).
- **Compartir**: misma estrategia que enterprise → `https://wa.me/?text=...` directo, nunca `wa.link`.
- **Modal share**: reutilizar `ResponsiveModal` (mobile bottom-sheet / desktop dialog).
- **Pricing**: dinámico desde `configuracion_global` vía `usePublicPrices` extendido.
- **Feature flag**: `FEATURE_FLAGS.INVITACIONES` para poder activarlo en staging primero.

---

¿Avanzo con la migración como primer paso, o querés que primero ajuste algo del modelo (cupos, campos del RSVP, política de un-QR-por-acompañante vs un-QR-por-invitación)?
