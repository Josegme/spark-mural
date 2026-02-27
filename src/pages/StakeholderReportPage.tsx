/**
 * PICKEVENT - Informe para Stakeholders (PDF Exportable)
 * Optimizado para impresión/exportación a PDF vía Ctrl+P
 */

import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StakeholderReportPage() {
  return (
    <>
      {/* Print controls - hidden in print */}
      <div className="print:hidden sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          </Link>
          <Button onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="report-container">
        {/* Cover Page */}
        <section className="report-cover">
          <div className="report-cover-content">
            <div className="report-logo-badge">PickEvent</div>
            <h1 className="report-cover-title">Informe para Stakeholders</h1>
            <p className="report-cover-subtitle">
              Plataforma SaaS de Muros Interactivos para Eventos
            </p>
            <div className="report-cover-meta">
              <span>Versión 1.0</span>
              <span className="report-cover-divider">•</span>
              <span>Febrero 2026</span>
              <span className="report-cover-divider">•</span>
              <span>Confidencial</span>
            </div>
          </div>
        </section>

        {/* Page 1: Overview */}
        <section className="report-page">
          <h2 className="report-h2">1. Resumen Ejecutivo</h2>
          <p className="report-text">
            <strong>PickEvent</strong> es una plataforma SaaS de <strong>muros interactivos en tiempo real</strong> para eventos. 
            Los invitados escanean un código QR desde su celular (sin instalar ninguna app), suben fotos, videos y mensajes que 
            aparecen <strong>instantáneamente</strong> en la pantalla del evento. Todo el contenido queda disponible como 
            álbum digital descargable durante 30 días.
          </p>

          <h3 className="report-h3">Propuesta de Valor</h3>
          <div className="report-grid-3">
            <div className="report-value-card">
              <div className="report-value-icon">📱</div>
              <strong>Sin App</strong>
              <p>Solo QR + navegador</p>
            </div>
            <div className="report-value-card">
              <div className="report-value-icon">⚡</div>
              <strong>Tiempo Real</strong>
              <p>WebSockets instantáneos</p>
            </div>
            <div className="report-value-card">
              <div className="report-value-icon">🎨</div>
              <strong>IA Generativa</strong>
              <p>11 estilos artísticos</p>
            </div>
            <div className="report-value-card">
              <div className="report-value-icon">🌎</div>
              <strong>Multi-país</strong>
              <p>AR, BR, PY + Global</p>
            </div>
            <div className="report-value-card">
              <div className="report-value-icon">💼</div>
              <strong>Multi-modelo</strong>
              <p>B2C + B2B + Comisiones</p>
            </div>
            <div className="report-value-card">
              <div className="report-value-icon">🔒</div>
              <strong>Seguro</strong>
              <p>RLS + Auth + Roles</p>
            </div>
          </div>

          <h2 className="report-h2 mt-8">2. ¿Cómo Funciona?</h2>
          <div className="report-flow">
            <div className="report-flow-step">
              <div className="report-flow-number">1</div>
              <strong>Crear Evento</strong>
              <p>Fecha, duración, personalización</p>
            </div>
            <div className="report-flow-arrow">→</div>
            <div className="report-flow-step">
              <div className="report-flow-number">2</div>
              <strong>Recibir 3 QR</strong>
              <p>Pantalla, Invitados, Descarga</p>
            </div>
            <div className="report-flow-arrow">→</div>
            <div className="report-flow-step">
              <div className="report-flow-number">3</div>
              <strong>Evento en Vivo</strong>
              <p>Fotos y mensajes instantáneos</p>
            </div>
            <div className="report-flow-arrow">→</div>
            <div className="report-flow-step">
              <div className="report-flow-number">4</div>
              <strong>Álbum Digital</strong>
              <p>Descarga por 30 días</p>
            </div>
          </div>
        </section>

        {/* Page 2: Business Model */}
        <section className="report-page">
          <h2 className="report-h2">3. Modelo de Negocio</h2>

          <h3 className="report-h3">3.1 Eventos Individuales (B2C)</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Precio</th>
                <th>Incluye</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Básico</strong></td>
                <td>ARS $110.000</td>
                <td>Muro en vivo, 3 QR, fotos/videos ilimitados, mensajes flotantes, álbum 30 días</td>
              </tr>
              <tr>
                <td><strong>Premium + IA</strong></td>
                <td>ARS $153.000</td>
                <td>Todo lo básico + IA generativa (11 estilos artísticos)</td>
              </tr>
            </tbody>
          </table>

          <h3 className="report-h3">3.2 Suscripciones para Salones (B2B)</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Precio/mes</th>
                <th>Límite</th>
                <th>Incluye</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Starter</strong></td>
                <td>ARS $150.000</td>
                <td>10/mes</td>
                <td>Muro + QR + Álbum + Soporte email</td>
              </tr>
              <tr>
                <td><strong>Profesional</strong></td>
                <td>ARS $290.000</td>
                <td>20/mes</td>
                <td>Starter + IA + Personalización + Soporte prioritario</td>
              </tr>
              <tr>
                <td><strong>Ilimitado</strong></td>
                <td>ARS $457.000</td>
                <td>Sin límite</td>
                <td>Profesional + API + White-label + Soporte 24/7</td>
              </tr>
            </tbody>
          </table>

          <h3 className="report-h3">3.3 Modelo Asistente Comercial</h3>
          <p className="report-text">
            Vendedores independientes con comisiones configurables (50-100%), sistema de rendiciones 
            y capacidad de operar en múltiples países. Generan links de pago para clientes y reciben 
            su comisión automáticamente.
          </p>
        </section>

        {/* Page 3: Roles & Features */}
        <section className="report-page">
          <h2 className="report-h2">4. Roles de Usuario</h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>Rol</th>
                <th>Descripción</th>
                <th>Acceso</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Super Admin</strong></td>
                <td>Control total: tenants, métricas globales, auditoría, rendiciones</td>
                <td>/admin</td>
              </tr>
              <tr>
                <td><strong>Asistente</strong></td>
                <td>Vendedor comercial: venta de eventos, links de pago, comisiones</td>
                <td>/asistente</td>
              </tr>
              <tr>
                <td><strong>Salón</strong></td>
                <td>Salón de fiestas: suscripción mensual, calendario, límite según plan</td>
                <td>/salon</td>
              </tr>
              <tr>
                <td><strong>Cliente</strong></td>
                <td>Dueño del evento: QR codes, moderación, descarga álbum</td>
                <td>/dashboard</td>
              </tr>
              <tr>
                <td><strong>Invitado</strong></td>
                <td>Sin registro: escanea QR, sube fotos/videos/mensajes, da likes</td>
                <td>/subir/:token</td>
              </tr>
            </tbody>
          </table>

          <h2 className="report-h2 mt-8">5. Funcionalidades Clave</h2>
          <div className="report-grid-2">
            <div className="report-feature-card">
              <h4>🖥️ Muro Interactivo en Tiempo Real</h4>
              <ul>
                <li>Carrusel de fotos con transiciones (5s)</li>
                <li>Mensajes flotantes animados (150 chars)</li>
                <li>Likes interactivos</li>
                <li>Full-screen para proyección</li>
              </ul>
            </div>
            <div className="report-feature-card">
              <h4>📲 Sistema de QR Codes</h4>
              <ul>
                <li>3 QR únicos por evento</li>
                <li>Envío automático por email</li>
                <li>Tokens de seguridad</li>
                <li>Diseño branded en emails</li>
              </ul>
            </div>
            <div className="report-feature-card">
              <h4>🎨 IA Generativa (Premium)</h4>
              <ul>
                <li>11 estilos: Caricatura, Cómic, Anime...</li>
                <li>Transformación de fotos en tiempo real</li>
                <li>Powered by Google Gemini</li>
                <li>Original + transformada disponibles</li>
              </ul>
            </div>
            <div className="report-feature-card">
              <h4>💳 Sistema de Pagos</h4>
              <ul>
                <li>Mercado Pago: AR, BR, PY</li>
                <li>Stripe: Internacional</li>
                <li>Webhooks automáticos</li>
                <li>Gestión de suscripciones</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Page 4: Tech & Markets */}
        <section className="report-page">
          <h2 className="report-h2">6. Stack Tecnológico</h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>Capa</th>
                <th>Tecnología</th>
                <th>Propósito</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Frontend</td><td>React 18 + TypeScript + Tailwind CSS</td><td>Interfaz de usuario</td></tr>
              <tr><td>Backend</td><td>Lovable Cloud (PostgreSQL + Edge Functions)</td><td>API + Lógica + DB</td></tr>
              <tr><td>Realtime</td><td>WebSockets</td><td>Contenido en vivo</td></tr>
              <tr><td>Pagos</td><td>Mercado Pago + Stripe</td><td>Cobros multi-país</td></tr>
              <tr><td>Emails</td><td>Resend</td><td>Emails transaccionales</td></tr>
              <tr><td>IA</td><td>Google Gemini</td><td>Transformación de fotos</td></tr>
            </tbody>
          </table>

          <h2 className="report-h2 mt-8">7. Tipos de Evento Soportados</h2>
          <div className="report-event-types">
            <span>🎂 Cumpleaños</span>
            <span>💍 Casamiento</span>
            <span>🎓 Graduación</span>
            <span>🏢 Corporativo</span>
            <span>🎉 Fiesta Temática</span>
            <span>✨ Otro</span>
          </div>

          <h2 className="report-h2 mt-8">8. Mercados Objetivo</h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>Segmento</th>
                <th>Modelo</th>
                <th>Ticket Promedio</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Consumidor final</td><td>Pago por evento</td><td>$110K - $153K ARS</td></tr>
              <tr><td>Salones de fiestas</td><td>Suscripción mensual</td><td>$150K - $457K ARS/mes</td></tr>
              <tr><td>Organizadores</td><td>Comisiones por venta</td><td>50-100% del evento</td></tr>
              <tr><td>Corporativo</td><td>Enterprise personalizado</td><td>A medida</td></tr>
            </tbody>
          </table>

          <h2 className="report-h2 mt-8">9. Seguridad</h2>
          <div className="report-grid-3">
            <div className="report-security-item">
              <strong>🔐 Row Level Security</strong>
              <p>Políticas RLS en todas las tablas</p>
            </div>
            <div className="report-security-item">
              <strong>🛡️ Autenticación</strong>
              <p>Email verificado + sesiones seguras</p>
            </div>
            <div className="report-security-item">
              <strong>👥 RBAC</strong>
              <p>5 roles con permisos granulares</p>
            </div>
          </div>
        </section>

        {/* Footer on every page */}
        <div className="report-footer">
          <span>PickEvent © 2026 — Confidencial</span>
          <span>www.pickevent.com</span>
        </div>
      </div>
    </>
  );
}
