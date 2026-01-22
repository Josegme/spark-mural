/**
 * PICKEVENT - Testing Guide Page
 * Complete testing checklist for pre-launch verification
 */

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Users, 
  Calendar, 
  Shield, 
  Mail, 
  Settings, 
  CheckCircle2,
  AlertTriangle,
  Rocket,
  Download,
  RefreshCcw,
  ClipboardList
} from 'lucide-react';
import { TestingChecklistSection, TestCardInfo } from '@/components/testing';
import { toast } from 'sonner';

// Checklist data definitions
const paymentsMPChecklist = [
  { id: 'mp-superadmin', label: 'Pago de evento como Super Admin → Usa TU cuenta MP', critical: true },
  { id: 'mp-asistente', label: 'Pago de evento a Asistente AR → Usa cuenta del asistente', critical: true },
  { id: 'mp-subscription', label: 'Pago de suscripción de Salón AR → Usa TU cuenta MP', critical: true },
  { id: 'mp-webhook', label: 'Webhook de Mercado Pago recibido correctamente' },
  { id: 'mp-pagos-update', label: 'Estado del pago actualizado en tabla `pagos`' },
  { id: 'mp-notification', label: 'Notificación enviada al cliente' },
];

const paymentsStripeChecklist = [
  { id: 'stripe-event', label: 'Pago de evento en NZ → Usa Stripe', critical: true },
  { id: 'stripe-subscription', label: 'Pago de suscripción global → Usa TU cuenta Stripe', critical: true },
  { id: 'stripe-webhook', label: 'Webhook de Stripe recibido correctamente' },
  { id: 'stripe-status', label: 'Estado actualizado correctamente' },
];

const superAdminChecklist = [
  { id: 'sa-login', label: 'Login exitoso con rol superadmin', critical: true },
  { id: 'sa-dashboard', label: 'Dashboard muestra métricas generales' },
  { id: 'sa-create-asistente', label: 'Puedo crear nuevo Asistente' },
  { id: 'sa-create-salon', label: 'Puedo crear nuevo Salón' },
  { id: 'sa-assign-plan', label: 'Puedo asignar plan a un Salón' },
  { id: 'sa-view-payments', label: 'Puedo ver TODOS los pagos (míos + de tenants)' },
  { id: 'sa-view-tenants', label: 'Puedo ver lista de Asistentes y Salones' },
  { id: 'sa-toggle-tenants', label: 'Puedo activar/desactivar tenants' },
  { id: 'sa-rendiciones', label: 'Puedo ver comisiones pendientes (tabla rendiciones)' },
  { id: 'sa-own-event', label: 'Puedo crear evento propio y cobrarlo con MI cuenta MP' },
];

const asistenteChecklist = [
  { id: 'as-login', label: 'Login exitoso con rol asistente', critical: true },
  { id: 'as-dashboard', label: 'Dashboard muestra solo MIS eventos' },
  { id: 'as-create-event', label: 'Puedo crear evento nuevo (wizard completo)' },
  { id: 'as-config-price', label: 'Puedo configurar precio del evento' },
  { id: 'as-mp-config', label: 'Puedo configurar mis credenciales de Mercado Pago' },
  { id: 'as-payment-routing', label: 'Cliente paga mi evento → dinero va a MI cuenta MP', critical: true },
  { id: 'as-view-payments', label: 'Veo lista de MIS pagos recibidos' },
  { id: 'as-commissions', label: 'Veo mis comisiones pendientes al super admin' },
  { id: 'as-isolation', label: 'No veo datos de otros asistentes/salones', critical: true },
];

const salonActiveChecklist = [
  { id: 'salon-login', label: 'Login exitoso con rol salon', critical: true },
  { id: 'salon-subscription', label: 'Dashboard muestra estado de suscripción' },
  { id: 'salon-limit', label: 'Puedo crear eventos hasta el límite mensual' },
  { id: 'salon-credentials', label: 'Puedo configurar mis credenciales de pago' },
  { id: 'salon-calendar', label: 'Puedo ver calendario de eventos del salón' },
  { id: 'salon-reservations', label: 'Clientes pueden reservar servicios en mi salón' },
  { id: 'salon-payment-routing', label: 'Pagos de reservas van a MI cuenta', critical: true },
  { id: 'salon-alert', label: 'Veo alerta X días antes de vencimiento de suscripción' },
  { id: 'salon-renew', label: 'Puedo renovar suscripción desde el dashboard' },
];

const salonExpiredChecklist = [
  { id: 'salon-block', label: 'Sistema bloquea creación de nuevos eventos', critical: true },
  { id: 'salon-message', label: 'Muestra mensaje: "Tu suscripción ha vencido"' },
  { id: 'salon-renew-button', label: 'Botón "Renovar Suscripción" visible' },
  { id: 'salon-readonly', label: 'Eventos existentes siguen visibles (modo lectura)' },
];

const clientChecklist = [
  { id: 'client-view', label: 'Puedo ver eventos públicos' },
  { id: 'client-reserve', label: 'Puedo reservar un evento' },
  { id: 'client-payment', label: 'Proceso de pago funciona (MP o Stripe según país)' },
  { id: 'client-email', label: 'Recibo confirmación por email' },
  { id: 'client-history', label: 'Puedo ver mis reservas (si me registro después)' },
];

const eventWizardChecklist = [
  { id: 'wizard-type', label: 'Paso 1: Tipo de evento (selección funciona)' },
  { id: 'wizard-info', label: 'Paso 2: Información básica (título, descripción)' },
  { id: 'wizard-date', label: 'Paso 3: Fecha y hora (calendario funciona)' },
  { id: 'wizard-location', label: 'Paso 4: Ubicación (mapa, dirección)' },
  { id: 'wizard-price', label: 'Paso 5: Precio (puede ser gratis o de pago)' },
  { id: 'wizard-payment', label: 'Paso 6: Configuración de pagos', description: 'Verifica routing correcto según tenant/superadmin' },
  { id: 'wizard-review', label: 'Paso 7: Revisión y confirmación' },
  { id: 'wizard-success', label: 'Evento creado exitosamente' },
  { id: 'wizard-visible', label: 'Evento visible en el dashboard' },
];

const paymentFlowChecklist = [
  { id: 'flow-select', label: 'Cliente selecciona evento' },
  { id: 'flow-reserve', label: 'Click en "Reservar" o "Comprar"' },
  { id: 'flow-detect', label: 'Sistema detecta país del evento/tenant' },
  { id: 'flow-redirect', label: 'Redirige a checkout correcto (MP o Stripe)' },
  { id: 'flow-complete', label: 'Cliente completa pago en pasarela externa' },
  { id: 'flow-webhook', label: 'Webhook recibido y procesado', critical: true },
  { id: 'flow-status', label: 'Estado actualizado: pagos.estado = \'aprobado\'', critical: true },
  { id: 'flow-email', label: 'Email de confirmación enviado' },
  { id: 'flow-success', label: 'Cliente redirigido a /pago-exitoso' },
  { id: 'flow-history', label: 'Evento aparece en "Mis Reservas" del cliente' },
];

const authChecklist = [
  { id: 'auth-login', label: 'Login/Registro funciona', critical: true },
  { id: 'auth-roles', label: 'Roles (superadmin, asistente, salon, cliente) funcionan', critical: true },
  { id: 'auth-rls', label: 'RLS policies protegen datos por tenant', critical: true },
  { id: 'auth-reset', label: 'Reset de contraseña funciona' },
];

const tenantChecklist = [
  { id: 'tenant-create-asistente', label: 'Crear asistente' },
  { id: 'tenant-create-salon', label: 'Crear salón' },
  { id: 'tenant-toggle', label: 'Activar/desactivar tenants' },
  { id: 'tenant-list', label: 'Ver lista de tenants' },
];

const eventsFeaturesChecklist = [
  { id: 'event-create', label: 'Crear evento (wizard completo)' },
  { id: 'event-edit', label: 'Editar evento' },
  { id: 'event-delete', label: 'Eliminar evento' },
  { id: 'event-public', label: 'Ver eventos públicos' },
  { id: 'event-calendar', label: 'Calendario de eventos' },
  { id: 'event-filters', label: 'Filtros por fecha/ubicación/tipo' },
];

const paymentsFeatureChecklist = [
  { id: 'pay-mp-ar', label: 'Integración Mercado Pago Argentina (TEST)', critical: true },
  { id: 'pay-stripe', label: 'Integración Stripe (TEST)', critical: true },
  { id: 'pay-webhook-mp', label: 'Webhooks MP funcionando' },
  { id: 'pay-webhook-stripe', label: 'Webhooks Stripe funcionando' },
  { id: 'pay-multitenant', label: 'Multi-tenant payments (cada tenant su cuenta)', critical: true },
  { id: 'pay-subscriptions', label: 'Pagos de suscripciones van al Super Admin' },
  { id: 'pay-events', label: 'Pagos de eventos van al tenant correspondiente' },
  { id: 'pay-table', label: 'Tabla `pagos` actualizada correctamente' },
  { id: 'pay-encrypted', label: 'Credenciales cifradas en DB' },
];

const notificationsChecklist = [
  { id: 'notif-confirm', label: 'Email de confirmación de reserva' },
  { id: 'notif-reminder', label: 'Email de recordatorio de evento' },
  { id: 'notif-expiry', label: 'Email de vencimiento de suscripción' },
  { id: 'notif-resend', label: 'Integración Resend configurada' },
];

const subscriptionsChecklist = [
  { id: 'sub-plans', label: 'Planes definidos (Básico/Premium/Enterprise)' },
  { id: 'sub-checkout', label: 'Checkout de suscripción' },
  { id: 'sub-auto-renew', label: 'Renovación automática' },
  { id: 'sub-block', label: 'Bloqueo al vencer' },
  { id: 'sub-reminders', label: 'Recordatorios de vencimiento' },
];

const productionPaymentsChecklist = [
  { id: 'prod-mode', label: 'Cambiar PAYMENT_MODE=production' },
  { id: 'prod-mp-creds', label: 'Configurar credenciales REALES de Mercado Pago' },
  { id: 'prod-stripe-creds', label: 'Configurar credenciales REALES de Stripe' },
  { id: 'prod-webhooks', label: 'Registrar URLs de webhooks en producción' },
  { id: 'prod-test-real', label: 'Probar 1 transacción real de bajo monto', critical: true },
];

const infrastructureChecklist = [
  { id: 'infra-domain', label: 'Dominio personalizado configurado (pickevent.com)' },
  { id: 'infra-ssl', label: 'SSL/HTTPS activo' },
  { id: 'infra-resend', label: 'Resend verificado con dominio real' },
  { id: 'infra-backups', label: 'Backups de base de datos configurados' },
  { id: 'infra-logs', label: 'Logs y monitoreo activo' },
];

const legalChecklist = [
  { id: 'legal-tos', label: 'Términos y Condiciones' },
  { id: 'legal-privacy', label: 'Política de Privacidad' },
  { id: 'legal-refunds', label: 'Política de Reembolsos' },
  { id: 'legal-cookies', label: 'Aviso de cookies (si aplica)' },
  { id: 'legal-compliance', label: 'Compliance con regulaciones locales (AR, BR, NZ)' },
];

const uxChecklist = [
  { id: 'ux-spanish', label: 'Todos los textos en español correcto' },
  { id: 'ux-mobile', label: 'Responsive en mobile' },
  { id: 'ux-images', label: 'Imágenes optimizadas' },
  { id: 'ux-speed', label: 'Tiempos de carga < 3 segundos' },
  { id: 'ux-console', label: 'Sin errores en consola' },
];

export default function TestingGuidePage() {
  const [activeTab, setActiveTab] = useState('payments');

  const resetAllChecklists = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('testing-checklist-'));
    keys.forEach(k => localStorage.removeItem(k));
    toast.success('Todos los checklists han sido reiniciados');
    window.location.reload();
  };

  const exportToMarkdown = () => {
    const sections = [
      { title: 'Pagos MP', items: paymentsMPChecklist },
      { title: 'Pagos Stripe', items: paymentsStripeChecklist },
      { title: 'Super Admin', items: superAdminChecklist },
      { title: 'Asistente', items: asistenteChecklist },
      { title: 'Salón Activo', items: salonActiveChecklist },
      { title: 'Salón Vencido', items: salonExpiredChecklist },
      { title: 'Cliente', items: clientChecklist },
      { title: 'Wizard Evento', items: eventWizardChecklist },
      { title: 'Flujo de Pago', items: paymentFlowChecklist },
    ];

    let markdown = '# PICKEVENT - Checklist de Testing\n\n';
    markdown += `Exportado: ${new Date().toLocaleString('es-AR')}\n\n`;

    sections.forEach(section => {
      markdown += `## ${section.title}\n\n`;
      section.items.forEach(item => {
        const storageKey = `testing-checklist-${section.title.toLowerCase().replace(/\s/g, '-')}`;
        const saved = localStorage.getItem(storageKey);
        const checked = saved ? JSON.parse(saved).includes(item.id) : false;
        markdown += `- [${checked ? 'x' : ' '}] ${item.label}\n`;
      });
      markdown += '\n';
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pickevent-testing-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Checklist exportado a Markdown');
  };

  return (
    <MainLayout showHeader={false} showFooter={false}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-8 w-8 text-primary" />
                  <h1 className="text-2xl font-bold">Guía de Testing</h1>
                  <Badge variant="secondary">Pre-Launch</Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                  Verifica cada funcionalidad antes de lanzar a producción
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetAllChecklists}>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Reiniciar Todo
                </Button>
                <Button variant="outline" onClick={exportToMarkdown}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar MD
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
              <TabsTrigger value="payments">
                <CreditCard className="h-4 w-4 mr-2" />
                Pagos
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="events">
                <Calendar className="h-4 w-4 mr-2" />
                Eventos
              </TabsTrigger>
              <TabsTrigger value="launch">
                <Rocket className="h-4 w-4 mr-2" />
                Lanzamiento
              </TabsTrigger>
            </TabsList>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <TestCardInfo provider="mercadopago" />
                <TestCardInfo provider="stripe" />
              </div>

              <div className="grid gap-4">
                <TestingChecklistSection
                  id="payments-mp"
                  title="Mercado Pago (Argentina)"
                  icon={<CreditCard className="h-5 w-5 text-primary" />}
                  items={paymentsMPChecklist}
                  defaultExpanded
                />
                <TestingChecklistSection
                  id="payments-stripe"
                  title="Stripe (Internacional)"
                  icon={<CreditCard className="h-5 w-5 text-primary" />}
                  items={paymentsStripeChecklist}
                />
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <TestingChecklistSection
                id="users-superadmin"
                title="Como SUPER ADMIN"
                icon={<Shield className="h-5 w-5 text-primary" />}
                items={superAdminChecklist}
                defaultExpanded
              />
              <TestingChecklistSection
                id="users-asistente"
                title="Como ASISTENTE (Argentina)"
                icon={<Users className="h-5 w-5 text-primary" />}
                items={asistenteChecklist}
              />
              <TestingChecklistSection
                id="users-salon-active"
                title="Como SALÓN (con suscripción activa)"
                icon={<Calendar className="h-5 w-5 text-primary" />}
                items={salonActiveChecklist}
              />
              <TestingChecklistSection
                id="users-salon-expired"
                title="Como SALÓN (sin suscripción o vencida)"
                icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
                items={salonExpiredChecklist}
              />
              <TestingChecklistSection
                id="users-client"
                title="Como CLIENTE (usuario final)"
                icon={<Users className="h-5 w-5 text-primary" />}
                items={clientChecklist}
              />
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-4">
              <TestingChecklistSection
                id="events-wizard"
                title="Crear Evento - Wizard Completo"
                icon={<Calendar className="h-5 w-5 text-primary" />}
                items={eventWizardChecklist}
                defaultExpanded
              />
              <TestingChecklistSection
                id="events-payment-flow"
                title="Proceso de Pago de un Evento"
                icon={<CreditCard className="h-5 w-5 text-primary" />}
                items={paymentFlowChecklist}
              />
            </TabsContent>

            {/* Launch Tab */}
            <TabsContent value="launch" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Funcionalidades Core
                  </CardTitle>
                  <CardDescription>
                    Debe estar TODO en verde antes de lanzar
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid gap-4">
                <TestingChecklistSection
                  id="launch-auth"
                  title="Autenticación y Roles"
                  icon={<Shield className="h-5 w-5 text-primary" />}
                  items={authChecklist}
                  defaultExpanded
                />
                <TestingChecklistSection
                  id="launch-tenants"
                  title="Gestión de Tenants"
                  icon={<Users className="h-5 w-5 text-primary" />}
                  items={tenantChecklist}
                />
                <TestingChecklistSection
                  id="launch-events"
                  title="Eventos"
                  icon={<Calendar className="h-5 w-5 text-primary" />}
                  items={eventsFeaturesChecklist}
                />
                <TestingChecklistSection
                  id="launch-payments"
                  title="Pagos"
                  icon={<CreditCard className="h-5 w-5 text-primary" />}
                  items={paymentsFeatureChecklist}
                />
                <TestingChecklistSection
                  id="launch-notifications"
                  title="Notificaciones"
                  icon={<Mail className="h-5 w-5 text-primary" />}
                  items={notificationsChecklist}
                />
                <TestingChecklistSection
                  id="launch-subscriptions"
                  title="Suscripciones de Salones"
                  icon={<Settings className="h-5 w-5 text-primary" />}
                  items={subscriptionsChecklist}
                />
              </div>

              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Pendiente para Producción
                  </CardTitle>
                  <CardDescription>
                    Completar antes de ir LIVE
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid gap-4">
                <TestingChecklistSection
                  id="prod-payments"
                  title="Pagos (Producción)"
                  icon={<CreditCard className="h-5 w-5 text-destructive" />}
                  items={productionPaymentsChecklist}
                />
                <TestingChecklistSection
                  id="prod-infra"
                  title="Infraestructura"
                  icon={<Settings className="h-5 w-5 text-destructive" />}
                  items={infrastructureChecklist}
                />
                <TestingChecklistSection
                  id="prod-legal"
                  title="Legal y Compliance"
                  icon={<Shield className="h-5 w-5 text-destructive" />}
                  items={legalChecklist}
                />
                <TestingChecklistSection
                  id="prod-ux"
                  title="UX/UI Final"
                  icon={<CheckCircle2 className="h-5 w-5 text-destructive" />}
                  items={uxChecklist}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
