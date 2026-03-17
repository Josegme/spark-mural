

## Allow Asistente to Delete Events with Pending Payment

### Problem
The event has `precio_pagado = 100` set at creation, but the payment status is still `pendiente`. Both frontend and backend block deletion when `precio_pagado > 0`, regardless of whether the payment was actually completed.

### Changes (2 files)

**1. `src/components/event-detail/EventSettings.tsx`**
- Update the `canDeleteEvent` logic: allow deletion when `pago_estado === 'pendiente'` even if `precio_pagado > 0`
- Update `deleteReason` accordingly
- The `event` object already includes `pago_estado` from `useEventDetails`

```typescript
const isPaid = event.precio_pagado > 0;
const paymentPending = event.pago_estado === 'pendiente';

// Allow deletion if: super_admin, salon, not paid, OR paid but payment still pending
const canDeleteEvent = !isEventActive && (
  isSuperAdmin || isSalon || !isPaid || paymentPending
);

const deleteReason = isEventActive
  ? 'No se puede eliminar un evento activo'
  : isPaid && !paymentPending && !isSuperAdmin && !isSalon
    ? 'No se puede eliminar un evento que ya fue pagado'
    : null;
```

**2. `supabase/functions/delete-event/index.ts`**
- Before blocking on `precio_pagado > 0`, check the `pagos` table for actual payment status
- If the most recent payment is `pendiente`, allow deletion (also delete the pending payment record)

```typescript
// After existing role checks, before the precio_pagado block:
// Check if payment is actually completed or still pending
let paymentActuallyPaid = evento.precio_pagado > 0;
if (paymentActuallyPaid) {
  const { data: latestPago } = await supabase
    .from("pagos")
    .select("estado")
    .eq("evento_id", eventId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (latestPago?.estado === "pendiente") {
    paymentActuallyPaid = false; // Payment not confirmed yet
  }
}

if (!isSuperAdmin) {
  const isSalon = appRole === "salon" && isTenantManager;
  if (!isSalon && paymentActuallyPaid) { // changed from evento.precio_pagado > 0
    // ... existing 409 response
  }
}
```

### Why both files
- Frontend: enables the button so the asistente can click "Eliminar"
- Backend: the edge function independently validates permissions and would still reject the request without its own fix

