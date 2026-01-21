/**
 * PICKEVENT - Página de creación de evento
 */

import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CreateEventWizard } from '@/components/events/CreateEventWizard';

export default function CreateEventPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </Button>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-display font-bold text-gradient-primary">
              PickEvent
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <CreateEventWizard />
      </main>
    </div>
  );
}
