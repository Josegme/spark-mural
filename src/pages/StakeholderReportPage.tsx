/**
 * PICKEVENT - Informe Completo (PDF Exportable)
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
            <h1 className="report-cover-title">Informe Completo de Producto</h1>
            <p className="report-cover-subtitle">
              Plataforma SaaS de Muros Interactivos para Eventos
            </p>
            <div className="report-cover-meta">
              <span>Versión 1.0</span>
              <span className="report-cover-divider">•</span>
              <span>Marzo 2026</span>
              <span className="report-cover-divider">•</span>
              <span>pickevent.site</span>
            </div>
          </div>
        </section>

        {/* Section 1: ¿Qué es PickEvent? */}
        <section className="report-page">
          <h2 className="report-h2">1. ¿Qué es PickEvent?</h2>
          <p className="report-text">
            <strong>PickEvent</strong> es una plataforma digital que transforma cualquier evento en una 
            experiencia interactiva y colaborativa. Funciona como un <strong>muro en tiempo real</strong> donde 
            los invitados pueden subir fotos, videos y mensajes desde su celular — sin descargar ninguna aplicación — 
            y todo aparece instantáneamente en la pantalla del evento.
          </p>
          <p className="report-text">
            El organizador crea su evento en la plataforma, recibe <strong>3 códigos QR únicos</strong> y los comparte 
            con sus invitados. A partir de ese momento, cada foto, video o mensaje que suban los invitados se proyecta 
            en vivo en el muro del evento, creando una experiencia compartida, dinámica y memorable.
          </p>
          <p className="report-text">
            Al finalizar el evento, todo el contenido queda disponible como un <strong>álbum digital descargable</strong> 
            durante 30 días, permitiendo que todos los participantes conserven los recuerdos.
          </p>

          <h3 className="report-h3">¿Cómo funciona en 4 pasos?</h3>
          <div className="report-flow">
            <div className="report-flow-step">
              <div className="report-flow-number">1</div>
              <strong>Crear Evento</strong>
              <p>Nombre, fecha, duración y personalización</p>
            </div>
            <div className="report-flow-arrow">→</div>
            <div className="report-flow-step">
              <div className="report-flow-number">2</div>
              <strong>Recibir 3 QR</strong>
              <p>Pantalla, Invitados y Descarga</p>
            </div>
            <div className="report-flow-arrow">→</div>
            <div className="report-flow-step">
              <div className="report-flow-number">3</div>
              <strong>Evento en Vivo</strong>
              <p>Los invitados suben contenido en tiempo real</p>
            </div>
            <div className="report-flow-arrow">→</div>
            <div className="report-flow-step">
              <div className="report-flow-number">4</div>
              <strong>Álbum Digital</strong>
              <p>Descarga disponible por 30 días</p>
            </div>
          </div>

          <h3 className="report-h3">Los 3 códigos QR</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>QR</th>
                <th>Propósito</th>
                <th>¿Quién lo usa?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>📺 QR Pantalla</strong></td>
                <td>Abre el muro interactivo en la TV o proyector del evento</td>
                <td>El organizador / DJ / salón</td>
              </tr>
              <tr>
                <td><strong>📱 QR Invitados</strong></td>
                <td>Permite a los invitados subir fotos, videos y mensajes</td>
                <td>Todos los invitados</td>
              </tr>
              <tr>
                <td><strong>📥 QR Descarga</strong></td>
                <td>Accede al álbum digital para descargar todo el contenido</td>
                <td>Invitados y organizador</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 2: Valor Agregado */}
        <section className="report-page">
          <h2 className="report-h2">2. Valor Agregado</h2>
          <p className="report-text">
            PickEvent no es solo una herramienta tecnológica, es una <strong>nueva forma de vivir los eventos</strong>. 
            El valor que aporta se refleja en múltiples dimensiones:
          </p>

          <div className="report-grid-2">
            <div className="report-feature-card">
              <h4>🎉 Para el Organizador</h4>
              <ul>
                <li>Diferencial competitivo: ofrece algo único que otros eventos no tienen</li>
                <li>Contenido generado por los invitados sin esfuerzo</li>
                <li>Álbum digital automático con todo lo capturado</li>
                <li>Estadísticas del evento: fotos, videos, mensajes, likes</li>
                <li>Setup en minutos, sin técnicos ni equipamiento extra</li>
              </ul>
            </div>
            <div className="report-feature-card">
              <h4>📱 Para los Invitados</h4>
              <ul>
                <li>Participación activa: pasan de ser espectadores a protagonistas</li>
                <li>No necesitan descargar ninguna app — solo escanean el QR</li>
                <li>Ven sus fotos aparecer al instante en la pantalla del evento</li>
                <li>Los likes se generan automáticamente, creando un efecto visual dinámico</li>
                <li>Acceden al álbum completo después del evento</li>
              </ul>
            </div>
            <div className="report-feature-card">
              <h4>🏢 Para Salones de Fiestas</h4>
              <ul>
                <li>Servicio premium que pueden ofrecer a sus clientes</li>
                <li>Fuente de ingreso adicional o valor agregado incluido</li>
                <li>Gestión centralizada de múltiples eventos</li>
                <li>Calendario integrado con control de disponibilidad</li>
                <li>Reportes de uso y estadísticas mensuales</li>
              </ul>
            </div>
            <div className="report-feature-card">
              <h4>💼 Para Vendedores (Asistentes)</h4>
              <ul>
                <li>Modelo de negocio propio con comisiones por venta</li>
                <li>Generan links de pago para sus clientes</li>
                <li>Dashboards con métricas de ventas y comisiones</li>
                <li>Operan de forma independiente en su zona</li>
                <li>Sin inversión inicial: solo venden y cobran</li>
              </ul>
            </div>
          </div>

          <h3 className="report-h3 mt-8">Beneficios Clave de la Plataforma</h3>
          <div className="report-grid-3">
            <div className="report-value-card">
              <div className="report-value-icon">⚡</div>
              <strong>Tiempo Real</strong>
              <p>Las fotos aparecen en la pantalla en segundos</p>
            </div>
            <div className="report-value-card">
              <div className="report-value-icon">📱</div>
              <strong>Sin App</strong>
              <p>Solo QR + navegador del celular</p>
            </div>
            <div className="report-value-card">
              <div className="report-value-icon">🎨</div>
              <strong>IA Generativa</strong>
              <p>11 estilos artísticos para fotos (Premium)</p>
            </div>
            <div className="report-value-card">
              <div className="report-value-icon">📥</div>
              <strong>Álbum Digital</strong>
              <p>Descarga por 30 días post-evento</p>
            </div>
            <div className="report-value-card">
              <div className="report-value-icon">🎮</div>
              <strong>Juegos en Vivo</strong>
              <p>Mini-juegos interactivos durante el evento</p>
            </div>
            <div className="report-value-card">
              <div className="report-value-icon">🔒</div>
              <strong>Seguro</strong>
              <p>Tokens únicos por evento, contenido protegido</p>
            </div>
          </div>
        </section>

        {/* Section 3: Diferenciación */}
        <section className="report-page">
          <h2 className="report-h2">3. ¿En qué se diferencia PickEvent?</h2>
          <p className="report-text">
            En el mercado existen alternativas como hashtags de Instagram, grupos de WhatsApp o fotógrafos tradicionales.
            PickEvent se diferencia en varios aspectos fundamentales:
          </p>

          <table className="report-table">
            <thead>
              <tr>
                <th>Aspecto</th>
                <th>Alternativas Tradicionales</th>
                <th>PickEvent</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Participación</strong></td>
                <td>Pasiva — cada uno sube a su red social</td>
                <td>Activa — contenido en pantalla al instante</td>
              </tr>
              <tr>
                <td><strong>Instalación</strong></td>
                <td>Requiere apps, cuentas, permisos</td>
                <td>Solo escanear QR, cero instalaciones</td>
              </tr>
              <tr>
                <td><strong>Contenido unificado</strong></td>
                <td>Disperso en múltiples plataformas</td>
                <td>Todo centralizado en un álbum digital</td>
              </tr>
              <tr>
                <td><strong>Experiencia en vivo</strong></td>
                <td>No hay proyección ni interacción grupal</td>
                <td>Muro en pantalla con fotos, mensajes y juegos</td>
              </tr>
              <tr>
                <td><strong>IA creativa</strong></td>
                <td>No disponible</td>
                <td>11 estilos artísticos aplicados a las fotos</td>
              </tr>
              <tr>
                <td><strong>Privacidad</strong></td>
                <td>Contenido público en redes sociales</td>
                <td>Contenido privado, accesible solo con token</td>
              </tr>
              <tr>
                <td><strong>Recuerdos post-evento</strong></td>
                <td>Fotos perdidas en chats y stories</td>
                <td>Álbum descargable completo por 30 días</td>
              </tr>
            </tbody>
          </table>

          <h3 className="report-h3 mt-8">Ventajas Competitivas</h3>
          <div className="report-grid-2">
            <div className="report-feature-card">
              <h4>🌎 Multi-país y Multi-moneda</h4>
              <ul>
                <li>Operación en Argentina, Brasil, Paraguay y mercados internacionales</li>
                <li>Integración con Mercado Pago (LATAM) y Stripe (global)</li>
                <li>Precios configurables por país y moneda</li>
              </ul>
            </div>
            <div className="report-feature-card">
              <h4>📊 Modelo de Negocio Escalable</h4>
              <ul>
                <li>3 modelos simultáneos: B2C, B2B y Revendedores</li>
                <li>Red de vendedores independientes con comisiones</li>
                <li>Suscripciones mensuales para salones de fiestas</li>
              </ul>
            </div>
            <div className="report-feature-card">
              <h4>🤖 Inteligencia Artificial</h4>
              <ul>
                <li>Transformación de fotos con 11 estilos artísticos</li>
                <li>Procesamiento en tiempo real durante el evento</li>
                <li>Se conservan original + versión artística</li>
              </ul>
            </div>
            <div className="report-feature-card">
              <h4>⚙️ Tecnología de Punta</h4>
              <ul>
                <li>WebSockets para contenido instantáneo</li>
                <li>Arquitectura serverless, escalable automáticamente</li>
                <li>Seguridad enterprise: RLS, autenticación, roles</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: Los Usuarios */}
        <section className="report-page">
          <h2 className="report-h2">4. ¿Quiénes son los Usuarios?</h2>
          <p className="report-text">
            PickEvent tiene <strong>5 tipos de usuarios</strong>, cada uno con un rol específico, un flujo de registro 
            diferente y capacidades propias dentro de la plataforma:
          </p>

          <table className="report-table">
            <thead>
              <tr>
                <th>Rol</th>
                <th>¿Quién es?</th>
                <th>¿Cómo se suma?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>🛡️ Super Admin</strong></td>
                <td>El equipo PickEvent — gestión total de la plataforma</td>
                <td>Asignado internamente. No disponible para registro público</td>
              </tr>
              <tr>
                <td><strong>💼 Asistente / Revendedor</strong></td>
                <td>Vendedor independiente que comercializa eventos por comisión</td>
                <td>Invitado por el Super Admin. Se le crea un perfil con acceso al panel de ventas</td>
              </tr>
              <tr>
                <td><strong>🏢 Salón de Fiestas</strong></td>
                <td>Empresa que ofrece PickEvent como servicio a sus clientes</td>
                <td>Se registra en la plataforma y contrata una suscripción mensual</td>
              </tr>
              <tr>
                <td><strong>👤 Cliente Final</strong></td>
                <td>Persona que organiza su evento (cumpleaños, casamiento, etc.)</td>
                <td>Se registra en pickevent.site, crea su evento y paga online</td>
              </tr>
              <tr>
                <td><strong>🎉 Invitado</strong></td>
                <td>Persona que asiste al evento y sube contenido</td>
                <td>Sin registro — escanea el QR del evento y participa al instante</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 5: Capacidades por Usuario */}
        <section className="report-page">
          <h2 className="report-h2">5. ¿Qué puede hacer cada Usuario?</h2>

          <h3 className="report-h3">🛡️ Super Admin</h3>
          <p className="report-text">Control total de la plataforma. Accede desde <strong>/admin</strong>.</p>
          <div className="report-grid-2">
            <div className="report-feature-card">
              <h4>Gestión de la Plataforma</h4>
              <ul>
                <li>Ver métricas globales: eventos, usuarios, ingresos</li>
                <li>Configurar precios de eventos y suscripciones</li>
                <li>Gestionar configuración global del sistema</li>
                <li>Ver logs de auditoría de toda la plataforma</li>
              </ul>
            </div>
            <div className="report-feature-card">
              <h4>Gestión de Usuarios y Tenants</h4>
              <ul>
                <li>Crear, editar y suspender Asistentes y Salones</li>
                <li>Asignar usuarios a tenants (organizaciones)</li>
                <li>Configurar comisiones por Asistente</li>
                <li>Verificar y aprobar rendiciones de comisiones</li>
              </ul>
            </div>
          </div>

          <h3 className="report-h3 mt-8">💼 Asistente / Revendedor</h3>
          <p className="report-text">Vendedor comercial independiente. Accede desde <strong>/asistente</strong>.</p>
          <div className="report-grid-2">
            <div className="report-feature-card">
              <h4>Ventas y Comisiones</h4>
              <ul>
                <li>Crear eventos para sus clientes</li>
                <li>Generar links de pago personalizados</li>
                <li>Ver historial de ventas y comisiones acumuladas</li>
                <li>Enviar rendiciones al Super Admin</li>
              </ul>
            </div>
            <div className="report-feature-card">
              <h4>Gestión de Clientes</h4>
              <ul>
                <li>Ver lista de clientes y sus eventos</li>
                <li>Acceder a estadísticas de eventos vendidos</li>
                <li>Operar en su país asignado (AR, BR, PY, etc.)</li>
                <li>Eventos de cortesía disponibles según acuerdo</li>
              </ul>
            </div>
          </div>

          <h3 className="report-h3 mt-8">🏢 Salón de Fiestas</h3>
          <p className="report-text">Empresa con suscripción mensual. Accede desde <strong>/salon</strong>.</p>
          <div className="report-grid-2">
            <div className="report-feature-card">
              <h4>Gestión de Eventos</h4>
              <ul>
                <li>Crear eventos dentro de su límite mensual</li>
                <li>Calendario visual con eventos programados</li>
                <li>Personalizar cada evento (colores, logo)</li>
                <li>Ver estadísticas de uso del mes</li>
              </ul>
            </div>
            <div className="report-feature-card">
              <h4>Suscripción y Pagos</h4>
              <ul>
                <li>Elegir plan: Starter, Profesional o Ilimitado</li>
                <li>Pago mensual automático por Mercado Pago o Stripe</li>
                <li>Upgrade o downgrade de plan en cualquier momento</li>
                <li>Acceso a soporte según nivel de plan</li>
              </ul>
            </div>
          </div>

          <h3 className="report-h3 mt-8">👤 Cliente Final</h3>
          <p className="report-text">Dueño del evento. Accede desde <strong>/dashboard</strong>.</p>
          <div className="report-grid-2">
            <div className="report-feature-card">
              <h4>Crear y Gestionar su Evento</h4>
              <ul>
                <li>Wizard paso a paso para crear evento</li>
                <li>Elegir tipo: Cumpleaños, Casamiento, Graduación, Corporativo, Fiesta Temática u Otro</li>
                <li>Seleccionar duración (6, 12 o 24 horas)</li>
                <li>Personalizar banner del muro (color, logo)</li>
                <li>Elegir plan: Básico ($110.000) o Premium + IA ($153.000)</li>
              </ul>
            </div>
            <div className="report-feature-card">
              <h4>Durante y Después del Evento</h4>
              <ul>
                <li>Recibir 3 QR por email (Pantalla, Invitados, Descarga)</li>
                <li>Ver estadísticas en tiempo real: fotos, videos, mensajes</li>
                <li>Configurar y lanzar juegos interactivos (ruleta de fotos con reglas/prendas)</li>
                <li>Activar/pausar el evento</li>
                <li>Moderar contenido (aprobar/rechazar fotos y mensajes)</li>
                <li>Descargar álbum completo en ZIP</li>
              </ul>
            </div>
          </div>

          <h3 className="report-h3 mt-8">🎉 Invitado</h3>
          <p className="report-text">Participante del evento. Accede escaneando el <strong>QR Invitados</strong> desde <strong>/subir/:token</strong>. No necesita registrarse.</p>
          <div className="report-grid-2">
            <div className="report-feature-card">
              <h4>Participación en el Evento</h4>
              <ul>
                <li>Subir fotos (JPG, PNG, HEIC, WebP — hasta 10MB)</li>
                <li>Subir videos cortos (MP4, MOV, WebM — hasta 30 seg)</li>
                <li>Enviar mensajes animados (hasta 150 caracteres)</li>
                <li>Ver su contenido aparecer en la pantalla del evento</li>
              </ul>
            </div>
            <div className="report-feature-card">
              <h4>Interacción y Recuerdos</h4>
              <ul>
                <li>Los likes se generan automáticamente en el muro</li>
                <li>Participar en juegos interactivos en vivo (ruleta de fotos)</li>
                <li>Acceder al álbum digital post-evento (30 días)</li>
                <li>Descargar fotos individuales o el álbum completo</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 6: Planes y Precios */}
        <section className="report-page">
          <h2 className="report-h2">6. Planes y Precios</h2>

          <h3 className="report-h3">6.1 Eventos Individuales (B2C)</h3>
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
                <td>Muro en vivo, 3 QR, fotos/videos ilimitados, mensajes flotantes, juegos, álbum 30 días</td>
              </tr>
              <tr>
                <td><strong>Premium + IA</strong></td>
                <td>ARS $153.000</td>
                <td>Todo lo básico + IA generativa (11 estilos artísticos para fotos)</td>
              </tr>
            </tbody>
          </table>

          <h3 className="report-h3">6.2 Suscripciones para Salones (B2B)</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Precio/mes</th>
                <th>Eventos/mes</th>
                <th>Incluye</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Starter</strong></td>
                <td>ARS $150.000</td>
                <td>Hasta 10</td>
                <td>Muro + QR + Álbum + Soporte email</td>
              </tr>
              <tr>
                <td><strong>Profesional</strong></td>
                <td>ARS $290.000</td>
                <td>Hasta 20</td>
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

          <h3 className="report-h3">6.3 Modelo Asistente Comercial</h3>
          <p className="report-text">
            Los Asistentes son vendedores independientes que comercializan eventos de PickEvent y reciben 
            comisiones configurables (50-100%). Generan links de pago para sus clientes, llevan control de 
            sus ventas y realizan rendiciones periódicas al Super Admin.
          </p>
        </section>

        {/* Section 7: Juegos Interactivos */}
        <section className="report-page">
          <h2 className="report-h2">7. Juegos Interactivos en Vivo</h2>
          <p className="report-text">
            Una de las funcionalidades más diferenciadoras de PickEvent es la posibilidad de crear y lanzar 
            <strong> juegos interactivos</strong> durante el evento. El organizador configura dinámicas desde su panel 
            y las controla en tiempo real desde cualquier dispositivo.
          </p>

          <h3 className="report-h3">¿Cómo funciona?</h3>
          <div className="report-grid-3">
            <div className="report-value-card">
              <div className="report-value-icon">🎲</div>
              <strong>Configurar</strong>
              <p>El organizador crea juegos con nombre, cantidad de fotos ganadoras (1-4) y una regla o prenda</p>
            </div>
            <div className="report-value-card">
              <div className="report-value-icon">🚀</div>
              <strong>Lanzar</strong>
              <p>Al activar el juego, aparece en el muro del evento con animaciones y el botón de girar la ruleta</p>
            </div>
            <div className="report-value-card">
              <div className="report-value-icon">🎰</div>
              <strong>Girar y Revelar</strong>
              <p>La ruleta selecciona fotos al azar entre las subidas por los invitados. ¡Los elegidos cumplen la prenda!</p>
            </div>
          </div>

          <p className="report-text mt-4">
            <strong>Ejemplo:</strong> El organizador crea un juego llamado "Trensito Locardo" con la regla 
            "Los seleccionados tienen que hacer un trensito con los ojos vendados". Al girar la ruleta, se eligen 
            3 fotos al azar y los invitados correspondientes deben cumplir la prenda. ¡Diversión asegurada!
          </p>
        </section>

        {/* Section 8: Tipos de Evento */}
        <section className="report-page">
          <h2 className="report-h2">8. Tipos de Evento Soportados</h2>
          <div className="report-event-types">
            <span>🎂 Cumpleaños</span>
            <span>💍 Casamiento</span>
            <span>🎓 Graduación</span>
            <span>🏢 Corporativo</span>
            <span>🎉 Fiesta Temática</span>
            <span>✨ Otro</span>
          </div>
          <p className="report-text mt-4">
            Cada tipo de evento puede personalizarse con colores, logo, duración (6, 12 o 24 horas) y, 
            en el plan Premium, un estilo de IA específico para la transformación artística de las fotos.
          </p>

          <h2 className="report-h2 mt-8">9. Tecnología</h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>Capa</th>
                <th>Tecnología</th>
                <th>Propósito</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Frontend</td><td>React 18 + TypeScript + Tailwind CSS</td><td>Interfaz de usuario responsiva</td></tr>
              <tr><td>Backend</td><td>Lovable Cloud (PostgreSQL + Edge Functions)</td><td>API, lógica de negocio, base de datos</td></tr>
              <tr><td>Realtime</td><td>WebSockets</td><td>Contenido en vivo instantáneo</td></tr>
              <tr><td>Pagos</td><td>Mercado Pago + Stripe</td><td>Cobros multi-país</td></tr>
              <tr><td>Emails</td><td>Resend</td><td>Emails transaccionales (QR codes)</td></tr>
              <tr><td>IA</td><td>Google Gemini</td><td>Transformación artística de fotos</td></tr>
              <tr><td>Seguridad</td><td>RLS + Auth + RBAC</td><td>Protección de datos por rol</td></tr>
            </tbody>
          </table>
        </section>

        {/* Section 10: Próximamente */}
        <section className="report-page">
          <h2 className="report-h2">10. Próximamente — Roadmap</h2>
          <p className="report-text">
            PickEvent está en constante evolución. Estas son algunas de las funcionalidades que estamos desarrollando 
            para los próximos meses:
          </p>

          <div className="report-grid-2">
            <div className="report-feature-card">
              <h4>🖼️ Muro Interactivo Temático</h4>
              <ul>
                <li>Fondos y marcos temáticos personalizados según tipo de evento</li>
                <li>Animaciones exclusivas por temática (confeti, corazones, estrellas)</li>
                <li>Transiciones y efectos visuales adaptados al estilo del evento</li>
                <li>Modo "cine" con presentaciones automáticas de fotos</li>
              </ul>
            </div>
            <div className="report-feature-card">
              <h4>🤖 IA Generativa Avanzada</h4>
              <ul>
                <li>Más estilos artísticos: Pop Art, Pixel Art, Sketch, Art Deco</li>
                <li>Generación de collages automáticos con IA</li>
                <li>Caricaturas personalizadas de los invitados en tiempo real</li>
                <li>Filtros temáticos inteligentes según el tipo de evento</li>
              </ul>
            </div>
            <div className="report-feature-card">
              <h4>🎮 Juegos Avanzados</h4>
              <ul>
                <li>Nuevos tipos de juegos: trivia, bingo de fotos, votaciones</li>
                <li>Rankings en tiempo real en la pantalla del muro</li>
                <li>Premios virtuales y físicos configurables</li>
                <li>Desafíos por equipos con marcador en vivo</li>
              </ul>
            </div>
            <div className="report-feature-card">
              <h4>📊 Analíticas y Engagement</h4>
              <ul>
                <li>Dashboard avanzado de engagement post-evento</li>
                <li>Heatmaps de participación por hora</li>
                <li>Exportación de reportes profesionales para salones</li>
                <li>Integración con redes sociales para compartir álbumes</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="report-footer">
          <span>PickEvent © 2026 — pickevent.site</span>
        </div>
      </div>
    </>
  );
}
