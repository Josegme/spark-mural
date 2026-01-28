/**
 * PICKEVENT - Technical Report Page
 * Página para visualizar e imprimir el informe técnico como PDF
 */

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TechnicalReportPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "PICKEVENT - Informe Técnico";
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { 
            font-size: 11pt;
            line-height: 1.4;
            color: #000 !important;
            background: #fff !important;
          }
          .print-content {
            padding: 0 !important;
            max-width: 100% !important;
          }
          h1 { font-size: 24pt; page-break-after: avoid; }
          h2 { font-size: 18pt; page-break-after: avoid; margin-top: 24pt; }
          h3 { font-size: 14pt; page-break-after: avoid; }
          table { 
            page-break-inside: avoid;
            border-collapse: collapse;
            width: 100%;
            font-size: 10pt;
          }
          th, td { 
            border: 1px solid #333;
            padding: 6px 8px;
            text-align: left;
          }
          th { background: #f0f0f0 !important; }
          pre, code { 
            font-size: 9pt;
            background: #f5f5f5 !important;
            page-break-inside: avoid;
          }
          .architecture-diagram {
            font-family: monospace;
            font-size: 8pt;
            white-space: pre;
          }
        }
        @page {
          margin: 2cm;
          size: A4;
        }
      `}</style>

      {/* Navigation Header - Hidden on print */}
      <div className="no-print sticky top-0 z-50 bg-background border-b p-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="default">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir / Guardar PDF
          </Button>
        </div>
      </div>

      {/* Report Content */}
      <div className="print-content max-w-5xl mx-auto p-8 bg-background">
        {/* Header */}
        <div className="text-center mb-12 border-b pb-8">
          <h1 className="text-4xl font-bold mb-4">PICKEVENT</h1>
          <p className="text-xl text-muted-foreground mb-2">Informe Técnico Completo</p>
          <div className="flex justify-center gap-8 text-sm text-muted-foreground mt-4">
            <span><strong>Versión:</strong> 1.0</span>
            <span><strong>Fecha:</strong> Enero 2026</span>
            <span><strong>Estado:</strong> En desarrollo activo</span>
          </div>
        </div>

        {/* Table of Contents */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">Índice</h2>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Resumen Ejecutivo</li>
            <li>Stack Tecnológico</li>
            <li>Arquitectura del Sistema</li>
            <li>Modelo de Datos</li>
            <li>Sistema de Autenticación y Autorización</li>
            <li>Edge Functions (Backend Serverless)</li>
            <li>Sistema en Tiempo Real</li>
            <li>Estructura del Proyecto</li>
            <li>Funcionalidades Implementadas</li>
            <li>Pendientes y Roadmap</li>
          </ol>
        </section>

        {/* Section 1: Executive Summary */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">1. Resumen Ejecutivo</h2>
          <p className="text-muted-foreground leading-relaxed">
            PickEvent es una plataforma SaaS de muros interactivos para eventos que permite a los invitados 
            subir fotos, videos y mensajes en tiempo real, los cuales se proyectan instantáneamente en una pantalla. 
            El sistema genera un álbum digital descargable disponible por 30 días post-evento.
          </p>
        </section>

        {/* Section 2: Tech Stack */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">2. Stack Tecnológico</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Frontend</h3>
          <table className="w-full border-collapse border mb-6">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">Tecnología</th>
                <th className="border p-2 text-left">Versión</th>
                <th className="border p-2 text-left">Propósito</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border p-2">React</td><td className="border p-2">18.3.x</td><td className="border p-2">Framework UI</td></tr>
              <tr><td className="border p-2">Vite</td><td className="border p-2">Latest</td><td className="border p-2">Build tool & Dev server</td></tr>
              <tr><td className="border p-2">TypeScript</td><td className="border p-2">5.x</td><td className="border p-2">Type safety</td></tr>
              <tr><td className="border p-2">Tailwind CSS</td><td className="border p-2">3.x</td><td className="border p-2">Utility-first styling</td></tr>
              <tr><td className="border p-2">shadcn/ui</td><td className="border p-2">Latest</td><td className="border p-2">Component library</td></tr>
              <tr><td className="border p-2">Framer Motion</td><td className="border p-2">12.x</td><td className="border p-2">Animaciones</td></tr>
              <tr><td className="border p-2">React Query</td><td className="border p-2">5.x</td><td className="border p-2">Server state management</td></tr>
              <tr><td className="border p-2">React Router</td><td className="border p-2">6.x</td><td className="border p-2">Client-side routing</td></tr>
              <tr><td className="border p-2">React Hook Form</td><td className="border p-2">7.x</td><td className="border p-2">Form handling</td></tr>
              <tr><td className="border p-2">Zod</td><td className="border p-2">3.x</td><td className="border p-2">Schema validation</td></tr>
            </tbody>
          </table>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Backend (Lovable Cloud)</h3>
          <table className="w-full border-collapse border mb-6">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">Componente</th>
                <th className="border p-2 text-left">Tecnología</th>
                <th className="border p-2 text-left">Propósito</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border p-2">Base de Datos</td><td className="border p-2">PostgreSQL 15</td><td className="border p-2">Persistencia de datos</td></tr>
              <tr><td className="border p-2">Autenticación</td><td className="border p-2">Auth integrado</td><td className="border p-2">Gestión de sesiones</td></tr>
              <tr><td className="border p-2">Realtime</td><td className="border p-2">WebSockets</td><td className="border p-2">Actualizaciones en vivo</td></tr>
              <tr><td className="border p-2">Storage</td><td className="border p-2">Object Storage</td><td className="border p-2">Almacenamiento de archivos</td></tr>
              <tr><td className="border p-2">Edge Functions</td><td className="border p-2">Deno Runtime</td><td className="border p-2">Lógica serverless</td></tr>
            </tbody>
          </table>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Servicios Externos</h3>
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">Servicio</th>
                <th className="border p-2 text-left">Región</th>
                <th className="border p-2 text-left">Propósito</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border p-2">Mercado Pago</td><td className="border p-2">AR, BR, PY</td><td className="border p-2">Pagos LATAM</td></tr>
              <tr><td className="border p-2">Stripe</td><td className="border p-2">Global</td><td className="border p-2">Pagos internacionales</td></tr>
              <tr><td className="border p-2">Resend</td><td className="border p-2">Global</td><td className="border p-2">Envío de emails transaccionales</td></tr>
            </tbody>
          </table>
        </section>

        {/* Section 3: Architecture */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">3. Arquitectura del Sistema</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Diagrama de Alto Nivel</h3>
          <pre className="architecture-diagram bg-muted p-4 rounded-lg overflow-x-auto text-xs leading-tight">
{`┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (SPA)                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  Admin  │ │Asistente│ │  Salón  │ │ Cliente │ │Invitado │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
└───────┼──────────┼──────────┼──────────┼──────────┼─────────────┘
        │          │          │          │          │
        ▼          ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API LAYER (Backend)                         │
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
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Object Storage                          │  │
│  │                  (contenido-eventos)                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘`}
          </pre>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Flujo de Datos del Muro Interactivo</h3>
          <pre className="architecture-diagram bg-muted p-4 rounded-lg overflow-x-auto text-xs">
{`┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Invitado │───▶│  Upload  │───▶│ Storage  │───▶│ Database │
│  (móvil) │    │   Page   │    │  Bucket  │    │ contenido│
└──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                      │
                                                      ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Pantalla │◀───│   Muro   │◀───│ Realtime │◀───│ WebSocket│
│(proyector)│    │   Page   │    │  Client  │    │  Server  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘`}
          </pre>
        </section>

        {/* Section 4: Data Model */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">4. Modelo de Datos</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Tablas Principales</h3>
          
          <h4 className="text-lg font-medium mt-4 mb-2">Tabla: profiles</h4>
          <table className="w-full border-collapse border mb-4 text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">Columna</th>
                <th className="border p-2 text-left">Tipo</th>
                <th className="border p-2 text-left">Descripción</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border p-2">id</td><td className="border p-2">UUID (PK)</td><td className="border p-2">Referencia a auth.users</td></tr>
              <tr><td className="border p-2">email</td><td className="border p-2">TEXT</td><td className="border p-2">Email del usuario</td></tr>
              <tr><td className="border p-2">nombre</td><td className="border p-2">TEXT</td><td className="border p-2">Nombre completo</td></tr>
              <tr><td className="border p-2">rol</td><td className="border p-2">ENUM</td><td className="border p-2">super_admin, asistente, salon, cliente</td></tr>
              <tr><td className="border p-2">tenant_id</td><td className="border p-2">UUID (FK)</td><td className="border p-2">Referencia a tenants</td></tr>
            </tbody>
          </table>

          <h4 className="text-lg font-medium mt-4 mb-2">Tabla: eventos</h4>
          <table className="w-full border-collapse border mb-4 text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">Columna</th>
                <th className="border p-2 text-left">Tipo</th>
                <th className="border p-2 text-left">Descripción</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border p-2">id</td><td className="border p-2">UUID (PK)</td><td className="border p-2">Identificador único</td></tr>
              <tr><td className="border p-2">cliente_user_id</td><td className="border p-2">UUID (FK)</td><td className="border p-2">Dueño del evento</td></tr>
              <tr><td className="border p-2">nombre</td><td className="border p-2">TEXT</td><td className="border p-2">Nombre del evento</td></tr>
              <tr><td className="border p-2">tipo</td><td className="border p-2">ENUM</td><td className="border p-2">cumpleanos, casamiento, etc.</td></tr>
              <tr><td className="border p-2">estado</td><td className="border p-2">ENUM</td><td className="border p-2">programado, activo, finalizado, cancelado</td></tr>
              <tr><td className="border p-2">es_premium</td><td className="border p-2">BOOLEAN</td><td className="border p-2">Tiene funciones IA</td></tr>
              <tr><td className="border p-2">qr_pantalla_token</td><td className="border p-2">TEXT</td><td className="border p-2">Token único para muro</td></tr>
              <tr><td className="border p-2">qr_invitados_token</td><td className="border p-2">TEXT</td><td className="border p-2">Token único para subida</td></tr>
              <tr><td className="border p-2">qr_descarga_token</td><td className="border p-2">TEXT</td><td className="border p-2">Token único para álbum</td></tr>
            </tbody>
          </table>

          <h4 className="text-lg font-medium mt-4 mb-2">Tabla: contenido</h4>
          <table className="w-full border-collapse border mb-4 text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">Columna</th>
                <th className="border p-2 text-left">Tipo</th>
                <th className="border p-2 text-left">Descripción</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border p-2">id</td><td className="border p-2">UUID (PK)</td><td className="border p-2">Identificador único</td></tr>
              <tr><td className="border p-2">evento_id</td><td className="border p-2">UUID (FK)</td><td className="border p-2">Evento asociado</td></tr>
              <tr><td className="border p-2">tipo</td><td className="border p-2">ENUM</td><td className="border p-2">foto, video, mensaje</td></tr>
              <tr><td className="border p-2">url_original</td><td className="border p-2">TEXT</td><td className="border p-2">URL del archivo original</td></tr>
              <tr><td className="border p-2">url_ia</td><td className="border p-2">TEXT</td><td className="border p-2">URL del archivo transformado</td></tr>
              <tr><td className="border p-2">estado_ia</td><td className="border p-2">ENUM</td><td className="border p-2">pendiente, procesando, completado, error</td></tr>
              <tr><td className="border p-2">likes_count</td><td className="border p-2">INT</td><td className="border p-2">Contador de likes</td></tr>
            </tbody>
          </table>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Enums Definidos</h3>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`-- Roles de usuario
CREATE TYPE user_role AS ENUM ('super_admin', 'asistente', 'salon', 'cliente');

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

-- Pasarelas de pago
CREATE TYPE payment_gateway AS ENUM (
  'mercadopago_ar', 'mercadopago_br', 'mercadopago_py', 
  'bancard', 'stripe'
);`}
          </pre>
        </section>

        {/* Section 5: Auth & Authorization */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">5. Sistema de Autenticación y Autorización</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Modelo de Roles (RBAC)</h3>
          <pre className="architecture-diagram bg-muted p-4 rounded-lg overflow-x-auto text-xs">
{`┌─────────────────────────────────────────────────────────────┐
│                      SUPER_ADMIN                            │
│  - Control total del sistema                                │
│  - Gestión de tenants (asistentes y salones)               │
│  - Métricas globales y auditoría                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│     ASISTENTE       │         │       SALON         │
│  - Venta de eventos │         │  - Suscripción      │
│  - Comisión 50-100% │         │    mensual          │
│  - Multi-país       │         │  - Límite eventos   │
└─────────┬───────────┘         └─────────┬───────────┘
          │                               │
          └───────────────┬───────────────┘
                          ▼
              ┌─────────────────────┐
              │      CLIENTE        │
              │  - Dueño del evento │
              │  - Gestión QR codes │
              │  - Moderación       │
              └─────────┬───────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │     INVITADO        │
              │  - Sin registro     │
              │  - Subida contenido │
              │  - Likes            │
              └─────────────────────┘`}
          </pre>

          <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Row Level Security (RLS)</h3>
          <p className="text-muted-foreground mb-4">
            El sistema implementa políticas RLS para cada tabla, asegurando que los usuarios solo puedan acceder a los datos que les corresponden.
          </p>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`-- Ejemplo: Política de eventos
CREATE POLICY "Clients can view own events" 
ON public.eventos FOR SELECT 
USING (auth.uid() = cliente_user_id);

CREATE POLICY "Super admin can view all events" 
ON public.eventos FOR SELECT 
USING (is_super_admin(auth.uid()));`}
          </pre>
        </section>

        {/* Section 6: Edge Functions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">6. Edge Functions (Backend Serverless)</h2>
          
          <table className="w-full border-collapse border mb-6">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">Función</th>
                <th className="border p-2 text-left">Método</th>
                <th className="border p-2 text-left">Propósito</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border p-2">create-payment-preference</td><td className="border p-2">POST</td><td className="border p-2">Crear preferencia de pago MercadoPago</td></tr>
              <tr><td className="border p-2">mp-webhook</td><td className="border p-2">POST</td><td className="border p-2">Webhook para notificaciones MercadoPago</td></tr>
              <tr><td className="border p-2">create-stripe-payment</td><td className="border p-2">POST</td><td className="border p-2">Crear sesión de checkout Stripe</td></tr>
              <tr><td className="border p-2">stripe-webhook</td><td className="border p-2">POST</td><td className="border p-2">Webhook para eventos Stripe</td></tr>
              <tr><td className="border p-2">send-event-qr-emails</td><td className="border p-2">POST</td><td className="border p-2">Enviar emails con códigos QR</td></tr>
              <tr><td className="border p-2">create-test-users</td><td className="border p-2">POST</td><td className="border p-2">Crear usuarios de prueba</td></tr>
            </tbody>
          </table>

          <h3 className="text-xl font-semibold mt-6 mb-3">Flujo de Pago</h3>
          <pre className="architecture-diagram bg-muted p-4 rounded-lg overflow-x-auto text-xs">
{`┌─────────┐     ┌─────────────────┐     ┌─────────────┐
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
└─────────────┘     └─────────────┘     └─────────────┘`}
          </pre>
        </section>

        {/* Section 7: Realtime */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">7. Sistema en Tiempo Real</h2>
          
          <p className="text-muted-foreground mb-4">
            El muro interactivo utiliza WebSockets para recibir actualizaciones en tiempo real cuando se sube nuevo contenido.
          </p>
          
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`// Hook para muro interactivo
const channel = supabase
  .channel(\`muro-\${eventoId}\`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'contenido',
      filter: \`evento_id=eq.\${eventoId}\`
    },
    handleNewContent
  )
  .subscribe();`}
          </pre>

          <h3 className="text-xl font-semibold mt-6 mb-3">Eventos Soportados</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><strong>INSERT</strong>: Nueva foto/video/mensaje subido</li>
            <li><strong>UPDATE</strong>: Foto procesada por IA, contenido moderado</li>
            <li><strong>DELETE</strong>: Contenido eliminado</li>
          </ul>
        </section>

        {/* Section 8: Project Structure */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">8. Estructura del Proyecto</h2>
          
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`src/
├── components/
│   ├── admin/          # Componentes del super admin
│   ├── asistente/      # Componentes del asistente
│   ├── auth/           # Rutas protegidas
│   ├── dashboard/      # Dashboard del cliente
│   ├── events/         # Wizard de creación
│   ├── layout/         # Layouts principales
│   ├── muro/           # Componentes del muro
│   ├── salon/          # Componentes del salón
│   ├── ui/             # shadcn/ui components
│   └── upload/         # Formularios de subida
├── contexts/
│   └── AuthContext.tsx # Contexto de autenticación
├── hooks/
│   ├── useAdminData.ts
│   ├── useAsistenteData.ts
│   ├── useEventDetails.ts
│   ├── useMuroRealtime.ts
│   ├── useSalonData.ts
│   └── useUserEvents.ts
├── pages/
│   ├── AdminPage.tsx
│   ├── AsistentePage.tsx
│   ├── AuthPage.tsx
│   ├── DashboardPage.tsx
│   ├── MuroPage.tsx
│   ├── SalonPage.tsx
│   └── UploadPage.tsx
├── types/
│   └── index.ts        # Tipos TypeScript
└── lib/
    ├── constants.ts    # Configuración global
    ├── utils.ts        # Utilidades
    └── validations/    # Schemas Zod

supabase/
└── functions/
    ├── create-payment-preference/
    ├── create-stripe-payment/
    ├── create-test-users/
    ├── mp-webhook/
    ├── send-event-qr-emails/
    └── stripe-webhook/`}
          </pre>
        </section>

        {/* Section 9: Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">9. Funcionalidades Implementadas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">✅ Muro Interactivo</h3>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li>Carrusel de fotos con animaciones</li>
                <li>Mensajes flotantes en tiempo real</li>
                <li>Sistema de likes</li>
                <li>Banner personalizable</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">✅ Sistema QR</h3>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li>3 códigos QR únicos por evento</li>
                <li>Envío por email automático</li>
                <li>Página de descarga sin registro</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">✅ Dashboard Cliente</h3>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li>Wizard de creación en 4 pasos</li>
                <li>Gestión de eventos</li>
                <li>Moderación de contenido</li>
                <li>Estadísticas en tiempo real</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">✅ Pagos Multi-región</h3>
              <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                <li>Mercado Pago (AR, BR, PY)</li>
                <li>Stripe (Global)</li>
                <li>Webhooks automatizados</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 10: Roadmap */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">10. Pendientes y Roadmap</h2>
          
          <h3 className="text-lg font-semibold mt-4 mb-2">🔴 Prioridad Crítica</h3>
          <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
            <li>Migrar sistema de roles a tabla user_roles con funciones SECURITY DEFINER</li>
            <li>Corregir webhooks de pago (8 pagos pendientes vs 0 aprobados)</li>
            <li>Agregar estado 'pausado' al enum event_status</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4 mb-2">🟠 Prioridad Alta</h3>
          <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
            <li>Restringir RLS en profiles (emails/teléfonos) y eventos (montos de pago)</li>
            <li>Implementar likes aleatorios automáticos en el muro</li>
            <li>Validación de límite de eventos para salones</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4 mb-2">🟡 Funcionalidades Futuras</h3>
          <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
            <li>Transformaciones de IA para fotos (caricatura, futurista, etc.)</li>
            <li>Geolocalización de eventos</li>
            <li>Pausar/reanudar eventos</li>
          </ul>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
          <p><strong>PICKEVENT</strong> - Informe Técnico v1.0</p>
          <p>Generado: Enero 2026</p>
        </footer>
      </div>
    </>
  );
};

export default TechnicalReportPage;
