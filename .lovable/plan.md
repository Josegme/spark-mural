
# Plan de Lanzamiento PickEvent - IMPLEMENTADO ✅

Este plan detalla todas las mejoras implementadas para el lanzamiento comercial en Argentina.

---

## ✅ ETAPA 1: CORRECCIONES CRÍTICAS (Pre-Lanzamiento)

### ✅ MEJORA 1: Corregir el Webhook de Mercado Pago
**Estado:** COMPLETADO

Se mejoró la lógica de búsqueda de pagos pendientes con 3 estrategias:
1. Buscar por `preference_id`
2. Buscar por `external_reference` en metadata
3. Buscar en todos los pagos pendientes y matchear por `user_id`

Archivo modificado: `supabase/functions/mp-webhook/index.ts`

---

### ✅ MEJORA 2: Navegación Visible al Panel de Admin
**Estado:** COMPLETADO

El Super Admin ahora ve un botón "Panel Admin" en el header que lo lleva directamente a `/admin`.

Archivo modificado: `src/components/layout/MainLayout.tsx`

---

### ✅ MEJORA 3: Checkbox "Evento Promocional" para Super Admin
**Estado:** COMPLETADO

El Super Admin puede marcar "Crear como Evento Promocional" para crear eventos sin pago.
El evento queda con precio_pagado = $0.

Archivos modificados:
- `src/components/events/wizard/StepPayment.tsx`
- `src/hooks/useCreateEvent.ts`

---

### ✅ MEJORA 4: Botón "Copiar Link de Pago"
**Estado:** COMPLETADO

Se agregó botón "Copiar Link" junto al botón de pagar para compartir por WhatsApp.
Solo visible cuando se usa Mercado Pago.

Archivos modificados:
- `src/components/events/wizard/StepPayment.tsx`
- `src/hooks/useCreateEvent.ts`

---

### ✅ MEJORA 5: Agregar Estado "Pausado" a Eventos
**Estado:** COMPLETADO

Se agregó 'pausado' al enum `event_status` en la base de datos.
El UI ya tenía el soporte (badge amarillo "Pausado" en EventHeader).

Migración ejecutada: `ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'pausado' AFTER 'activo'`

---

## ✅ ETAPA 2: SEGURIDAD

### ✅ MEJORA 6: Restringir RLS en Columnas Sensibles
**Estado:** COMPLETADO

Se crearon vistas públicas que ocultan datos sensibles:
- `profiles_public` - Sin email ni teléfono
- `pagos_summary` - Sin montos

---

### ✅ MEJORA 7: Migrar Roles a Tabla `user_roles`
**Estado:** COMPLETADO

Se implementó sistema RBAC seguro:
- Nueva tabla `user_roles` con enum `app_role`
- Función `has_role(_user_id, _role)` con SECURITY DEFINER
- Función `is_admin(_user_id)` para verificar super_admin
- Migración automática de roles existentes desde `profiles`

---

## ✅ ETAPA 3: FUNCIONALIDADES POST-LANZAMIENTO

### ✅ MEJORA 8: Sistema de Comisiones para Asistentes
**Estado:** COMPLETADO (Base de datos)

Se creó la tabla `comisiones_config` para configurar split de pagos:
- `porcentaje_asistente` (default 50%)
- `porcentaje_superadmin` (default 50%)
- `mp_marketplace_id` para integración con Mercado Pago Marketplace
- Restricción de que los porcentajes sumen 100%

Nota: La integración con MP Marketplace requiere configuración adicional en el dashboard de Mercado Pago.

---

### ✅ MEJORA 9: Suscripciones por Cantidad de Eventos
**Estado:** COMPLETADO

Se implementaron 3 planes para Salones:
- **Starter**: $20,000/mes - 10 eventos
- **Profesional**: $40,000/mes - 20 eventos (Popular)
- **Ilimitado**: $80,000/mes - Sin límites

Componente creado: `src/components/salon/PlanSelector.tsx`

---

### ✅ MEJORA 10: Integración IA con Más Estilos
**Estado:** COMPLETADO

Se agregaron 5 nuevos estilos artísticos:
- Anime 🌸
- Vintage 📷
- Acuarela 🖌️
- Neón 💜
- Minimalista ⬜

Edge Function creada: `supabase/functions/transform-photo-ai/index.ts`
- Usa Lovable AI Gateway (Gemini Flash Image)
- Procesa fotos y las transforma según el estilo seleccionado
- Guarda resultado en Storage

---

### ✅ MEJORA 11: Descarga ZIP del Álbum
**Estado:** COMPLETADO

Edge Function creada: `supabase/functions/download-album-zip/index.ts`
- Genera archivo ZIP con todas las fotos y videos
- Opción de incluir fotos transformadas por IA
- Organizado en carpetas: /fotos, /videos, /fotos_ia

Componente actualizado: `src/components/event-detail/AlbumDownload.tsx`
- Botón "Descargar Álbum Completo (ZIP)"
- Checkbox para incluir fotos IA
- Descarga individual como alternativa

---

## ARCHIVOS CREADOS/MODIFICADOS

### Edge Functions Nuevas:
- `supabase/functions/transform-photo-ai/index.ts`
- `supabase/functions/download-album-zip/index.ts`

### Componentes Nuevos:
- `src/components/salon/PlanSelector.tsx`

### Migraciones Ejecutadas:
1. Estado 'pausado' en event_status
2. Tabla user_roles con funciones RBAC
3. Nuevos estilos IA en enum ia_style
4. Planes de suscripción en tabla planes
5. Tabla comisiones_config para split de pagos
6. Vistas públicas profiles_public y pagos_summary

### Archivos Actualizados:
- `src/lib/constants.ts` - Nuevos estilos IA y estado pausado
- `src/lib/validations/event.ts` - Validación de nuevos estilos
- `src/components/event-detail/AlbumDownload.tsx` - Descarga ZIP
- `supabase/config.toml` - Nuevas edge functions

---

## VALIDACIÓN RECOMENDADA

1. ✅ Probar flujo completo de pago con tarjetas de prueba de Mercado Pago
2. ✅ Verificar que los eventos se creen automáticamente tras el pago
3. ✅ Confirmar que los QR codes funcionen correctamente
4. ✅ Testear los cambios de estado del evento (programado → activo → pausado → finalizado)
5. ✅ Verificar que Super Admin vea el botón "Panel Admin"
6. ✅ Probar creación de evento promocional como Super Admin
7. ✅ Probar botón "Copiar Link" de pago
8. ⏳ Probar transformación IA de fotos (requiere evento Premium activo)
9. ⏳ Probar descarga ZIP del álbum
10. ⏳ Verificar selector de planes para Salones

---

## PRÓXIMOS PASOS (Mejoras Futuras)

1. Integración completa con Mercado Pago Marketplace para split automático
2. Panel de configuración de comisiones en UI de Admin
3. Renovación automática de suscripciones
4. Notificaciones push/email de vencimiento
5. Dashboard de analytics para Asistentes
