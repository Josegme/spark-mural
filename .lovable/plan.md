# Plan Fase C — Theme, Skeletons, Bottom Sheets + Fix QR Mobile

## Diagnóstico del bug del QR (imagen)

En la captura se ve que el modal de "Códigos QR" se desplaza hacia la derecha y se corta. Causa raíz:

- El `Dialog` de shadcn está posicionado con `left:50% + translate-x:-50%` y un `max-w-lg` por defecto.
- Le pasamos `max-w-2xl w-[calc(100vw-1rem)]`, pero en navegadores móviles (Samsung Internet, Chrome con barra dinámica) `100vw` **incluye la barra de scroll vertical**, por lo que el contenido es 8-15px más ancho que el viewport visible y el modal queda corrido hacia la derecha.
- Además, `max-w-2xl` (672px) gana sobre `w-[calc(100vw-1rem)]` cuando hay sub-elementos con ancho mínimo (códigos URL largos), provocando overflow horizontal.

**Fix definitivo**: en mobile usar un **Drawer (vaul)** que sube desde abajo, ocupa todo el ancho real del viewport, se cierra arrastrando hacia abajo. En desktop seguir usando Dialog.

---

## 1. ResponsiveModal — wrapper Dialog/Drawer

**Nuevo**: `src/components/ui/responsive-modal.tsx`
- Detecta viewport con `useIsMobile()` (ya existe).
- En mobile renderiza `Drawer` (vaul) con `DrawerContent` que ocupa `100%` de ancho real.
- En desktop renderiza `Dialog` normal.
- API espejo de Dialog: `<ResponsiveModal>`, `<ResponsiveModalContent>`, `<ResponsiveModalHeader>`, `<ResponsiveModalTitle>`, `<ResponsiveModalDescription>`.

**Aplicado en**:
- `QRCodesModal.tsx` → fix definitivo del bug de la imagen.
- `CreateTenantModal.tsx`, `TenantEditModal.tsx` → mejor UX en mobile para el admin.

## 2. Theme Toggle (light / dark / system)

- Instalar `next-themes`.
- Envolver app en `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` en `src/main.tsx`.
- Crear `src/components/ui/theme-toggle.tsx`: botón con dropdown (sol/luna/monitor).
- Insertar en:
  - Header desktop de `MainLayout.tsx` (al lado del avatar/login).
  - Sheet mobile de `MainLayout.tsx` (sección dedicada).
- Validar tokens `.dark` ya existentes en `index.css` (líneas 96+) — ajustar si algún componente usa color hardcoded.
- Auditar y reemplazar cualquier `bg-white`, `text-black`, `bg-black` que encuentre por tokens semánticos en el camino.

## 3. Skeleton Loaders consistentes

**Nuevo**: `src/components/ui/skeletons.tsx` con variantes:
- `StatsCardSkeleton` (4 cards de stats)
- `EventCardSkeleton` (card de evento)
- `TableRowSkeleton` (filas de tabla admin)
- `EventHeaderSkeleton` (header de detalle de evento)
- `ListSkeleton` (lista genérica n items)

**Reemplazar spinners en**:
- `AdminPage.tsx` → tabs Stats/Tenants/Users/Events
- `DashboardPage.tsx` → stats + lista de eventos
- `SalonPage.tsx`, `AsistentePage.tsx` → mismas secciones
- `EventDetailPage.tsx` → header + grids
- `StatsCards.tsx`, `EventsList.tsx` → skeletons internos cuando `isLoading`

## 4. Bottom Sheets contextuales (consecuencia de #1)

- `QRCodesModal` ya queda como bottom sheet en mobile (resuelve el bug).
- `UploadTabs.tsx`: en mobile, el selector de tipo (Foto/Video/Mensaje) queda como tabs full-width grandes con íconos visibles + label (hoy oculta el label en mobile, lo cual confunde).

---

## Archivos a modificar/crear

| # | Archivo | Tipo |
|---|---|---|
| 1 | `package.json` | + `next-themes` |
| 2 | `src/main.tsx` | envolver con ThemeProvider |
| 3 | `src/components/ui/theme-toggle.tsx` | nuevo |
| 4 | `src/components/ui/responsive-modal.tsx` | nuevo |
| 5 | `src/components/ui/skeletons.tsx` | nuevo |
| 6 | `src/components/layout/MainLayout.tsx` | + ThemeToggle en header y sheet |
| 7 | `src/components/dashboard/QRCodesModal.tsx` | usar ResponsiveModal (fix bug) |
| 8 | `src/components/upload/UploadTabs.tsx` | tabs con label visible en mobile |
| 9 | `src/components/admin/CreateTenantModal.tsx` | ResponsiveModal |
| 10 | `src/components/admin/TenantEditModal.tsx` | ResponsiveModal |
| 11 | `src/pages/AdminPage.tsx` | spinners → skeletons |
| 12 | `src/pages/DashboardPage.tsx` | spinners → skeletons |
| 13 | `src/pages/SalonPage.tsx` | spinners → skeletons |
| 14 | `src/pages/AsistentePage.tsx` | spinners → skeletons |
| 15 | `src/pages/EventDetailPage.tsx` | spinners → skeletons |
| 16 | `src/index.css` | ajustes finos tokens `.dark` si hace falta |

## Lo que NO toco

- Lógica de negocio, queries, RLS, edge functions.
- Tablas de admin (Tenants/Users) — la conversión tabla→cards en mobile sería **Fase D** dedicada.
- Wizard de creación de evento — funciona bien responsive según tu test manual.
- Muro interactivo (`MuroPage`) — diseño intencional fullscreen.
- Colores existentes — solo reemplazo hardcodeados que rompen dark mode.

## Riesgos

- **next-themes + SSR**: no aplica, somos SPA Vite. Riesgo cero.
- **vaul**: ya instalado y usado en `drawer.tsx`. Riesgo cero.
- **Dark mode**: si encuentro componentes con colores hardcoded los corrijo. Posible que algunos gradientes brand necesiten ajuste de luminosidad en `.dark` para mantener contraste — lo valido al final con screenshot.

## Tiempo estimado

60-90 minutos. Validación inmediata:
1. Recargar `/admin` → ver skeletons.
2. Toggle tema desde header.
3. Abrir modal QR en 390px → debe subir desde abajo y ocupar 100% de ancho.

¿Confirmás para arrancar?
