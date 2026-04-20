

# Auditoría UX/UI Responsive — PickEvent (Abril 2026)

## Evaluación como Senior UX/UI

### Lo que está BIEN ✅
- **Sistema de diseño sólido**: tokens HSL semánticos, gradientes definidos, dark mode preparado, tipografías Space Grotesk + Inter (moderno).
- **Identidad visual coherente**: paleta magenta/púrpura/coral con personalidad.
- **Mobile-first parcial**: uso correcto de breakpoints `md:` y `sm:` en wizard, dashboard cards, modal QR (recién corregido).
- **Patrones modernos**: sticky header con backdrop-blur, sheets, drawers, dropdown menus de shadcn — alineado con estándares 2026.

### Problemas detectados 🔴

**1. Header no responsive (CRÍTICO)** — `MainLayout.tsx`
- En mobile (390px), conviven: logo + "Panel Admin" + "Mi Dashboard" + "Crear Evento" → desborda horizontalmente.
- No hay menú hamburguesa. La nav `hidden md:flex` oculta links pero los CTAs siguen apilados.
- **Estándar 2026**: hamburger + Sheet lateral en <768px.

**2. EventHeader desbordamiento en mobile (ALTO)**
- Línea de meta (tipo + fecha + hora + estado) usa `flex-wrap` pero los badges grandes generan saltos feos a 390px.
- Acciones (QR + Ver Muro + ⋮) no se reagrupan; en mobile compiten con el título.

**3. Tabs del EventDetail demasiadas para mobile (ALTO)**
- 5 tabs con `grid-cols-5` y solo iconos en <sm:. Touch targets de ~50px están en el límite mínimo de Apple HIG (44px) pero sin labels el usuario no sabe qué es cada uno.
- **Mejor**: scrollable tabs horizontal o bottom navigation en mobile.

**4. Footer 4 columnas colapsa pero pesado (MEDIO)**
- En mobile se ve bien (`grid-cols-1`) pero los 12 links apilados generan scroll innecesario. Podría ser accordion.

**5. Modal QR (recién corregido) — falta refinamiento (MEDIO)**
- Se cortaba — ya arreglado, pero según screenshot 196 aún se ve borde recortado a la derecha. El `max-w-2xl` + `w-[calc(100vw-2rem)]` deja ~16px que el preview de Lovable desborda.
- Falta `overflow-x-hidden` en el body del modal y el grid de tabs mobile podría ser solo 3 iconos centrados grandes.

**6. Falta de feedback táctil moderno (MEDIO)**
- Sin estados `active:scale-95` en botones (esperado en mobile 2026).
- Sin `touch-manipulation` CSS para evitar delays en taps.

**7. Tipografía no escala fluida (BAJO)**
- Uso de breakpoints discretos `text-2xl md:text-3xl`. Estándar 2026 es `clamp()` para fluid typography.

**8. Container sin max-width en mobile (BAJO)**
- Padding lateral inconsistente entre páginas (`py-6` sin `px-` explícito en algunas vistas).

**9. Falta safe-area para notch/home-indicator (MEDIO)**
- Si se usa como PWA o web en iOS, falta `env(safe-area-inset-*)` en header sticky y footer.

**10. Dark mode definido pero no togglable (BAJO)**
- Variables `.dark` existen pero no hay switch. Tendencia 2026: respetar `prefers-color-scheme`.

---

## Propuesta de Mejora (3 fases)

### Fase A — Correcciones críticas mobile (esfuerzo: BAJO)
1. **Header con menú hamburguesa** (Sheet lateral) en `<md:`.
2. **EventHeader compacto en mobile**: título arriba, meta en grid 2x2, acciones colapsadas en menú "⋮" único con QR + Ver Muro + estado.
3. **Tabs scrollables horizontal** en EventDetail con labels visibles siempre (overflow-x-auto + snap).
4. **Modal QR**: forzar `overflow-x-hidden`, ajustar `max-w-[calc(100vw-1rem)]` y centrar mejor.

### Fase B — Refinamiento UX 2026 (esfuerzo: MEDIO)
5. **Fluid typography**: introducir clases `text-fluid-*` con `clamp()` para H1/H2.
6. **Touch feedback**: agregar `active:scale-[0.98] transition-transform` global en botones + `touch-manipulation`.
7. **Safe areas iOS**: padding dinámico en header sticky / FABs / footer.
8. **Footer accordion** en mobile (Radix Accordion) para colapsar las 4 columnas.

### Fase C — Polish opcional (esfuerzo: BAJO)
9. **Theme toggle** (light/dark/system) en header.
10. **Skeleton loaders** consistentes en lugar del spinner único actual.
11. **Bottom sheet en mobile** para acciones contextuales (ej: dropdown del evento).

### Archivos que tocaría (Fase A únicamente)
- `src/components/layout/MainLayout.tsx` — hamburger menu
- `src/components/event-detail/EventHeader.tsx` — reorg mobile
- `src/pages/EventDetailPage.tsx` — tabs scrollables
- `src/components/dashboard/QRCodesModal.tsx` — fix overflow residual
- `src/index.css` — utilidades touch + safe-area

### Recomendación
**Empezar por Fase A** (1-2 horas, alto impacto visible inmediatamente en los 3 puntos críticos del screenshot que mostraste). Validás, y después decidimos si vamos por B y C.

