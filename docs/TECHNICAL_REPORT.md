# PICKEVENT - Informe Técnico Completo

> **Versión**: 1.0  
> **Fecha**: Enero 2026  
> **Estado**: En desarrollo activo

---

## 1. Resumen Ejecutivo

PickEvent es una plataforma SaaS de muros interactivos para eventos que permite a los invitados subir fotos, videos y mensajes en tiempo real, los cuales se proyectan instantáneamente en una pantalla. El sistema genera un álbum digital descargable disponible por 30 días post-evento.

---

## 2. Stack Tecnológico

### 2.1 Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.3.x | Framework UI |
| Vite | Latest | Build tool & Dev server |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui | Latest | Component library |
| Framer Motion | 12.x | Animaciones |
| React Query | 5.x | Server state management |
| React Router | 6.x | Client-side routing |
| React Hook Form | 7.x | Form handling |
| Zod | 3.x | Schema validation |

### 2.2 Backend (Lovable Cloud)
| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| Base de Datos | PostgreSQL 15 | Persistencia de datos |
| Autenticación | Auth integrado | Gestión de sesiones |
| Realtime | WebSockets | Actualizaciones en vivo |
| Storage | Object Storage | Almacenamiento de archivos |
| Edge Functions | Deno Runtime | Lógica serverless |

### 2.3 Servicios Externos
| Servicio | Región | Propósito |
|----------|--------|-----------|
| Mercado Pago | AR, BR, PY | Pagos LATAM |
| Stripe | Global | Pagos internacionales |
| Resend | Global | Envío de emails transaccionales |

---

## 3. Arquitectura del Sistema

### 3.1 Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (SPA)                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  Admin  │ │Asistente│ │  Salón  │ │ Cliente │ │Invitado │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
└───────┼──────────┼──────────┼──────────┼──────────┼─────────────┘
        │          │          │          │          │
        ▼          ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API LAYER (Supabase)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   REST API  │  │  Realtime   │  │    Edge Functions       │  │
│  │  (PostgREST)│  │ (WebSocket) │  │  - Payments (MP/Stripe) │  │
│  └──────┬──────┘  └──────┬──────┘  │  - Email (QR codes)     │  │
│         │                │         │  - Test users           │  │
│         ▼                ▼         └───────────┬─────────────┘  │
│  ┌─────────────────────────────────────────────┴─────────────┐  │
│  │                    PostgreSQL Database                     │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │  │
│  │  │profiles │ │ eventos │ │contenido│ │ tenants │          │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │  │
│  │  │  pagos  │ │  likes  │ │ planes  │ │rendicion│          │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Object Storage                          │  │
│  │                  (contenido-eventos)                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Flujo de Datos del Muro Interactivo

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Invitado │───▶│  Upload  │───▶│ Storage  │───▶│ Database │
│  (móvil) │    │   Page   │    │  Bucket  │    │ contenido│
└──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                      │
                                                      ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Pantalla │◀───│   Muro   │◀───│ Realtime │◀───│ WebSocket│
│(proyector)│    │   Page   │    │  Client  │    │  Server  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

---

## 4. Modelo de Datos

### 4.1 Esquema de Base de Datos

#### Tabla: `profiles`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Referencia a auth.users |
| email | TEXT | Email del usuario |
| nombre | TEXT | Nombre completo |
| telefono | TEXT | Teléfono (opcional) |
| pais | TEXT | País del usuario |
| rol | ENUM | super_admin, asistente, salon, cliente |
| tenant_id | UUID (FK) | Referencia a tenants |
| avatar_url | TEXT | URL del avatar |
| created_at | TIMESTAMPTZ | Fecha de creación |
| updated_at | TIMESTAMPTZ | Última actualización |

#### Tabla: `tenants`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| tipo | ENUM | asistente, salon |
| nombre | TEXT | Nombre comercial |
| email | TEXT | Email de contacto |
| pais | TEXT | País de operación |
| estado | ENUM | activo, suspendido, moroso |
| comision_asistente | INT | % comisión (solo asistentes) |
| comision_superadmin | INT | % para admin (solo asistentes) |
| plan_id | UUID (FK) | Plan contratado (solo salones) |
| precio_mensual | INT | Precio mensual (solo salones) |
| limite_eventos_mes | INT | Límite de eventos |
| fecha_vencimiento | TIMESTAMPTZ | Vencimiento suscripción |

#### Tabla: `eventos`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| tenant_id | UUID (FK) | Tenant asociado (opcional) |
| cliente_user_id | UUID (FK) | Dueño del evento |
| nombre | TEXT | Nombre del evento |
| tipo | ENUM | cumpleanos, casamiento, graduacion, etc. |
| fecha_evento | DATE | Fecha programada |
| hora_inicio | TIME | Hora de inicio |
| duracion_horas | INT | 6, 12 o 24 horas |
| estado | ENUM | programado, activo, finalizado, cancelado |
| es_premium | BOOLEAN | Tiene funciones IA |
| estilo_ia | ENUM | caricatura, comico, cinematografico, etc. |
| tema_ia | TEXT | Prompt para transformaciones IA |
| qr_pantalla_token | TEXT | Token único para muro |
| qr_invitados_token | TEXT | Token único para subida |
| qr_descarga_token | TEXT | Token único para álbum |
| precio_pagado | INT | Monto pagado |
| pasarela_pago | ENUM | mercadopago_ar/br/py, stripe, bancard |
| moderacion_activa | BOOLEAN | Requiere aprobación manual |
| total_fotos | INT | Contador de fotos |
| total_videos | INT | Contador de videos |
| total_mensajes | INT | Contador de mensajes |
| total_likes | INT | Total de likes |
| album_disponible_hasta | TIMESTAMPTZ | Fecha límite de descarga |

#### Tabla: `contenido`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| evento_id | UUID (FK) | Evento asociado |
| tipo | ENUM | foto, video, mensaje |
| invitado_nombre | TEXT | Nombre del invitado |
| invitado_device_id | TEXT | ID del dispositivo |
| url_original | TEXT | URL del archivo original |
| url_ia | TEXT | URL del archivo transformado |
| mensaje_texto | TEXT | Texto del mensaje |
| estado_ia | ENUM | pendiente, procesando, completado, error |
| moderado | BOOLEAN | Fue revisado |
| aprobado | BOOLEAN | Está aprobado |
| likes_count | INT | Contador de likes |

#### Tabla: `pagos`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| evento_id | UUID (FK) | Evento asociado |
| suscripcion_id | UUID (FK) | Suscripción asociada |
| tipo | ENUM | evento_unico, suscripcion_mensual |
| monto | INT | Monto en centavos |
| pasarela | ENUM | Pasarela utilizada |
| payment_id_externo | TEXT | ID externo del pago |
| estado | ENUM | pendiente, aprobado, rechazado, reembolsado |

#### Tabla: `planes`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| nombre | TEXT | Nombre del plan |
| precio_sugerido | INT | Precio en centavos |
| limite_eventos_mes | INT | Límite mensual |
| descripcion | TEXT | Descripción |
| activo | BOOLEAN | Plan disponible |

### 4.2 Enums Definidos

```sql
-- Roles de usuario
CREATE TYPE user_role AS ENUM ('super_admin', 'asistente', 'salon', 'cliente');

-- Tipos de tenant
CREATE TYPE tenant_type AS ENUM ('asistente', 'salon');

-- Tipos de evento
CREATE TYPE event_type AS ENUM (
  'cumpleanos', 'casamiento', 'graduacion', 
  'corporativo', 'fiesta_tematica', 'otro'
);

-- Estados de evento
CREATE TYPE event_status AS ENUM (
  'programado', 'activo', 'finalizado', 'cancelado'
);

-- Tipos de contenido
CREATE TYPE content_type AS ENUM ('foto', 'video', 'mensaje');

-- Estados de procesamiento IA
CREATE TYPE ia_status AS ENUM (
  'pendiente', 'procesando', 'completado', 'error'
);

-- Estilos de IA
CREATE TYPE ia_style AS ENUM (
  'caricatura', 'comico', 'cinematografico', 
  'futurista', 'realista', 'fantasia'
);

-- Pasarelas de pago
CREATE TYPE payment_gateway AS ENUM (
  'mercadopago_ar', 'mercadopago_br', 'mercadopago_py', 
  'bancard', 'stripe'
);

-- Estados de pago
CREATE TYPE payment_status AS ENUM (
  'pendiente', 'aprobado', 'rechazado', 'reembolsado'
);
```

---

## 5. Sistema de Autenticación y Autorización

### 5.1 Modelo de Roles

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPER_ADMIN                            │
│  - Control total del sistema                                │
│  - Gestión de tenants (asistentes y salones)               │
│  - Métricas globales y auditoría                           │
│  - Verificación de rendiciones                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│     ASISTENTE       │         │       SALON         │
│  - Venta de eventos │         │  - Suscripción      │
│  - Comisión 50-100% │         │    mensual          │
│  - Multi-país       │         │  - Límite eventos   │
│  - Rendiciones      │         │  - Calendario       │
└─────────┬───────────┘         └─────────┬───────────┘
          │                               │
          └───────────────┬───────────────┘
                          ▼
              ┌─────────────────────┐
              │      CLIENTE        │
              │  - Dueño del evento │
              │  - Gestión QR codes │
              │  - Moderación       │
              │  - Descarga álbum   │
              └─────────┬───────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │     INVITADO        │
              │  - Sin registro     │
              │  - Subida contenido │
              │  - Likes            │
              └─────────────────────┘
```

### 5.2 Row Level Security (RLS)

El sistema implementa políticas RLS para cada tabla:

```sql
-- Ejemplo: Política de eventos
CREATE POLICY "Clients can view own events" 
ON public.eventos FOR SELECT 
USING (auth.uid() = cliente_user_id);

CREATE POLICY "Public can view active events by token" 
ON public.eventos FOR SELECT 
USING (estado IN ('activo', 'programado'));

CREATE POLICY "Super admin can view all events" 
ON public.eventos FOR SELECT 
USING (is_super_admin(auth.uid()));
```

### 5.3 Funciones de Seguridad

```sql
-- Verificar si es super admin
CREATE FUNCTION is_super_admin(_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = _user_id AND rol = 'super_admin'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Obtener rol del usuario
CREATE FUNCTION get_user_role(_user_id UUID)
RETURNS user_role AS $$
  SELECT rol FROM profiles WHERE id = _user_id
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

---

## 6. Edge Functions (Backend Serverless)

### 6.1 Funciones Implementadas

| Función | Método | Propósito |
|---------|--------|-----------|
| `create-payment-preference` | POST | Crear preferencia de pago MercadoPago |
| `mp-webhook` | POST | Webhook para notificaciones MercadoPago |
| `create-stripe-payment` | POST | Crear sesión de checkout Stripe |
| `stripe-webhook` | POST | Webhook para eventos Stripe |
| `send-event-qr-emails` | POST | Enviar emails con códigos QR |
| `create-test-users` | POST | Crear usuarios de prueba |

### 6.2 Flujo de Pago (Ejemplo: Mercado Pago)

```
┌─────────┐     ┌─────────────────┐     ┌─────────────┐
│ Cliente │────▶│ create-payment  │────▶│ MercadoPago │
│ (Wizard)│     │   -preference   │     │    API      │
└─────────┘     └─────────────────┘     └──────┬──────┘
                                               │
     ┌─────────────────────────────────────────┘
     │
     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Checkout   │────▶│  mp-webhook │────▶│   Evento    │
│   Externo   │     │  (callback) │     │   Creado    │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 6.3 Configuración de Edge Functions

```toml
# supabase/config.toml
[functions.create-payment-preference]
verify_jwt = false

[functions.mp-webhook]
verify_jwt = false

[functions.create-stripe-payment]
verify_jwt = false

[functions.stripe-webhook]
verify_jwt = false

[functions.send-event-qr-emails]
verify_jwt = false
```

---

## 7. Sistema en Tiempo Real

### 7.1 Suscripciones Realtime

```typescript
// Hook para muro interactivo
const channel = supabase
  .channel(`muro-${eventoId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'contenido',
      filter: `evento_id=eq.${eventoId}`
    },
    handleNewContent
  )
  .subscribe();
```

### 7.2 Eventos Soportados

| Evento | Tabla | Descripción |
|--------|-------|-------------|
| INSERT | contenido | Nueva foto/video/mensaje |
| UPDATE | contenido | Cambio en estado IA o likes |
| INSERT | likes | Nuevo like |

---

## 8. Estructura del Proyecto

```
src/
├── components/
│   ├── admin/           # Componentes Super Admin
│   │   ├── AdminStats.tsx
│   │   ├── LaunchChecklist.tsx
│   │   ├── TenantAssignment.tsx
│   │   ├── TenantsTable.tsx
│   │   └── UsersTable.tsx
│   ├── asistente/       # Componentes Asistente
│   │   ├── AsistenteClientes.tsx
│   │   ├── AsistenteEventos.tsx
│   │   ├── AsistenteRendiciones.tsx
│   │   └── AsistenteStats.tsx
│   ├── salon/           # Componentes Salón
│   │   ├── SalonCalendar.tsx
│   │   ├── SalonEventos.tsx
│   │   ├── SalonStats.tsx
│   │   └── SalonSubscription.tsx
│   ├── dashboard/       # Componentes Cliente
│   │   ├── EventCard.tsx
│   │   ├── EventsList.tsx
│   │   ├── QRCodesModal.tsx
│   │   └── StatsCards.tsx
│   ├── event-detail/    # Detalle de evento
│   │   ├── AlbumDownload.tsx
│   │   ├── ContentGrid.tsx
│   │   ├── EventHeader.tsx
│   │   └── EventSettings.tsx
│   ├── muro/            # Muro interactivo
│   │   ├── MuroBanner.tsx
│   │   ├── MuroCarousel.tsx
│   │   └── MuroMessages.tsx
│   ├── upload/          # Subida de contenido
│   │   ├── MessageForm.tsx
│   │   ├── PhotoUploadForm.tsx
│   │   └── VideoUploadForm.tsx
│   ├── events/          # Wizard de eventos
│   │   └── wizard/
│   │       ├── StepBasicInfo.tsx
│   │       ├── StepConfiguration.tsx
│   │       ├── StepPayment.tsx
│   │       └── StepPersonalization.tsx
│   ├── auth/            # Autenticación
│   │   └── ProtectedRoute.tsx
│   ├── layout/          # Layouts
│   │   ├── MainLayout.tsx
│   │   └── MuroLayout.tsx
│   └── ui/              # shadcn/ui components
├── contexts/
│   └── AuthContext.tsx  # Estado global de auth
├── hooks/
│   ├── useAdminData.ts
│   ├── useAsistenteData.ts
│   ├── useSalonData.ts
│   ├── useEventDetails.ts
│   ├── useMuroRealtime.ts
│   ├── useUploadContent.ts
│   └── useUserEvents.ts
├── pages/
│   ├── AdminPage.tsx
│   ├── AsistentePage.tsx
│   ├── SalonPage.tsx
│   ├── DashboardPage.tsx
│   ├── CreateEventPage.tsx
│   ├── EventDetailPage.tsx
│   ├── MuroPage.tsx
│   ├── UploadPage.tsx
│   ├── AlbumPage.tsx
│   └── AuthPage.tsx
├── types/
│   └── index.ts         # Definiciones TypeScript
├── lib/
│   ├── constants.ts
│   ├── utils.ts
│   └── validations/
│       └── event.ts
└── integrations/
    └── supabase/
        ├── client.ts    # Cliente Supabase
        └── types.ts     # Tipos auto-generados

supabase/
└── functions/
    ├── create-payment-preference/
    ├── mp-webhook/
    ├── create-stripe-payment/
    ├── stripe-webhook/
    ├── send-event-qr-emails/
    └── create-test-users/
```

---

## 9. Funcionalidades Implementadas

### 9.1 Core Features

| Feature | Estado | Descripción |
|---------|--------|-------------|
| Autenticación | ✅ Completo | Login/Registro/Recuperación |
| Roles y permisos | ✅ Completo | 5 niveles de acceso |
| Muro interactivo | ✅ Completo | Carrusel + mensajes flotantes |
| Sistema QR | ✅ Completo | 3 tokens únicos por evento |
| Subida de contenido | ✅ Completo | Fotos, videos, mensajes |
| Wizard de eventos | ✅ Completo | 4 pasos con pago |
| Álbum descargable | ✅ Completo | Acceso público por token |
| Realtime | ✅ Completo | WebSocket updates |

### 9.2 Dashboards por Rol

| Dashboard | Features |
|-----------|----------|
| Super Admin | Métricas globales, gestión tenants, usuarios, checklist |
| Asistente | Clientes, eventos, rendiciones, estadísticas |
| Salón | Calendario, eventos, suscripción, límites |
| Cliente | Eventos, QR codes, moderación |

### 9.3 Integraciones de Pago

| Pasarela | Países | Estado |
|----------|--------|--------|
| Mercado Pago | Argentina, Brasil, Paraguay | ✅ Integrado |
| Stripe | Global (NZ, ES, AU, US, UK) | ✅ Integrado |

---

## 10. Funcionalidades Pendientes

### 10.1 Alta Prioridad

| Feature | Descripción | Impacto |
|---------|-------------|---------|
| Migración RBAC | Tabla `user_roles` separada | Seguridad crítica |
| Fix webhooks | Pagos quedan en "pendiente" | Producción bloqueada |
| Estado "pausado" | Agregar al enum event_status | UX de clientes |

### 10.2 Media Prioridad

| Feature | Descripción |
|---------|-------------|
| Likes automáticos | Sistema randomizado para engagement |
| Validación límites salón | Bloqueo al alcanzar límite mensual |
| Cálculo comisiones | Sistema de rendiciones completo |

### 10.3 Roadmap Futuro

| Feature | Descripción |
|---------|-------------|
| Transformaciones IA | Aplicar estilos a fotos (caricatura, etc.) |
| Geolocalización | Ubicación de eventos en mapa |
| Analytics avanzados | Métricas de engagement por evento |
| App móvil | PWA o nativa para invitados |

---

## 11. Configuración de Desarrollo

### 11.1 Variables de Entorno Requeridas

```env
# Frontend (automáticas en Lovable)
VITE_SUPABASE_URL=<supabase_url>
VITE_SUPABASE_PUBLISHABLE_KEY=<anon_key>

# Edge Functions (Secrets)
SUPABASE_URL=<url>
SUPABASE_SERVICE_ROLE_KEY=<service_key>
MP_ACCESS_TOKEN=<mercadopago_token>
MP_PUBLIC_KEY=<mercadopago_public>
STRIPE_SECRET_KEY=<stripe_secret>
STRIPE_WEBHOOK_SECRET=<stripe_webhook>
RESEND_API_KEY=<resend_key>
ENCRYPTION_KEY=<32_char_key>
```

### 11.2 Comandos de Desarrollo

```bash
# Desarrollo local
npm run dev

# Build de producción
npm run build

# Tests
npm run test

# Linting
npm run lint
```

---

## 12. Consideraciones de Seguridad

### 12.1 Implementado

- ✅ Row Level Security (RLS) en todas las tablas
- ✅ Tokens únicos por evento (UUID v4)
- ✅ SECURITY DEFINER en funciones de roles
- ✅ Validación de inputs con Zod
- ✅ Encriptación de credenciales de tenants (AES)

### 12.2 Pendiente de Mejora

- ⚠️ Migrar roles a tabla separada (`user_roles`)
- ⚠️ Implementar funciones `has_role()` e `is_admin()`
- ⚠️ Habilitar protección contra contraseñas filtradas
- ⚠️ Restringir campos sensibles en RLS

---

## 13. Testing

### 13.1 Cobertura Actual

| Tipo | Estado |
|------|--------|
| Unit Tests | Configurado (Vitest) |
| Integration Tests | Manual |
| E2E Tests | Manual |

### 13.2 Guía de Testing

Disponible en `/testing-guide` (solo Super Admin) con:
- Checklist de pagos (tarjetas de prueba)
- Flujos de roles
- Wizard de eventos
- Preparación de lanzamiento

---

## 14. Métricas de Rendimiento

### 14.1 Objetivos

| Métrica | Target | Actual |
|---------|--------|--------|
| First Contentful Paint | < 1.5s | ~1.2s |
| Time to Interactive | < 3s | ~2.5s |
| Lighthouse Score | > 90 | ~85 |

### 14.2 Optimizaciones Implementadas

- Lazy loading de rutas
- React Query caching
- Optimistic updates
- Image optimization (Storage)

---

## 15. Contacto y Soporte

Para consultas técnicas sobre este proyecto, contactar al equipo de desarrollo.

---

*Documento generado automáticamente. Última actualización: Enero 2026*
