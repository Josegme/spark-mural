/**
 * PICKEVENT - Gestión de Rendiciones del Asistente
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Wallet,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AsistenteRendicion, AsistenteStats } from '@/hooks/useAsistenteData';

interface AsistenteRendicionesProps {
  rendiciones: AsistenteRendicion[];
  stats: AsistenteStats;
  isLoading: boolean;
  onRefetch: () => void;
}

const estadoConfig = {
  pendiente: { label: 'Pendiente', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  rendido: { label: 'Enviado', icon: Send, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  verificado: { label: 'Verificado', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
};

export function AsistenteRendiciones({ 
  rendiciones, 
  stats, 
  isLoading,
  onRefetch 
}: AsistenteRendicionesProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [notas, setNotas] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMarcarRendido = async (rendicionId: string) => {
    try {
      const { error } = await supabase
        .from('rendiciones')
        .update({ 
          estado: 'rendido',
          fecha_rendicion: new Date().toISOString()
        })
        .eq('id', rendicionId);

      if (error) throw error;

      toast.success('Rendición marcada como enviada');
      onRefetch();
    } catch (error) {
      console.error('Error updating rendicion:', error);
      toast.error('Error al actualizar la rendición');
    }
  };

  const handleCrearRendicion = async () => {
    if (stats.pendienteRendir <= 0) {
      toast.error('No tenés montos pendientes de rendir');
      return;
    }

    setIsSubmitting(true);
    try {
      // Crear nueva rendición con el período actual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { error } = await supabase
        .from('rendiciones')
        .insert({
          asistente_id: (await supabase.auth.getUser()).data.user?.id, // Esto debería ser tenant_id
          periodo_desde: startOfMonth.toISOString().split('T')[0],
          periodo_hasta: now.toISOString().split('T')[0],
          total_eventos: stats.eventosEsteMes,
          monto_total_vendido: stats.facturacionMes,
          comision_asistente: stats.comisionMes,
          monto_a_rendir: stats.pendienteRendir,
          estado: 'pendiente',
          notas: notas || null,
        });

      if (error) throw error;

      toast.success('Rendición creada correctamente');
      setCreateModalOpen(false);
      setNotas('');
      onRefetch();
    } catch (error) {
      console.error('Error creating rendicion:', error);
      toast.error('Error al crear la rendición');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen de rendiciones */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendiente a Rendir</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatPrice(stats.pendienteRendir)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Rendido</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(
                    rendiciones
                      .filter(r => r.estado === 'verificado')
                      .reduce((sum, r) => sum + r.monto_a_rendir, 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Wallet className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tu Ganancia Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPrice(stats.comisionTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acción para crear rendición */}
      {stats.pendienteRendir > 0 && (
        <Card className="border-primary/50">
          <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4">
            <div>
              <p className="font-semibold">Crear Nueva Rendición</p>
              <p className="text-sm text-muted-foreground">
                Tenés {formatPrice(stats.pendienteRendir)} pendiente de rendir al Super Admin
              </p>
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Send className="w-4 h-4 mr-2" />
              Crear Rendición
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Historial de rendiciones */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Rendiciones</CardTitle>
          <CardDescription>
            Registro de todas tus rendiciones al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rendiciones.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tenés rendiciones registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Eventos</TableHead>
                  <TableHead>Vendido</TableHead>
                  <TableHead>Tu Comisión</TableHead>
                  <TableHead>A Rendir</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rendiciones.map((rendicion) => {
                  const config = estadoConfig[rendicion.estado as keyof typeof estadoConfig] || estadoConfig.pendiente;
                  const IconComponent = config.icon;

                  return (
                    <TableRow key={rendicion.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {formatDate(rendicion.periodo_desde)} - {formatDate(rendicion.periodo_hasta)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Creada: {formatDate(rendicion.created_at)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {rendicion.total_eventos} eventos
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatPrice(rendicion.monto_total_vendido)}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatPrice(rendicion.comision_asistente)}
                      </TableCell>
                      <TableCell className="text-amber-600 font-medium">
                        {formatPrice(rendicion.monto_a_rendir)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={`${config.color} ${config.bg}`}
                        >
                          <IconComponent className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rendicion.estado === 'pendiente' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMarcarRendido(rendicion.id)}
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Marcar Enviado
                          </Button>
                        )}
                        {rendicion.estado === 'verificado' && (
                          <span className="text-sm text-green-600">
                            ✓ {rendicion.fecha_verificacion && formatDate(rendicion.fecha_verificacion)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal crear rendición */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Rendición</DialogTitle>
            <DialogDescription>
              Vas a crear una rendición por {formatPrice(stats.pendienteRendir)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Eventos este mes</p>
                <p className="font-medium">{stats.eventosEsteMes}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Facturación</p>
                <p className="font-medium">{formatPrice(stats.facturacionMes)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tu comisión</p>
                <p className="font-medium text-green-600">{formatPrice(stats.comisionMes)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">A rendir</p>
                <p className="font-medium text-amber-600">{formatPrice(stats.pendienteRendir)}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Textarea
                placeholder="Agregá notas o comentarios sobre esta rendición..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCrearRendicion} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Rendición
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
