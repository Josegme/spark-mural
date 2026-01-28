
# Plan de Lanzamiento PickEvent - IMPLEMENTADO ✅

Este plan detalla las 5 mejoras obligatorias antes del lanzamiento comercial en Argentina.

---

## ✅ MEJORA 1: Corregir el Webhook de Mercado Pago
**Estado:** COMPLETADO

Se mejoró la lógica de búsqueda de pagos pendientes con 3 estrategias:
1. Buscar por `preference_id`
2. Buscar por `external_reference` en metadata
3. Buscar en todos los pagos pendientes y matchear por `user_id`

Archivo modificado: `supabase/functions/mp-webhook/index.ts`

---

## ✅ MEJORA 2: Navegación Visible al Panel de Admin
**Estado:** COMPLETADO

El Super Admin ahora ve un botón "Panel Admin" en el header que lo lleva directamente a `/admin`.

Archivo modificado: `src/components/layout/MainLayout.tsx`

---

## ✅ MEJORA 3: Checkbox "Evento Promocional" para Super Admin
**Estado:** COMPLETADO

El Super Admin puede marcar "Crear como Evento Promocional" para crear eventos sin pago.
El evento queda con precio_pagado = $0.

Archivos modificados:
- `src/components/events/wizard/StepPayment.tsx`
- `src/hooks/useCreateEvent.ts`

---

## ✅ MEJORA 4: Botón "Copiar Link de Pago"
**Estado:** COMPLETADO

Se agregó botón "Copiar Link" junto al botón de pagar para compartir por WhatsApp.
Solo visible cuando se usa Mercado Pago.

Archivos modificados:
- `src/components/events/wizard/StepPayment.tsx`
- `src/hooks/useCreateEvent.ts`

---

## ✅ MEJORA 5: Agregar Estado "Pausado" a Eventos
**Estado:** COMPLETADO

Se agregó 'pausado' al enum `event_status` en la base de datos.
El UI ya tenía el soporte (badge amarillo "Pausado" en EventHeader).

Migración ejecutada: `ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'pausado' AFTER 'activo'`

---

## PRÓXIMOS PASOS (Post-Lanzamiento)

1. Migrar roles a tabla `user_roles` (RBAC mejorado)
2. Sistema de comisiones para Asistentes
3. Flujo de suscripciones para Salones
4. Integración IA para fotos
5. Descarga ZIP del álbum

---

## VALIDACIÓN RECOMENDADA

1. Probar flujo completo de pago con tarjetas de prueba de Mercado Pago
2. Verificar que los eventos se creen automáticamente tras el pago
3. Confirmar que los QR codes funcionen correctamente
4. Testear los cambios de estado del evento (programado → activo → pausado → finalizado)
5. Verificar que Super Admin vea el botón "Panel Admin"
6. Probar creación de evento promocional como Super Admin
7. Probar botón "Copiar Link" de pago
