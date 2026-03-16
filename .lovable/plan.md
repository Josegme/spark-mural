
# Plan de Correcciones - 5 Puntos Pendientes

Entiendo perfectamente tus observaciones. Hay 5 problemas concretos que debo corregir:

## Resumen de Problemas Identificados

| # | Problema | Estado |
|---|----------|--------|
| 1 | "Acceso Empresarial" no lleva al banner, no hay flecha atrás | Pendiente |
| 2 | Panel Config solo tiene precios de eventos, faltan suscripciones | Pendiente |
| 3 | WhatsApp API error por formato incorrecto | Pendiente |
| 4 | Precios no cambian en landing (RLS bloqueando lectura publica) | Pendiente |
| 5 | Banner dice "mensuales o anuales" en vez de "empresariales o personalizadas" | Pendiente |

---

## Correcciones Detalladas

### 1. Navegacion desde Login
**Archivos**: `src/pages/AuthPage.tsx`

- Agregar boton/flecha para volver al Home desde la pagina de login
- Cambiar el link "Acceso Empresarial" para que navegue correctamente al `#banner-empresarial` usando `react-router-dom` navigate

### 2. Panel de Precios de Suscripciones
**Archivos**: `src/components/admin/GlobalConfigPanel.tsx`

- Agregar seccion de "Precios de Suscripciones" con campos para Starter, Profesional e Ilimitado
- Estos son los precios que el Super Admin puede ofrecer a los salones (modificables desde su dashboard)

### 3. WhatsApp URL Fix
**Archivos**: `src/components/landing/EnterpriseBanner.tsx`

- El numero ya esta correcto (5493764606205) pero hay que validar el formato
- Asegurar que el URL sea: `https://wa.me/5493764606205` (sin simbolos)

### 4. RLS Policy para Precios Publicos
**Migracion de BD requerida**

- Agregar policy de SELECT publico a `configuracion_global` para claves especificas (`precios_eventos`)
- Esto permite que usuarios no autenticados vean los precios en la landing

### 5. Texto del Banner
**Archivos**: `src/components/landing/EnterpriseBanner.tsx`

- Cambiar "Suscripciones mensuales o anuales" por "Suscripciones empresariales o personalizadas"

---

## Seccion Tecnica

### Migracion de Base de Datos

```text
+-----------------------------+
| configuracion_global        |
+-----------------------------+
| Agregar RLS policy:         |
| - SELECT publico para       |
|   clave = 'precios_eventos' |
+-----------------------------+
```

### Cambios en AuthPage

```text
+------------------------+
|      Login Page        |
+------------------------+
| [<- Volver]     Logo   |
|                        |
| Formulario...          |
|                        |
| Acceso Empresarial ->  |
|   (navega a banner)    |
+------------------------+
```

### GlobalConfigPanel - Nueva Seccion

```text
+----------------------------------+
| $ Precios de Suscripciones       |
+----------------------------------+
| Plan Starter   | Plan Profesional|
| [___150000___] | [___250000____] |
|                                  |
| Plan Ilimitado                   |
| [___500000___]                   |
|                                  |
| [Guardar Precios Suscripciones]  |
+----------------------------------+
```

---

## Archivos a Modificar

1. `src/pages/AuthPage.tsx` - Agregar flecha atras y corregir navegacion
2. `src/components/landing/EnterpriseBanner.tsx` - Corregir texto banner
3. `src/components/admin/GlobalConfigPanel.tsx` - Agregar precios suscripciones
4. Nueva migracion SQL para RLS de lectura publica

## Orden de Implementacion

1. Migracion BD (RLS para precios publicos)
2. GlobalConfigPanel (agregar seccion suscripciones)
3. EnterpriseBanner (texto correcto + verificar WhatsApp)
4. AuthPage (navegacion y flecha atras)
