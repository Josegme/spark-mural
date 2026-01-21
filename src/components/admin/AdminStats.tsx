/**
 * Estadísticas globales del panel de admin
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, 
  Calendar, 
  Building2, 
  Camera, 
  Video, 
  MessageSquare,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { GlobalStats } from '@/hooks/useAdminData';

interface AdminStatsProps {
  stats: GlobalStats | undefined;
  isLoading?: boolean;
}

export function AdminStats({ stats, isLoading }: AdminStatsProps) {
  const cards = [
    {
      label: 'Eventos Totales',
      value: stats?.totalEvents || 0,
      subValue: `${stats?.activeEvents || 0} activos`,
      icon: Calendar,
      colorClass: 'bg-primary/10 text-primary',
    },
    {
      label: 'Usuarios',
      value: stats?.totalUsers || 0,
      icon: Users,
      colorClass: 'bg-info/10 text-info',
    },
    {
      label: 'Tenants',
      value: stats?.totalTenants || 0,
      icon: Building2,
      colorClass: 'bg-secondary/10 text-secondary',
    },
    {
      label: 'Ingresos Totales',
      value: formatPrice(stats?.totalRevenue || 0),
      icon: DollarSign,
      colorClass: 'bg-success/10 text-success',
      isPrice: true,
    },
  ];

  const contentCards = [
    {
      label: 'Fotos',
      value: stats?.totalPhotos || 0,
      icon: Camera,
      colorClass: 'text-primary',
    },
    {
      label: 'Videos',
      value: stats?.totalVideos || 0,
      icon: Video,
      colorClass: 'text-accent',
    },
    {
      label: 'Mensajes',
      value: stats?.totalMessages || 0,
      icon: MessageSquare,
      colorClass: 'text-secondary',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24 mb-2" />
              <div className="h-8 bg-muted rounded w-16" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>{card.label}</CardDescription>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.colorClass}`}>
                  <card.icon className="w-4 h-4" />
                </div>
              </div>
              <CardTitle className={`${card.isPrice ? 'text-2xl' : 'text-3xl'} font-display`}>
                {card.value}
              </CardTitle>
              {card.subValue && (
                <p className="text-xs text-muted-foreground">{card.subValue}</p>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Stats de contenido */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Contenido Global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {contentCards.map((card) => (
              <div key={card.label} className="text-center">
                <card.icon className={`w-8 h-8 mx-auto mb-2 ${card.colorClass}`} />
                <p className="text-2xl font-display font-bold">{card.value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
