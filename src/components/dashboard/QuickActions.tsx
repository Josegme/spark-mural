/**
 * Acciones rápidas del dashboard
 */

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { QrCode, Download, Settings, HelpCircle } from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  onClick?: () => void;
}

interface QuickActionsProps {
  onOpenQRModal?: () => void;
  hasEvents?: boolean;
}

export function QuickActions({ onOpenQRModal, hasEvents }: QuickActionsProps) {
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
      description: 'Descargá el contenido de tus eventos',
      icon: Download,
      colorClass: 'bg-accent/10 text-accent',
    },
    {
      title: 'Configuración',
      description: 'Editá tu perfil y preferencias',
      icon: Settings,
      colorClass: 'bg-secondary/10 text-secondary',
    },
    {
      title: 'Ayuda',
      description: 'Guías y soporte técnico',
      icon: HelpCircle,
      colorClass: 'bg-info/10 text-info',
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
