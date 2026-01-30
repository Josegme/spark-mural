/**
 * PICKEVENT - Banner Empresarial
 * CTA para salones, organizadores de eventos y empresas
 */

import { Building2, Phone, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EnterpriseBannerProps {
  whatsapp?: string;
  mensaje?: string;
}

export function EnterpriseBanner({ 
  whatsapp = '5493764606205', 
  mensaje = 'Hola! Quiero información sobre planes empresariales para mi salón/eventos.' 
}: EnterpriseBannerProps) {
  // WhatsApp URL format: https://wa.me/number (no + sign, just digits)
  const whatsappUrl = `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(mensaje)}`;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-accent p-8 md:p-12">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmgtNHY2aDR2Nmgydi02aDJ2LTRoLTJ2NHptMC0zMGgtMnY0aDJ2Mmg0di02aC00djZoLTJ2LTZoMnYtMmgydi00aC0ydjRoLTJ2MmgtNHY2aDR2LTZoMnYtMnptLTI0IDI0di0yaDJ2LTJoLTR2Nmg0djZoMnYtNmgydi00aC0ydjRoLTR6bTAtMzB2MmgtMnYyaDR2LTZoLTR2NmgydjJoMnYtNGgtMnYtMmgtMnYtNGgydi0ySDh2NnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
      
      {/* Floating icons */}
      <div className="absolute top-4 right-8 text-4xl opacity-20 animate-bubble-float">🏢</div>
      <div className="absolute bottom-4 left-1/4 text-3xl opacity-20 animate-bubble-float animation-delay-500">🎉</div>

      <div className="relative grid md:grid-cols-2 gap-8 items-center">
        {/* Content */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Suscripciones a Medida
          </div>
          
          <h3 className="text-2xl md:text-3xl font-display font-bold text-white">
            ¿Tenés un Salón o Organizás Eventos?
          </h3>
          
          <p className="text-white/90 text-lg">
            Planes especiales para salones de fiestas, organizadores de eventos y empresas. 
            Precios personalizados según tu volumen.
          </p>

          <ul className="space-y-2 text-white/80">
            <li className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Suscripciones mensuales o anuales
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Eventos ilimitados disponibles
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Soporte dedicado y capacitación
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center md:items-end gap-4">
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-white/90 shadow-xl text-lg px-8 py-6 gap-3"
            asChild
          >
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Phone className="w-5 h-5" />
              Contactar por WhatsApp
              <ArrowRight className="w-5 h-5" />
            </a>
          </Button>
          
          <p className="text-white/70 text-sm text-center md:text-right">
            Respuesta rápida • Sin compromiso
          </p>
        </div>
      </div>
    </div>
  );
}
