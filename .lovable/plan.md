

## Fix: Idempotencia y Race Condition en mp-webhook

Evaluación Senior: Los 3 cambios son correctos, quirúrgicos y no rompen nada. El guard de idempotencia por `payment_id` en `eventos` es la defensa principal. El re-fetch atómico antes del INSERT en CASE 2 es la defensa secundaria contra race conditions. Acotar Strategy 4 a 30 minutos reduce falsos positivos. Ninguno altera el flujo normal — solo agregan guards que retornan 200 early si detectan duplicados.

Una observación: el guard de idempotencia (Cambio 1) debe aplicarse solo cuando `payment.status === 'approved'`, porque los webhooks de `pending` no crean eventos y deben seguir actualizando el estado del pago normalmente. Esto ya está contemplado en tu especificación.

### Cambios en `supabase/functions/mp-webhook/index.ts`

**Cambio 1 — Guard de idempotencia (línea ~108, después de los logs de MP PAYMENT DETAILS)**
- Solo si `payment.status === 'approved'`: query `eventos` por `payment_id = payment.id.toString()`
- Si ya existe → return 200 con `skipped: 'duplicate'`

**Cambio 2 — Re-fetch atómico en CASE 2 (línea ~346, antes del INSERT)**
- Re-leer `pagos.evento_id` para el `existingPayment.id`
- Si `evento_id` ya tiene valor → return 200 con `skipped: 'race_condition'`

**Cambio 3 — Acotar Strategy 4 (línea ~176)**
- Agregar `.gte('created_at', thirtyMinutesAgo)` al query de Strategy 4

### Archivo tocado
Solo `supabase/functions/mp-webhook/index.ts` + deploy de la edge function.

