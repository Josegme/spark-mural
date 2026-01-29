/**
 * PICKEVENT - Estadísticas del Asistente (estilo Salón)
 * Widget con uso de cuota y métricas
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Calendar, 
  CalendarCheck, 
  CalendarClock,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Users
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { AsistenteStats } from '@/hooks/useAsistenteData';

interface AsistenteStatsCardsProps {
  stats: AsistenteStats;
  limiteEventosMes: number;
  eventosUsados: number;
  isLoading: boolean;
}

export function AsistenteStatsCards({ stats, limiteEventosMes, eventosUsados, isLoading }: AsistenteStatsCardsProps) {
  const porcentajeUso = limiteEventosMes > 0 
    ? Math.round((eventosUsados / limiteEventosMes) * 100) 
    : 0;
  
  const eventosDisponibles = Math.max(0, limiteEventosMes - eventosUsados);
  const alertaLimite = porcentajeUso >= 80 && eventosDisponibles > 0;
  const sinCuota = eventosDisponibles === 0 && limiteEventosMes > 0;

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
      {sinCuota && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>¡Sin eventos disponibles!</AlertTitle>
          <AlertDescription>
            Has alcanzado tu límite de {limiteEventosMes} eventos.
            Contactá al Super Admin para ampliar tu cuota.
          </AlertDescription>
        </Alert>
      )}

      {alertaLimite && !sinCuota && (
        <Alert className="border-warning bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Límite de eventos cercano</AlertTitle>
          <AlertDescription>
            Has usado el {porcentajeUso}% de tu límite 
            ({eventosUsados}/{limiteEventosMes} eventos).
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta de rendición pendiente */}
      {stats.pendienteRendir > 0 && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-600">Rendición Pendiente</AlertTitle>
          <AlertDescription className="text-amber-700">
            Tenés {formatPrice(stats.pendienteRendir)} pendientes de rendir al Super Admin.
          </AlertDescription>
        </Alert>
      )}

      {/* Uso de Cuota - Widget Principal */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
            Mi Cuota de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-4xl font-bold">{eventosUsados}</span>
              <span className="text-muted-foreground text-lg">/{limiteEventosMes}</span>
            </div>
            <span className="text-sm text-muted-foreground">eventos creados</span>
          </div>
          
          <Progress 
            value={porcentajeUso} 
            className={`h-3 ${alertaLimite ? '[&>div]:bg-warning' : ''} ${sinCuota ? '[&>div]:bg-destructive' : ''}`}
          />
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Disponibles: {eventosDisponibles}</span>
            <span>{porcentajeUso}% usado</span>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEventos}</div>
            <p className="text-xs text-muted-foreground">creados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CalendarCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.eventosActivos}</div>
            <p className="text-xs text-muted-foreground">en vivo ahora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturación</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatPrice(stats.facturacionTotal)}
            </div>
            <p className="text-xs text-muted-foreground">total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">{stats.totalClientes}</div>
            <p className="text-xs text-muted-foreground">atendidos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
