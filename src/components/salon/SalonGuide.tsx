/**
 * PICKEVENT - Guía rápida para Salones
 * Paso a paso para programar eventos y juegos
 */

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Gamepad2 } from 'lucide-react';

const GUIDE_EVENTOS = [
  { paso: 1, texto: 'Hacé clic en "Crear Evento" desde el Dashboard.' },
  { paso: 2, texto: 'Completá el nombre, tipo de evento, fecha y horario.' },
  { paso: 3, texto: 'Elegí el plan Básico (o Premium cuando esté disponible).' },
  { paso: 4, texto: 'Confirmá el pago y recibí los 3 códigos QR por email.' },
  { paso: 5, texto: 'Compartí el QR de invitados para que suban fotos y mensajes.' },
];

const GUIDE_JUEGOS = [
  { paso: 1, texto: 'Entrá al detalle de un evento activo desde "Mis Eventos".' },
  { paso: 2, texto: 'Andá a la pestaña "Juegos" dentro del evento.' },
  { paso: 3, texto: 'Creá un nuevo juego con nombre, regla y cantidad de fotos.' },
  { paso: 4, texto: 'Cuando quieras activarlo, presioná "Lanzar" desde el muro.' },
];

export function SalonGuide() {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-display">📖 Guía Rápida</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="eventos">
            <AccordionTrigger className="text-sm font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                Cómo programar un evento
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ol className="space-y-2 pl-1">
                {GUIDE_EVENTOS.map((item) => (
                  <li key={item.paso} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                      {item.paso}
                    </span>
                    {item.texto}
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="juegos">
            <AccordionTrigger className="text-sm font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-primary" />
                Cómo configurar juegos
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ol className="space-y-2 pl-1">
                {GUIDE_JUEGOS.map((item) => (
                  <li key={item.paso} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                      {item.paso}
                    </span>
                    {item.texto}
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
