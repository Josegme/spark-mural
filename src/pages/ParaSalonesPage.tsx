/**
 * PICKEVENT - Para Salones
 * Página de marketing dirigida a dueños de salones de fiesta.
 */

import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Building2,
  Sparkles,
  TrendingUp,
  Heart,
  Star,
  ShieldCheck,
  Phone,
  ArrowRight,
  Check,
  Users,
  Camera,
  Gift,
} from 'lucide-react';
import whatsappQR from '@/assets/whatsapp-qr.png';

const WHATSAPP_LINK = 'https://wa.me/5493764606205?text=Hola!%20Tengo%20un%20salón%20y%20quiero%20saber%20más%20sobre%20PickEvent';

export default function ParaSalonesPage() {
  return (
    <MainLayout>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Building2 className="w-4 h-4" />
              Para Salones de Fiestas
            </div>
            <h1 className="text-fluid-4xl lg:text-6xl font-display font-bold tracking-tight">
              Convertí tu salón en la <span className="text-gradient-primary">experiencia más viral</span> de la ciudad
            </h1>
            <p className="text-fluid-lg md:text-xl text-muted-foreground">
              Ofrecé a tus clientes algo que ningún otro salón tiene: un muro interactivo
              en vivo donde cada invitado se vuelve protagonista. Más diferenciación,
              más recomendaciones, más reservas.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button size="lg" className="btn-hero" asChild>
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                  <Phone className="w-5 h-5" />
                  Hablar con un asesor
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#beneficios">Ver beneficios</a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground pt-2">
              Servicio especial · Suscripciones a medida · Atención personalizada
            </p>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section id="beneficios" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center space-y-4 mb-14 max-w-2xl mx-auto">
            <h2 className="text-fluid-3xl font-display font-bold">
              ¿Por qué los salones eligen PickEvent?
            </h2>
            <p className="text-lg text-muted-foreground">
              No es solo una tecnología más: es un servicio premium que multiplica el valor percibido de cada evento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                title: 'Aumentá tu ticket promedio',
                desc: 'Sumá PickEvent como un servicio premium incluido o como upsell. Cobrás más por evento sin contratar más personal.',
              },
              {
                icon: Star,
                title: 'Diferenciate de la competencia',
                desc: 'Sé el primer salón de tu ciudad con muro interactivo en vivo. Una experiencia que tus clientes nunca vieron.',
              },
              {
                icon: Heart,
                title: 'Clientes felices = más recomendaciones',
                desc: 'Cada invitado se va con una foto, un recuerdo y una historia para contar. Tu salón queda asociado a esa magia.',
              },
              {
                icon: Camera,
                title: 'Marketing orgánico ilimitado',
                desc: 'Los invitados comparten el muro en sus redes. Tu salón aparece en Instagram, TikTok y stories sin gastar un peso.',
              },
              {
                icon: ShieldCheck,
                title: 'Sin instalaciones complejas',
                desc: 'Funciona con cualquier pantalla o proyector. No necesitás comprar hardware ni capacitar staff técnico.',
              },
              {
                icon: Gift,
                title: 'Comisiones y eventos cortesía',
                desc: 'Plan de revenue share, eventos de regalo mensuales y precios preferenciales para tu cartera de clientes.',
              },
            ].map((b) => (
              <Card key={b.title} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                    <b.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-lg">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo lo integrás */}
      <section className="py-20">
        <div className="container max-w-5xl">
          <div className="text-center space-y-4 mb-14">
            <h2 className="text-fluid-3xl font-display font-bold">
              Así lo integrás a tu salón
            </h2>
            <p className="text-lg text-muted-foreground">
              En menos de una semana ya estás ofreciéndolo a tus clientes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { n: '1', t: 'Te contactás', d: 'Charlamos por WhatsApp para entender tu salón, volumen y necesidades.' },
              { n: '2', t: 'Diseñamos tu plan', d: 'Te armamos una suscripción a medida con eventos incluidos y comisiones.' },
              { n: '3', t: 'Te activamos la cuenta', d: 'Recibís acceso al panel de salón para crear y administrar eventos.' },
              { n: '4', t: 'Vendés y ganás', d: 'Sumás PickEvent a tu propuesta. Nosotros te acompañamos con soporte dedicado.' },
            ].map((s) => (
              <Card key={s.n} className="border-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-primary opacity-10 rounded-bl-full" />
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xl">
                    {s.n}
                  </div>
                  <h3 className="font-display font-semibold">{s.t}</h3>
                  <p className="text-sm text-muted-foreground">{s.d}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Qué incluye */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-4xl">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Servicio Premium para Salones
            </div>
            <h2 className="text-fluid-3xl font-display font-bold">
              ¿Qué incluye el plan para salones?
            </h2>
          </div>

          <Card className="border-2 border-primary/30">
            <CardContent className="p-8 md:p-10">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Panel exclusivo de salón con control de eventos y clientes',
                  'Muros interactivos ilimitados según tu plan',
                  'Eventos cortesía mensuales para regalar o promocionar',
                  'Personalización con tu logo y colores de marca',
                  'Códigos QR únicos por evento (pantalla, invitados, álbum)',
                  'Álbum digital descargable por 30 días',
                  'Juegos interactivos en vivo (ruleta de prendas)',
                  'Mensajes flotantes y likes en tiempo real',
                  'IA generativa para transformar fotos',
                  'Soporte dedicado por WhatsApp',
                  'Comisiones preferenciales por volumen',
                  'Capacitación inicial de tu equipo',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Los precios y condiciones se definen según el volumen mensual de tu salón.
            Es un servicio especial: hablemos para armar tu plan ideal.
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <CTAContacto />
    </MainLayout>
  );
}

export function CTAContacto() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-accent p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center relative">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-sm font-medium">
                <Users className="w-4 h-4" />
                Servicio Especial · Atención 1 a 1
              </div>
              <h3 className="text-2xl md:text-3xl font-display font-bold">
                Listo para hacer crecer tu salón con PickEvent
              </h3>
              <p className="text-white/90">
                Es un servicio especial con suscripciones a medida. Contactanos por WhatsApp
                y te armamos una propuesta personalizada para tu salón en menos de 24 hs.
              </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-4">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 shadow-xl text-lg px-8 py-6 gap-3"
                asChild
              >
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                  <Phone className="w-5 h-5" />
                  Contactar por WhatsApp
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Button>
              <div className="p-3 bg-white rounded-xl shadow-lg">
                <img src={whatsappQR} alt="QR WhatsApp" className="w-24 h-24" />
              </div>
              <p className="text-white/80 text-xs">Escaneá para chatear ahora</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}
