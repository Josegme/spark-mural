/**
 * PICKEVENT - Acciones rápidas del Dashboard Asistente
 */

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { QrCode, Download, Wallet, HelpCircle } from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  onClick?: () => void;
}

interface AsistenteQuickActionsProps {
  onOpenQRModal?: () => void;
  onOpenRendiciones?: () => void;
  hasEvents?: boolean;
}

export function AsistenteQuickActions({ onOpenQRModal, onOpenRendiciones, hasEvents }: AsistenteQuickActionsProps) {
  const actions: QuickAction[] = [
    {
      title: 'Ver QR Codes',
      description: 'Accedé a los códigos QR de tus eventos',
      icon: QrCode,
      colorClass: 'bg-primary/10 text-primary',
      onClick: hasEvents ? onOpenQRModal : undefined,
    },
    {
      title: 'Descargar Álbumes',
      description: 'Descargá el contenido de eventos',
      icon: Download,
      colorClass: 'bg-accent/10 text-accent',
    },
    {
      title: 'Mis Rendiciones',
      description: 'Revisá tus comisiones y pagos',
      icon: Wallet,
      colorClass: 'bg-amber-500/10 text-amber-600',
      onClick: onOpenRendiciones,
    },
    {
      title: 'Ayuda',
      description: 'Guías y soporte técnico',
      icon: HelpCircle,
      colorClass: 'bg-muted text-muted-foreground',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Card 
          key={action.title}
          className={`hover:border-primary/50 transition-colors ${action.onClick ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
          onClick={action.onClick}
        >
          <CardHeader>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${action.colorClass}`}>
              <action.icon className="w-5 h-5" />
            </div>
            <CardTitle className="text-base">{action.title}</CardTitle>
            <CardDescription className="text-sm">
              {action.description}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
