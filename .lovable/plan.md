
# Plan de Hardening de Seguridad — Ejecución Ordenada

Aplico las correcciones en el orden estricto que indicaste, con checkpoint manual después del Área 2.

## FASE 1 — Cerrar privilege escalation en `profiles` (Área 1)

**Migración SQL:**

1. Eliminar la política `Users can update own profile` actual (sin `WITH CHECK`).
2. Recrearla con `WITH CHECK` que permite UPDATE solo si `rol` y `tenant_id` no cambian:
   ```sql
   USING (auth.uid() = id)
   WITH CHECK (
     auth.uid() = id 
     AND rol = (SELECT rol FROM profiles WHERE id = auth.uid())
     AND tenant_id IS NOT DISTINCT FROM (SELECT tenant_id FROM profiles WHERE id = auth.uid())
   )
   ```
3. Crear trigger `BEFORE UPDATE` adicional como defensa en profundidad:
   - Si el usuario NO es super_admin, bloquea cambios a `rol`, `tenant_id`, `email`.
   - Si es super_admin, permite todo.

**Verificación:** Intentar `UPDATE profiles SET rol='super_admin'` desde una sesión no-admin → debe fallar.

**Resultado esperado:** Cierra el vector crítico. `is_super_admin()` sigue leyendo de `profiles` pero ahora `profiles.rol` es inmutable para no-admins.

---

## CHECKPOINT 1 — Validación manual antes de Fase 2

Antes de seguir, vos confirmás que:
- Login de super_admin sigue funcionando.
- Login de cliente/asistente/salon sigue funcionando.
- Crear evento sigue funcionando.

Si algo falla, rollback de la migración Fase 1 y stop.

---

## FASE 2 — Migrar `is_super_admin()` y `AuthContext` a `user_roles` (Área 2)

**Pre-requisito (sync):** Antes de tocar la función, sincronizar `profiles.rol → user_roles` para todos los usuarios que tengan rol y NO tengan entrada en `user_roles`. Esto evita que algún super_admin existente quede locked-out.

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, rol::text::app_role FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = profiles.id AND ur.role::text = profiles.rol::text
);
```

**Migración de la función:**
```sql
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'::app_role
  )
$$;
```

**Frontend — `src/contexts/AuthContext.tsx`:**
- Después de `fetchProfile`, hacer `select role from user_roles where user_id = ...`.
- Calcular `isSuperAdmin()` desde el array de roles, no desde `profile.rol`.
- Mantener `profile.rol` solo para UI (texto descriptivo), NO para autorización.

**Edge function — `supabase/functions/delete-event/index.ts`:**
- Eliminar el fallback `|| profile?.rol === 'super_admin'`. Solo confiar en `user_roles`.

---

## CHECKPOINT 2 — Validación manual obligatoria

Vos validás:
1. Login super_admin → entra a `/admin` correctamente.
2. Login cliente → entra a `/dashboard`.
3. Login asistente / salon → entran a sus respectivos paneles.
4. Crear y eliminar evento como super_admin funciona.

**Si el login de super_admin falla → rollback inmediato:**
```sql
-- revertir is_super_admin a leer de profiles
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND rol = 'super_admin') $$;
```
Y revertir el commit de `AuthContext.tsx`.

Espero tu OK explícito antes de continuar con Fase 3.

---

## FASE 3 — Hardening restante (Áreas 3, 6, 8, 10)

Solo arrancar después de tu OK del Checkpoint 2.

### 3.1 Storage `contenido-eventos` (Área 7 / ALTO)
- Política INSERT en `storage.objects`: exigir que `(storage.foldername(name))[1]::uuid` sea un evento que pasa `event_accepts_uploads()`.
- SELECT sigue público (necesario para que los invitados vean el muro).

### 3.2 `logs_auditoria` INSERT (Área 6 / MEDIO)
- Cambiar la policy INSERT a `auth.role() = 'service_role'` únicamente.
- Auditar dónde el cliente React inserta logs directamente; mover esos casos a una edge function si los hay.

### 3.3 Validar `contenido.url_original` (Área 4 residual / MEDIO)
- Agregar CHECK constraint: `url_original IS NULL OR url_original ~ '^https://aahxmxgmmgfymhenlqdy\.supabase\.co/storage/'`.

### 3.4 HMAC en `mp-webhook` (Área 8 / ALTO)
- Implementar verificación `x-signature` con secret `MP_WEBHOOK_SECRET` (pedirlo si no existe).
- Si falla la firma → 401, no procesar.
- Aplicar también a `mp-webhook-subscription`.

### 3.5 HIBP en Auth (Área 10 / MEDIO)
- Activar `password_hibp_enabled: true`.

---

## Archivos tocados

| Fase | Archivos |
|------|----------|
| 1 | migración SQL (RLS profiles + trigger) |
| 2 | migración SQL (sync user_roles + is_super_admin) · `src/contexts/AuthContext.tsx` · `supabase/functions/delete-event/index.ts` |
| 3 | migración SQL (storage policy + logs_auditoria + check constraint) · `supabase/functions/mp-webhook/index.ts` · `supabase/functions/mp-webhook-subscription/index.ts` · auth config |

## Riesgo y rollback

- **Fase 1:** Riesgo bajo. Rollback = recrear policy original sin `WITH CHECK`.
- **Fase 2:** Riesgo medio (toca el camino crítico de auth). Rollback documentado arriba. Por eso el checkpoint manual.
- **Fase 3:** Riesgo bajo, son cambios aislados. Cada sub-paso es revertible independientemente.

Sin downtime esperado en ninguna fase. La app sigue operando durante las migraciones.
