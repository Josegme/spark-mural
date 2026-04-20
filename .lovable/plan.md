

## Plan Fase B — Refinamiento UX 2026

### 1. Fluid typography (`src/index.css` + `tailwind.config.ts`)
Agregar utilidades `text-fluid-*` con `clamp()`:
- `text-fluid-sm`: `clamp(0.875rem, 0.8rem + 0.3vw, 1rem)`
- `text-fluid-base`: `clamp(1rem, 0.9rem + 0.5vw, 1.125rem)`
- `text-fluid-lg`: `clamp(1.125rem, 1rem + 0.6vw, 1.375rem)`
- `text-fluid-xl`: `clamp(1.25rem, 1.1rem + 0.8vw, 1.75rem)`
- `text-fluid-2xl`: `clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem)`
- `text-fluid-3xl`: `clamp(1.875rem, 1.4rem + 2.4vw, 3rem)`
- `text-fluid-4xl`: `clamp(2.25rem, 1.6rem + 3.2vw, 4rem)`

Aplicarlas en los **H1/H2 principales** de:
- `Index.tsx` (hero landing)
- `EventHeader.tsx` (título del evento)
- `DashboardPage.tsx`, `AdminPage.tsx`, `SalonPage.tsx`, `AsistentePage.tsx` (títulos de página)

No tocamos textos de body ni componentes UI internos (badges, cards) para evitar cambios visuales no deseados.

### 2. Touch feedback global
Editar `src/components/ui/button.tsx`: agregar al `cva` base `active:scale-[0.97] transition-transform touch-manipulation`. Aplica automáticamente a **todos los botones de la app** sin tocar archivos uno por uno.

Agregar también a `src/index.css` regla global:
```css
button, a[role="button"] { touch-action: manipulation; }
```

### 3. Footer accordion en mobile
Editar `src/components/layout/MainLayout.tsx` (donde vive el footer):
- En `<md` (mobile): renderizar las 4 columnas (Producto, Empresa, Soporte, Legal) dentro de un `<Accordion type="single" collapsible>` (Radix, ya disponible en `src/components/ui/accordion.tsx`).
- En `≥md` (desktop): mantener el grid de 4 columnas actual sin cambios.
- Implementación con un único componente que detecta breakpoint vía clases Tailwind (`md:hidden` y `hidden md:grid`).

### Archivos a modificar
| Archivo | Cambio |
|---|---|
| `src/index.css` | Utilidades `.text-fluid-*` + `touch-action` global |
| `tailwind.config.ts` | Registrar las clases `text-fluid-*` en theme.extend.fontSize |
| `src/components/ui/button.tsx` | Agregar `active:scale-[0.97] transition-transform touch-manipulation` |
| `src/components/layout/MainLayout.tsx` | Footer con Accordion mobile / grid desktop |
| `src/pages/Index.tsx` | Aplicar `text-fluid-*` en hero |
| `src/components/event-detail/EventHeader.tsx` | Aplicar `text-fluid-*` en título |
| `src/pages/DashboardPage.tsx` · `AdminPage.tsx` · `SalonPage.tsx` · `AsistentePage.tsx` | Aplicar `text-fluid-*` en títulos H1 |

### Riesgo y rollback
- **Riesgo BAJO en los 3 puntos**. Son cambios puramente visuales, no tocan lógica, datos ni rutas.
- **Rollback fluid typography**: revertir las clases en cada archivo (puramente reemplazo de strings).
- **Rollback touch feedback**: quitar las 3 clases del `cva` de `button.tsx`.
- **Rollback footer accordion**: revertir `MainLayout.tsx` a la versión actual.

### Lo que NO hago en esta fase
- No agrego safe-areas iOS (lo dejamos para Fase C si querés, junto con theme toggle y skeletons).
- No toco tipografía de body, cards, badges, ni componentes UI internos — solo títulos principales.
- No modifico los demás botones custom (`.btn-hero`, `.btn-hero-outline` en `index.css`) — solo el `<Button>` de shadcn que es el 95% de los botones de la app.

### Tiempo estimado
~30-45 minutos de implementación. Sin downtime. Validable visualmente al instante recargando preview.

