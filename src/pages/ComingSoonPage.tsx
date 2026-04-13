/**
 * PICKEVENT - Página Próximamente
 * Placeholder para secciones en desarrollo
 */

import { MainLayout } from '@/components/layout';
import { Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function ComingSoonPage() {
  return (
    <MainLayout>
      <div className="container flex flex-col items-center justify-center py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Construction className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-bold">Estamos actualizando</h1>
        <p className="text-muted-foreground max-w-md">
          Esta sección estará disponible muy pronto. Estamos trabajando para brindarte la mejor experiencia.
        </p>
        <Button asChild className="btn-hero">
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    </MainLayout>
  );
}
