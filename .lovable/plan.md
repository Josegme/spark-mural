

## Analysis and Plan: Allow Asistente to Access Event Detail with Pending Payment

### Critical Issue Found

The user's request has 4 changes, but there's a **hidden blocker** not mentioned: `useEventDetails.ts` line 70 filters events by `.eq('cliente_user_id', user.id)`. An asistente is NOT the `cliente_user_id` — they manage events via `tenant_id`. This means **the asistente will get a 404/redirect** regardless of the other changes. The fix must remove this filter and rely on RLS policies instead (which already allow access by tenant_id).

Additionally, the `pagos` table RLS only allows SELECT for event owners (`cliente_user_id = auth.uid()`) or super admins. The asistente won't be able to query payment status. However, this can be handled gracefully: if the pagos query fails, we default to `null` for `pago_estado`.

### Plan (4 files, in order)

**1. `src/hooks/useEventDetails.ts`**
- Remove `.eq('cliente_user_id', user.id)` from the eventos query (line 70). RLS already restricts access to own events, tenant events, and super_admin. This is safe because RLS is the real access control layer.
- Change `pagos` select from `'metadata'` to `'estado, metadata'`.
- Extract `pago_estado` from the query result and include it in the return object.
- Add `pago_estado` to the `EventDetails` interface as `pago_estado?: string | null`.
- Wrap the pagos query in a try/catch so that if the asistente can't read pagos (RLS), it gracefully defaults to `null`.

**2. `src/components/event-detail/EventHeader.tsx`**
- Add `pagoPendiente?: boolean` to `EventHeaderProps`.
- Import `AlertTriangle` from lucide-react.
- Add yellow warning banner after breadcrumb when `pagoPendiente === true`.
- Change `canActivate` to include `&& !pagoPendiente`.

**3. `src/pages/EventDetailPage.tsx`**
- Pass `pagoPendiente={event.pago_estado === 'pendiente'}` to `<EventHeader>`.

**4. `src/components/asistente/AsistenteEventCards.tsx`**
- When `isBlocked && !evento.payment_link` (lines 206-210), replace the disabled "Esperando pago" button with a `<Link to={/evento/${evento.id}}>Ver Detalles</Link>` button (same style as the non-blocked case). Keep the badge and warning message.

### Risk Assessment

- **Removing `cliente_user_id` filter**: Safe. RLS policies on `eventos` already enforce proper access control (owner, tenant member, super_admin). The client-side filter was redundant and overly restrictive.
- **Pagos query for asistente**: The asistente may not have RLS access to pagos for events they manage (RLS only checks `cliente_user_id` or subscription). Using try/catch prevents errors; the payment status simply won't display for the asistente (graceful degradation). If needed later, a new RLS policy can be added for tenant-based pagos access.
- **No other files touched**: All existing flows (client direct, cortesia, salon) remain unchanged.

