/**
 * PICKEVENT - Para Organizadores
 * Página de marketing para organizadores de eventos / wedding planners / agencias.
 */

import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  PartyPopper,
  Sparkles,
  Briefcase,
  Zap,
  Trophy,
  Phone,
  ArrowRight,
  Check,
  Calendar,
  Gamepad2,
  Megaphone,
} from 'lucide-react';
import whatsappQR from '@/assets/whatsapp-qr.png';

const WHATSAPP_LINK = 'https://wa.me/5493764606205?text=Hola!%20Soy%20organizador%20de%20eventos%20y%20quiero%20conocer%20PickEvent';

export default function ParaOrganizadoresPage() {
  return (
    <MainLayout>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-primary/10" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium">
              <Briefcase className="w-4 h-4" />
              Para Organizadores de Eventos
            </div>
            <h1 className="text-fluid-4xl lg:text-6xl font-display font-bold tracking-tight">
              El <span className="text-gradient-primary">wow factor</span> que tus clientes van a contar durante años
            </h1>
            <p className="text-fluid-lg md:text-xl text-muted-foreground">
              Wedding planners, productoras, agencias y organizadores independientes:
              PickEvent es la herramienta que transforma cualquier evento en una
              experiencia memorable. Sin apps, sin instalaciones, sin complicaciones.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button size="lg" className="btn-hero" asChild>
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                  <Phone className="w-5 h-5" />
                  Quiero una propuesta
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#valor">Ver propuesta de valor</a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground pt-2">
              Servicio especial · Eventos ilimitados · Comisiones por volumen
            </p>
          </div>
        </div>
      </section>

      {/* Propuesta de valor */}
      <section id="valor" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center space-y-4 mb-14 max-w-2xl mx-auto">
            <h2 className="text-fluid-3xl font-display font-bold">
              ¿Por qué los organizadores aman PickEvent?
            </h2>
            <p className="text-lg text-muted-foreground">
              Porque suma valor en cada evento sin sumar trabajo. Es ese detalle que tus clientes no esperan y nunca olvidan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Trophy,
                title: 'El detalle que cierra ventas',
                desc: 'Cuando lo mostrás en la propuesta, tus clientes te eligen. Es el diferencial que justifica tu fee.',
              },
              {
                icon: Zap,
                title: 'Cero fricción operativa',
                desc: 'Lo configurás en 5 minutos. No hay apps que descargar ni hardware que llevar. Funciona en cualquier pantalla.',
              },
              {
                icon: Calendar,
                title: 'Sirve para cualquier evento',
                desc: 'Casamientos, cumpleaños de 15, corporativos, baby showers, despedidas, aniversarios. Todo encaja.',
              },
              {
                icon: Gamepad2,
                title: 'Animación incluida',
                desc: 'Juegos en vivo, ruleta de prendas, mensajes flotantes. Mantenés a los invitados conectados toda la noche.',
              },
              {
                icon: Megaphone,
                title: 'Branding tuyo o del cliente',
                desc: 'Personalizá cada muro con el logo del evento o de tu agencia. Tu marca también queda asociada a la experiencia.',
              },
              {
                icon: Sparkles,
                title: 'IA y novedades constantes',
                desc: 'Filtros con IA, juegos nuevos cada mes, actualizaciones automáticas. Siempre tenés algo nuevo para mostrar.',
              },
            ].map((b) => (
              <Card key={b.title} className="border-2 hover:border-accent/50 transition-colors">
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

      {/* Casos de uso */}
      <section className="py-20">
        <div className="container max-w-5xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-fluid-3xl font-display font-bold">
              Casos donde PickEvent brilla
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { emoji: '💍', title: 'Casamientos', d: 'Los invitados suben fotos durante toda la noche. Al día siguiente los novios reciben el álbum completo.' },
              { emoji: '🎂', title: 'Cumpleaños de 15', d: 'Mensajes para la quinceañera, fotos del vals y juegos que prenden la pista.' },
              { emoji: '🏢', title: 'Eventos corporativos', d: 'Lanzamientos, kick-offs, fiestas de fin de año. Networking visual y branding constante en pantalla.' },
              { emoji: '🎓', title: 'Egresados y graduaciones', d: 'Una despedida con memoria colectiva. Cada selfie y cada mensaje queda registrado.' },
              { emoji: '👶', title: 'Baby showers y revelaciones', d: 'Mensajes para los futuros papás, fotos del momento de la revelación, juegos temáticos.' },
              { emoji: '🎄', title: 'Eventos estacionales', d: 'Navidades de empresa, año nuevo, halloween. PickEvent se adapta a cualquier temática.' },
            ].map((c) => (
              <div
                key={c.title}
                className="flex items-start gap-4 p-5 rounded-xl border-2 hover:border-primary/40 transition-colors"
              >
                <span className="text-4xl">{c.emoji}</span>
                <div>
                  <h3 className="font-display font-semibold mb-1">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">{c.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Qué incluye */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-4xl">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium">
              <PartyPopper className="w-4 h-4" />
              Plan Organizador
            </div>
            <h2 className="text-fluid-3xl font-display font-bold">
              ¿Qué incluye el plan para organizadores?
            </h2>
          </div>

          <Card className="border-2 border-accent/30">
            <CardContent className="p-8 md:p-10">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Panel asistente con gestión de clientes y eventos',
                  'Eventos ilimitados (o por volumen mensual)',
                  'Eventos cortesía para captar nuevos clientes',
                  'Comisiones por cada evento vendido',
                  'Personalización completa por evento',
                  'Códigos QR únicos (pantalla, subida, álbum)',
                  'Álbum descargable para entregar al cliente',
                  'Juegos interactivos y ruleta de prendas',
                  'Mensajes flotantes, likes y muro en vivo',
                  'IA generativa para fotos temáticas',
                  'Acceso prioritario a nuevas funciones',
                  'Soporte WhatsApp 1 a 1',
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
            Las condiciones, comisiones y volumen se acuerdan en una llamada inicial.
            Es un servicio especial: hablemos para diseñar tu plan.
          </p>
        </div>
      </section>

      <CTAContactoOrganizador />
    </MainLayout>
  );
}

function CTAContactoOrganizador() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent via-primary/90 to-primary p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center relative">
            <div className="space-y-4 text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-sm font-medium">
                <Briefcase className="w-4 h-4" />
                Servicio Especial · Propuesta personalizada
              </div>
              <h3 className="text-2xl md:text-3xl font-display font-bold">
                Sumá PickEvent a tu próxima propuesta y cerrá más eventos
              </h3>
              <p className="text-white/90">
                Hablemos por WhatsApp. En una charla rápida te explico cómo integrarlo a
                tu propuesta, qué comisiones manejamos y te activamos una cuenta de prueba.
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
                  Hablemos por WhatsApp
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
