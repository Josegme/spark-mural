/**
 * PICKEVENT - Estadísticas del Dashboard de Asistente
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Users,
  AlertTriangle,
  Wallet
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { AsistenteStats as Stats, AsistenteTenantInfo } from '@/hooks/useAsistenteData';

interface AsistenteStatsProps {
  stats: Stats;
  tenantInfo: AsistenteTenantInfo | null | undefined;
  isLoading: boolean;
}

export function AsistenteStats({ stats, tenantInfo, isLoading }: AsistenteStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Eventos Totales',
      value: stats.totalEventos.toString(),
      description: `${stats.eventosActivos} activos ahora`,
      icon: Calendar,
      color: 'text-blue-500',
    },
    {
      title: 'Eventos este Mes',
      value: stats.eventosEsteMes.toString(),
      description: 'Creados en el período',
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      title: 'Facturación Total',
      value: formatPrice(stats.facturacionTotal),
      description: `${formatPrice(stats.facturacionMes)} este mes`,
      icon: DollarSign,
      color: 'text-emerald-500',
    },
    {
      title: 'Tu Comisión',
      value: formatPrice(stats.comisionTotal),
      description: `${tenantInfo?.comision_asistente || 70}% de cada venta`,
      icon: Wallet,
      color: 'text-purple-500',
    },
    {
      title: 'Comisión este Mes',
      value: formatPrice(stats.comisionMes),
      description: 'Tu ganancia del período',
      icon: TrendingUp,
      color: 'text-indigo-500',
    },
    {
      title: 'Clientes',
      value: stats.totalClientes.toString(),
      description: 'Clientes atendidos',
      icon: Users,
      color: 'text-cyan-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Alerta de rendición pendiente */}
      {stats.pendienteRendir > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-2 rounded-full bg-amber-500/20">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                Tenés una rendición pendiente
              </p>
              <p className="text-sm text-muted-foreground">
                Debés rendir {formatPrice(stats.pendienteRendir)} al Super Admin 
                ({tenantInfo?.comision_superadmin || 30}% de tus ventas)
              </p>
            </div>
            <Badge variant="outline" className="border-amber-500 text-amber-600">
              {formatPrice(stats.pendienteRendir)}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Grid de estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info del tenant */}
      {tenantInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tu Cuenta de Asistente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">{tenantInfo.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">País</p>
                <p className="font-medium">{tenantInfo.pais}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge variant={tenantInfo.estado === 'activo' ? 'default' : 'destructive'}>
                  {tenantInfo.estado}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tu Comisión</p>
                <p className="font-medium text-green-600">{tenantInfo.comision_asistente}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rinde a PickEvent</p>
                <p className="font-medium text-amber-600">{tenantInfo.comision_superadmin}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-sm truncate">{tenantInfo.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
