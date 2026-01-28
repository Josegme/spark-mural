
# Plan de Lanzamiento PickEvent - Implementación Completa

Este plan detalla las 5 mejoras obligatorias antes del lanzamiento comercial en Argentina, ordenadas por prioridad y explicadas en lenguaje natural.

---

## RESUMEN DEL ESTADO ACTUAL

**Problemas identificados:**
- 8 pagos están atascados en estado "pendiente" (nunca pasaron a "aprobado")
- El Super Admin debe ingresar manualmente `/admin` en el navegador para acceder a su panel
- No existe forma de crear eventos sin pagar (para demos o promociones)
- El estado "pausado" no existe en la base de datos, impidiendo pausar eventos temporalmente
- No hay botón para copiar links de pago directamente

---

## MEJORA 1: Corregir el Webhook de Mercado Pago
**Prioridad:** CRÍTICA - Bloqueador de lanzamiento
**Tiempo estimado:** 2-3 horas

### El Problema
Cuando un cliente paga con Mercado Pago, el sistema recibe una notificación (webhook) con un `payment_id`. Sin embargo, el pago se guardó originalmente con un `preference_id` diferente. El webhook actual busca el pago usando el `preference_id`, pero Mercado Pago envía solo el `payment_id`, causando que nunca se encuentre el registro original.

### La Solución
1. Modificar la función `mp-webhook` para buscar pagos de forma más inteligente
2. En lugar de buscar solo por `payment_id_externo`, también buscar por el `external_reference` que contiene el ID del usuario y timestamp
3. Cuando se encuentre el pago, actualizar su estado a "aprobado" y crear el evento automáticamente

### Archivos a Modificar
- `supabase/functions/mp-webhook/index.ts`

### Cambios Técnicos
- Mejorar la consulta de búsqueda del pago pendiente
- Agregar logging detallado para debugging
- Verificar que el `external_reference` enviado en la preferencia sea el mismo que devuelve MP

---

## MEJORA 2: Navegación Visible al Panel de Admin
**Prioridad:** Alta
**Tiempo estimado:** 30 minutos

### El Problema
El Super Admin tiene que escribir manualmente `/admin` en la barra de direcciones del navegador para acceder a su panel. Esto no es intuitivo ni profesional.

### La Solución
1. Detectar cuando el usuario logueado es Super Admin
2. Mostrar un botón o link visible que lo lleve directamente al panel de administración
3. Hacerlo de forma elegante, sin romper la experiencia de otros usuarios

### Archivos a Modificar
- `src/components/layout/MainLayout.tsx` - Agregar navegación condicional en el Header

### Experiencia del Usuario
- El Super Admin verá un botón "Panel Admin" en la barra de navegación superior
- Un clic lo llevará a `/admin`
- Otros usuarios no verán este botón

---

## MEJORA 3: Checkbox "Evento Promocional" para Super Admin
**Prioridad:** Alta
**Tiempo estimado:** 1 hora

### El Problema
El Super Admin necesita crear eventos de demostración o promocionales sin pasar por el flujo de pago de Mercado Pago. Actualmente no hay forma de hacer esto.

### La Solución
1. Cuando el Super Admin esté en el paso de pago del wizard, mostrar un checkbox: "Crear como Evento Promocional"
2. Si marca el checkbox, se salta el pago y se crea el evento directamente
3. El evento queda marcado internamente como promocional (sin cobro)
4. Ya existe la función `createEventDirectly()` que puede usarse para esto

### Archivos a Modificar
- `src/components/events/wizard/StepPayment.tsx` - Agregar checkbox condicional
- `src/hooks/useCreateEvent.ts` - Agregar lógica para evento promocional

### Experiencia del Usuario
- El Super Admin verá: "☑ Crear como Evento Promocional (sin cobro)"
- Al confirmarlo, el evento se crea inmediatamente con QR codes listos
- El precio pagado se registra como $0

---

## MEJORA 4: Botón "Copiar Link de Pago"
**Prioridad:** Media-Alta
**Tiempo estimado:** 30 minutos

### El Problema
No existe una forma fácil de compartir el link de pago de Mercado Pago con un cliente. Esto dificulta escenarios donde un asistente o vendedor quiere enviar el link por WhatsApp.

### La Solución
1. Después de generar la preferencia de pago, guardar el `init_point` (link de checkout)
2. Mostrar un botón "Copiar Link de Pago" junto al botón de pagar
3. Permitir copiar ese link al portapapeles para compartirlo

### Archivos a Modificar
- `src/components/events/wizard/StepPayment.tsx` - Agregar botón de copiar
- `src/hooks/useCreateEvent.ts` - Exponer el link de pago generado

### Experiencia del Usuario
- El usuario verá un botón secundario "Copiar Link de Pago"
- Al hacer clic, se copia el link de Mercado Pago al portapapeles
- Un mensaje confirma: "Link copiado - podés compartirlo por WhatsApp"

---

## MEJORA 5: Agregar Estado "Pausado" a Eventos
**Prioridad:** Alta
**Tiempo estimado:** 1-2 horas

### El Problema
Los clientes no pueden pausar temporalmente su muro interactivo. El enum `event_status` en la base de datos solo tiene: programado, activo, finalizado, cancelado. Falta el estado "pausado".

### La Solución
1. Agregar 'pausado' al enum `event_status` en la base de datos mediante migración
2. Actualizar la interfaz para permitir pausar/reanudar eventos
3. Modificar las políticas de RLS para considerar este nuevo estado

### Archivos a Modificar
- Migración SQL para alterar el enum
- `src/components/event-detail/EventHeader.tsx` - Ya tiene el botón, solo falta que funcione

### Experiencia del Usuario
- En el detalle del evento, el menú de acciones permitirá "Pausar Evento"
- Un evento pausado mostrará badge "Pausado" en amarillo
- El muro dejará de aceptar nuevas subidas mientras esté pausado
- El cliente puede reactivarlo cuando quiera

---

## MEJORA 6 (Idealmente antes del lanzamiento): Restringir RLS en Columnas Sensibles
**Prioridad:** Media
**Detalle:** Se evaluará post-implementación de las 5 mejoras críticas

---

## ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. **Webhook de Mercado Pago** → Es el bloqueador principal, sin esto no hay ventas
2. **Estado "pausado"** → Requiere migración de base de datos
3. **Navegación Admin** → Mejora rápida de UX
4. **Evento Promocional** → Facilita demos y soporte
5. **Copiar Link de Pago** → Nice-to-have pero útil

---

## VALIDACIÓN POST-IMPLEMENTACIÓN

Después de implementar cada mejora, se debe:
1. Probar el flujo completo de pago con tarjetas de prueba de Mercado Pago
2. Verificar que los eventos se creen automáticamente tras el pago
3. Confirmar que los QR codes funcionen correctamente
4. Testear los cambios de estado del evento (programado → activo → pausado → finalizado)

---

## ARCHIVOS PRINCIPALES INVOLUCRADOS

| Archivo | Mejora |
|---------|--------|
| `supabase/functions/mp-webhook/index.ts` | #1 Webhook |
| `src/components/layout/MainLayout.tsx` | #2 Navegación |
| `src/components/events/wizard/StepPayment.tsx` | #3 y #4 |
| `src/hooks/useCreateEvent.ts` | #3 y #4 |
| `src/components/event-detail/EventHeader.tsx` | #5 Estado |
| Migración SQL | #5 Enum pausado |
