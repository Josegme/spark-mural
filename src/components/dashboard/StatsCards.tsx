/**
 * Tarjetas de estadísticas del dashboard
 */

import { Card, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Calendar, Camera, MessageSquare, Heart, Video, TrendingUp } from 'lucide-react';
import type { DashboardStats } from '@/hooks/useUserEvents';

interface StatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const cards = [
    {
      label: 'Eventos Activos',
      value: stats.activeEvents,
      total: stats.totalEvents,
      icon: Calendar,
      color: 'primary',
    },
    {
      label: 'Fotos Subidas',
      value: stats.totalPhotos,
      icon: Camera,
      color: 'accent',
    },
    {
      label: 'Videos Subidos',
      value: stats.totalVideos,
      icon: Video,
      color: 'secondary',
    },
    {
      label: 'Mensajes',
      value: stats.totalMessages,
      icon: MessageSquare,
      color: 'info',
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm">{card.label}</CardDescription>
              <div 
                className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${card.color}/10`}
              >
                <card.icon className={`w-4 h-4 text-${card.color}`} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-3xl font-display">{card.value}</CardTitle>
              {card.total !== undefined && (
                <span className="text-sm text-muted-foreground">
                  / {card.total} total
                </span>
              )}
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
