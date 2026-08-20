/**
 * PICKEVENT - Landing Page
 * Página principal con hero, servicios, cómo funciona, planes y casos de uso
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout';
import { EVENT_TYPES, FEATURE_FLAGS } from '@/lib/constants';
import { usePublicPrices } from '@/hooks/usePublicPrices';
import { formatPrice, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Check, Sparkles, QrCode, Tv, Download, Camera, MessageSquare, Heart, Gamepad2, Users, Trophy, Hand, Mail, Ticket, Award, ScanLine, ShieldCheck, PartyPopper } from 'lucide-react';
import { EnterpriseBanner } from '@/components/landing/EnterpriseBanner';

export default function Index() {
  return (
    <MainLayout>
      <HeroSection />
      <ServicesSection />
      <HowItWorksSection />
      <GamesSection />
      <FeaturesSection />
      <PlansSection />
      <UseCasesSection />
      <CTASection />
    </MainLayout>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 text-6xl animate-bubble-float opacity-20">🎉</div>
      <div className="absolute top-40 right-20 text-5xl animate-bubble-float animation-delay-300 opacity-20">📸</div>
      <div className="absolute bottom-20 left-1/4 text-4xl animate-bubble-float animation-delay-500 opacity-20">💬</div>
      
      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Ahora con IA Generativa</span>
          </div>
          
          <h1 className="text-fluid-4xl lg:text-7xl font-display font-bold tracking-tight">
            Hacé tu Evento{' '}
            <span className="text-gradient-primary">Inolvidable</span>
          </h1>
          
          <p className="text-fluid-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Muro interactivo, invitaciones digitales con RSVP, control de ingreso por QR y 
            certificados personalizados. Todo en una sola plataforma para tu evento.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="btn-hero" asChild>
              <Link to="/crear-evento">
                🎉 Crear Mi Evento Ahora
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="btn-hero-outline" asChild>
              <a href="#como-funciona">
                Ver Cómo Funciona
              </a>
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              <span>Sin app necesaria</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              <span>Tiempo real</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              <span>Álbum incluido</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  const services = [
    {
      icon: Mail,
      title: 'Invitaciones Digitales',
      description: 'Envíá invitaciones con RSVP, tarjeta digital personalizada y confirmación de asistencia. Controlá cupos, acompañantes y fecha límite de respuesta.',
      color: 'bg-rose-500/10 text-rose-500',
      badge: 'Nuevo',
    },
    {
      icon: Ticket,
      title: 'Control de Ingreso QR',
      description: 'Cada invitado recibe un QR único de entrada. Escaneá en puerta con el celular, validá asistencia en tiempo real y evitá entradas duplicadas.',
      color: 'bg-amber-500/10 text-amber-500',
      badge: 'Nuevo',
    },
    {
      icon: Award,
      title: 'Certificados Personalizados',
      description: 'Diseñá certificados de participación o agradecimiento con logo, firmas y fondo personalizado. Envialos por email o descargalos en PDF para imprimir.',
      color: 'bg-violet-500/10 text-violet-500',
      badge: 'Nuevo',
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium">
            <PartyPopper className="w-4 h-4" />
            <span>Nuevos Servicios</span>
          </div>
          <h2 className="text-fluid-3xl font-display font-bold">
            Todo lo que necesitás para tu evento
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            De la invitación inicial al recuerdo final: gestioná invitados, accesos y certificados desde el mismo panel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Card
              key={service.title}
              className="relative overflow-hidden border-2 hover:border-primary/50 transition-all hover:shadow-lg animate-fade-in-up h-full"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-primary opacity-10 rounded-bl-full" />
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${service.color}`}>
                    <service.icon className="w-7 h-7" />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {service.badge}
                  </span>
                </div>
                <CardTitle className="font-display text-xl">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {service.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span>Accesos verificados</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-success" />
            <span>Lista de invitados automática</span>
          </div>
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-success" />
            <span>PDF e impresión listos</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: '1',
      title: 'Creá tu Evento',
      description: 'Elegí fecha, duración y personalización. Activá invitaciones, muro interactivo y certificados desde el mismo panel.',
      icon: Sparkles,
    },
    {
      number: '2',
      title: 'Compartí Invitaciones',
      description: 'Tus invitados reciben invitación digital con RSVP, QR de entrada y link para subir fotos al muro.',
      icon: Mail,
    },
    {
      number: '3',
      title: 'Controlá y Disfrutá',
      description: 'Validá el ingreso con QR en puerta y dejá que las fotos, videos y mensajes lleguen a la pantalla en vivo.',
      icon: ScanLine,
    },
    {
      number: '4',
      title: 'Cerrá con Recuerdos',
      description: 'Descargá el álbum completo y enviá certificados personalizados a quienes asistieron.',
      icon: Award,
    },
  ];

  return (
    <section id="como-funciona" className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-fluid-3xl font-display font-bold">
            ¿Cómo Funciona?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            En 4 simples pasos tenés tu evento completo: invitaciones, ingreso, muro y certificados
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div 
              key={step.number}
              className="relative animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-x-8" />
              )}
              
              <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors h-full">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-primary opacity-10 rounded-bl-full" />
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xl mb-4">
                    {step.number}
                  </div>
                  <CardTitle className="font-display">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {step.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GamesSection() {
  const gameSteps = [
    {
      icon: Gamepad2,
      title: 'Creá tus Juegos',
      description: 'Desde el panel del evento, armá juegos con reglas divertidas como "El que sale acá paga la próxima ronda" o "Baila 30 segundos".',
    },
    {
      icon: Users,
      title: 'Los Invitados Participan',
      description: 'Las fotos que suben los invitados al muro son las que entran en la ruleta. ¡Más fotos, más diversión!',
    },
    {
      icon: Hand,
      title: 'El Anfitrión Controla',
      description: 'Vos decidís cuándo girar y cuándo frenar la ruleta. Todo desde tu celular, sin interrumpir la fiesta.',
    },
    {
      icon: Trophy,
      title: 'Se Revelan los Ganadores',
      description: 'Las fotos ganadoras aparecen en pantalla gigante con la prenda asignada. ¡Risas aseguradas!',
    },
  ];

  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium">
            <Gamepad2 className="w-4 h-4" />
            <span>Nueva Funcionalidad</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold">
            🎰 Juegos Interactivos en Vivo
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Lanzá una ruleta con las fotos de tus invitados y ponele onda a tu evento con prendas y desafíos
          </p>
        </div>

        {/* Tarjeta larga explicativa */}
        <Card className="max-w-5xl mx-auto border-2 border-primary/20 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {gameSteps.map((step, index) => (
                <div 
                  key={step.title}
                  className="flex gap-4 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Incluido en todos los planes · Sin límite de juegos por evento
              </p>
              <Button className="btn-hero" asChild>
                <Link to="/crear-evento">
                  🎉 Probalo en tu Próximo Evento
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Mail,
      title: 'Invitaciones Digitales',
      description: 'Enviá invitaciones con tarjeta personalizada, RSVP automático y control de acompañantes.',
    },
    {
      icon: Ticket,
      title: 'Control de Ingreso QR',
      description: 'Cada invitado recibe un QR único. Escanealo en puerta para validar accesos y evitar duplicados.',
    },
    {
      icon: Camera,
      title: 'Fotos en Tiempo Real',
      description: 'Las fotos aparecen instantáneamente en el muro proyectado.',
    },
    {
      icon: MessageSquare,
      title: 'Mensajes Flotantes',
      description: 'Globitos con mensajes de hasta 150 caracteres que animan la pantalla.',
    },
    {
      icon: Award,
      title: 'Certificados Personalizados',
      description: 'Diseñá certificados con logo, firmas y fondo. Envialos por email o descargalos en PDF.',
    },
    {
      icon: Sparkles,
      title: 'IA Generativa',
      description: 'Transformá las fotos con temas personalizados como superhéroes, fantasía y más.',
    },
    {
      icon: Heart,
      title: 'Likes Interactivos',
      description: 'Los invitados pueden dar likes a las fotos que más les gusten.',
    },
  ];

  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold">
            Todo en Tiempo Real
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Funcionalidades diseñadas para hacer tu evento único
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={feature.title}
              className="text-center p-6 hover:shadow-glow transition-shadow animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlansSection() {
  const { prices, isLoading } = usePublicPrices();

  return (
    <section id="planes" className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold">
            Planes para tu Evento
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Elegí el plan que mejor se adapte a tu celebración
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plan Básico */}
          <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-2xl">{prices.basico.nombre}</CardTitle>
              <CardDescription>{prices.basico.descripcion}</CardDescription>
              <div className="pt-4">
                {isLoading ? (
                  <div className="h-10 w-32 bg-muted animate-pulse rounded" />
                ) : (
                  <>
                    <span className="text-4xl font-display font-bold">{formatPrice(prices.basico.precio)}</span>
                    <span className="text-muted-foreground ml-2">por evento</span>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {prices.basico.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant="outline" asChild>
                <Link to="/crear-evento?plan=basico">Elegir Básico</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Plan Premium */}
          <Card className={cn("relative overflow-hidden border-2", FEATURE_FLAGS.IA_ENABLED ? "border-primary shadow-glow" : "border-border opacity-75")}>
            <div className={cn("absolute top-0 right-0 rounded-bl-xl rounded-tr-lg px-4 py-1", FEATURE_FLAGS.IA_ENABLED ? "badge-premium" : "bg-muted text-muted-foreground text-sm font-medium")}>
              {FEATURE_FLAGS.IA_ENABLED ? '⭐ Recomendado' : '🚀 Próximamente'}
            </div>
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-2xl">{prices.premium.nombre}</CardTitle>
              <CardDescription>{prices.premium.descripcion}</CardDescription>
              <div className="pt-4">
                {isLoading ? (
                  <div className="h-10 w-32 bg-muted animate-pulse rounded" />
                ) : (
                  <>
                    <span className="text-4xl font-display font-bold text-gradient-primary">{formatPrice(prices.premium.precio)}</span>
                    <span className="text-muted-foreground ml-2">por evento</span>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {prices.premium.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              {FEATURE_FLAGS.IA_ENABLED ? (
                <Button className="w-full btn-hero" asChild>
                  <Link to="/crear-evento?plan=premium">Elegir Premium</Link>
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => toast.info('🚀 La función Premium + IA estará disponible muy pronto. ¡Mantenete atento!')}
                >
                  Próximamente
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enterprise Banner */}
        <div id="banner-empresarial" className="mt-16">
          <EnterpriseBanner />
        </div>
      </div>
    </section>
  );
}

function UseCasesSection() {
  const cases = Object.entries(EVENT_TYPES).slice(0, 5).map(([key, value]) => ({
    key,
    ...value,
  }));

  return (
    <section id="casos-de-uso" className="py-20">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold">
            Perfecto para Cualquier Evento
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Desde cumpleaños íntimos hasta eventos corporativos
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {cases.map((useCase) => (
            <div
              key={useCase.key}
              className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-card border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-default"
            >
              <span className="text-3xl">{useCase.icon}</span>
              <span className="font-medium">{useCase.label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-muted-foreground mt-8">
          Para eventos grandes, recitales o competencias,{' '}
          <a href="https://wa.me/5493764606205" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
            comunicate con el equipo de soporte de PickEvent
          </a>.
        </p>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 bg-gradient-dark text-primary-foreground">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-display font-bold">
            ¿Listo para tu Evento Inolvidable?
          </h2>
          <p className="text-xl opacity-90">
            Creá tu muro interactivo en minutos y sorprendé a todos tus invitados.
          </p>
          <Button size="lg" className="bg-white text-foreground hover:bg-white/90 shadow-xl" asChild>
            <Link to="/crear-evento">
              🎉 Crear Mi Evento Ahora
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
