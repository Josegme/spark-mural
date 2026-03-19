

## Plan: 2 fixes — fecha mínima + "Ver Eventos" de tenant

### Fix 1 — Fecha mínima en StepBasicInfo.tsx

**Confirmado**: tenés razón. Líneas 46-49 fijan `minDate` en mañana. Un cliente que paga hoy no puede crear un evento para hoy.

**Cambios en `src/components/events/wizard/StepBasicInfo.tsx`:**
- Reemplazar el bloque `tomorrow` por `today` para que `minDate` sea la fecha actual
- Agregar un aviso informativo (no bloqueante) debajo del campo `hora_inicio` cuando la fecha seleccionada es hoy y la hora es menor a 1 hora desde ahora: "Recordá que el pago puede tardar unos minutos en confirmarse."
- Se usa `form.watch` para observar `fecha_evento` y `hora_inicio` en tiempo real

### Fix 2 — "Ver Eventos" en TenantsTable.tsx

**Confirmado**: el `DropdownMenuItem` "Ver Eventos" (línea 408) no tiene `onClick` — es un botón muerto.

**Cambios en `src/components/admin/TenantsTable.tsx`:**
- Agregar un estado `selectedTenantForEvents` (tipo `Tenant | null`) para rastrear qué tenant quiere ver eventos
- Agregar `onClick` al item "Ver Eventos" que setea ese estado
- Cuando hay un tenant seleccionado, renderizar un panel/modal debajo de la tabla (o un Dialog) que:
  - Hace un query a `eventos` filtrado por `tenant_id = selectedTenant.id`
  - Muestra nombre, fecha, estado, tipo, precio de cada evento
  - Permite cerrar y volver a la tabla
  - Incluye link a "Gestionar" cada evento (`/evento/{id}`)

**Implementación**: Dialog con una lista simple de eventos del tenant, reutilizando los mismos estilos de `AdminEventsList`. Sin crear archivos nuevos — todo dentro de `TenantsTable.tsx` usando el Dialog de shadcn que ya está disponible.

### Archivos tocados
1. `src/components/events/wizard/StepBasicInfo.tsx`
2. `src/components/admin/TenantsTable.tsx`

Ningún otro archivo se modifica.

