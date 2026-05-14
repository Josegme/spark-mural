/**
 * PICKEVENT - Estadísticas del Salón
 * Widget con métricas y progreso mensual
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  CalendarCheck, 
  CalendarClock,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Gift,
  CreditCard
} from 'lucide-react';
import type { SalonStats as SalonStatsType } from '@/hooks/useSalonData';

interface SalonStatsProps {
  stats: SalonStatsType;
  isLoading: boolean;
  onGoToSubscription?: () => void;
}

export function SalonStats({ stats, isLoading }: SalonStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {stats.alertaCritica && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>¡Suscripción Vencida!</AlertTitle>
          <AlertDescription>
            Tu suscripción ha vencido. No podés crear nuevos eventos hasta renovarla.
            Contactá con soporte para renovar tu plan.
          </AlertDescription>
        </Alert>
      )}

      {!stats.alertaCritica && stats.alertaVencimiento && (
        <Alert className="border-warning bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Suscripción por vencer</AlertTitle>
          <AlertDescription>
            Tu suscripción vence en {stats.diasHastaVencimiento} días. 
            Renovála para no perder acceso.
          </AlertDescription>
        </Alert>
      )}

      {!stats.alertaCritica && stats.alertaLimite && (
        <Alert className="border-warning bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Límite de eventos cercano</AlertTitle>
          <AlertDescription>
            Has usado el {stats.porcentajeUso}% de tu límite mensual 
            ({stats.eventosEsteMes}/{stats.limiteEventosMes} eventos).
          </AlertDescription>
        </Alert>
      )}

      {/* Uso del Mes - Widget Principal */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
            Uso del Mes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-4xl font-bold">{stats.eventosEsteMes}</span>
              <span className="text-muted-foreground text-lg">/{stats.limiteEventosMes}</span>
            </div>
            <span className="text-sm text-muted-foreground">eventos este mes</span>
          </div>
          
          <Progress 
            value={stats.porcentajeUso} 
            className={`h-3 ${stats.alertaLimite ? '[&>div]:bg-warning' : ''}`}
          />
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Disponibles: {stats.limiteEventosMes - stats.eventosEsteMes}</span>
            <span>{stats.porcentajeUso}% usado</span>
          </div>
        </CardContent>
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEventos}</div>
            <p className="text-xs text-muted-foreground">
              eventos creados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos Ahora</CardTitle>
            <CalendarCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.eventosActivos}</div>
            <p className="text-xs text-muted-foreground">
              eventos en vivo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Programados</CardTitle>
            <CalendarClock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.eventosProgramados}</div>
            <p className="text-xs text-muted-foreground">
              próximos eventos
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
