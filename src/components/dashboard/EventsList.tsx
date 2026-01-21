/**
 * Lista de eventos del usuario
 */

import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Loader2 } from 'lucide-react';
import { EventCard } from './EventCard';
import type { UserEvent } from '@/hooks/useUserEvents';

interface EventsListProps {
  events: UserEvent[];
  isLoading?: boolean;
  onViewQR?: (event: UserEvent) => void;
}

export function EventsList({ events, isLoading, onViewQR }: EventsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-lg mb-2">
            Todavía no tenés eventos
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Creá tu primer evento y empezá a recibir fotos y mensajes de tus invitados en tiempo real.
          </p>
          <Button className="btn-hero" asChild>
            <Link to="/crear-evento">
              <Plus className="w-4 h-4 mr-2" />
              Crear Mi Primer Evento
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard 
          key={event.id} 
          event={event} 
          onViewQR={onViewQR}
        />
      ))}
    </div>
  );
}
