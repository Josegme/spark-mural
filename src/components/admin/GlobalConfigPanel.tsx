/**
 * PICKEVENT - Panel de Configuración Global
 * Permite editar precios, comisiones y límites del sistema
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useGlobalConfig } from '@/hooks/useGlobalConfig';
import { Settings, DollarSign, Percent, Users, Save, Loader2, Building2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export function GlobalConfigPanel() {
  const { config, isLoading, updateConfig, isUpdating } = useGlobalConfig();
  
  // Estados locales para edición
  const [preciosEventos, setPreciosEventos] = useState({ basico: 0, premium: 0 });
  const [preciosSuscripciones, setPreciosSuscripciones] = useState({ starter: 150000, profesional: 250000, ilimitado: 500000 });
  const [comisiones, setComisiones] = useState({ asistente: 50, superadmin: 50 });
  const [limites, setLimites] = useState({ 
    eventos_mes_asistente: 30, 
    eventos_mes_salon: 20, 
    cortesias_iniciales: 2 
  });

  // Sincronizar con config cuando cargue
  useEffect(() => {
    if (config) {
      setPreciosEventos(config.precios_eventos || { basico: 10000, premium: 25000 });
      setPreciosSuscripciones(config.precios_suscripciones || { starter: 150000, profesional: 250000, ilimitado: 500000 });
      setComisiones(config.comisiones_default || { asistente: 50, superadmin: 50 });
      setLimites(config.limites_default || { 
        eventos_mes_asistente: 30, 
        eventos_mes_salon: 20, 
        cortesias_iniciales: 2 
      });
    }
  }, [config]);

  const handleSavePrecios = () => {
    updateConfig('precios_eventos', preciosEventos);
  };

  const handleSavePreciosSuscripciones = () => {
    updateConfig('precios_suscripciones', preciosSuscripciones);
  };

  const handleSaveComisiones = () => {
    // Asegurar que sumen 100
    const total = comisiones.asistente + comisiones.superadmin;
    if (total !== 100) {
      setComisiones({
        asistente: comisiones.asistente,
        superadmin: 100 - comisiones.asistente
      });
    }
    updateConfig('comisiones_default', {
      asistente: comisiones.asistente,
      superadmin: 100 - comisiones.asistente
    });
  };

  const handleSaveLimites = () => {
    updateConfig('limites_default', limites);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Precios de Eventos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5 text-primary" />
            Precios de Eventos
          </CardTitle>
          <CardDescription>
            Precios por defecto para eventos individuales (clientes directos)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precio-basico">Plan Básico (ARS)</Label>
              <Input
                id="precio-basico"
                type="number"
                value={preciosEventos.basico}
                onChange={(e) => setPreciosEventos(prev => ({ ...prev, basico: parseInt(e.target.value) || 0 }))}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Actual: {formatPrice(preciosEventos.basico)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio-premium">Plan Premium + IA (ARS)</Label>
              <Input
                id="precio-premium"
                type="number"
                value={preciosEventos.premium}
                onChange={(e) => setPreciosEventos(prev => ({ ...prev, premium: parseInt(e.target.value) || 0 }))}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Actual: {formatPrice(preciosEventos.premium)}
              </p>
            </div>
          </div>
          <Button 
            onClick={handleSavePrecios} 
            disabled={isUpdating}
            size="sm"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Precios Eventos
          </Button>
        </CardContent>
      </Card>

      {/* Precios de Suscripciones para Salones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-accent" />
            Precios de Suscripciones
          </CardTitle>
          <CardDescription>
            Precios sugeridos para suscripciones de salones (modificables por acuerdo)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precio-starter">Plan Starter (ARS)</Label>
              <Input
                id="precio-starter"
                type="number"
                value={preciosSuscripciones.starter}
                onChange={(e) => setPreciosSuscripciones(prev => ({ ...prev, starter: parseInt(e.target.value) || 0 }))}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {formatPrice(preciosSuscripciones.starter)}/mes
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio-profesional">Plan Profesional (ARS)</Label>
              <Input
                id="precio-profesional"
                type="number"
                value={preciosSuscripciones.profesional}
                onChange={(e) => setPreciosSuscripciones(prev => ({ ...prev, profesional: parseInt(e.target.value) || 0 }))}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {formatPrice(preciosSuscripciones.profesional)}/mes
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio-ilimitado">Plan Ilimitado (ARS)</Label>
              <Input
                id="precio-ilimitado"
                type="number"
                value={preciosSuscripciones.ilimitado}
                onChange={(e) => setPreciosSuscripciones(prev => ({ ...prev, ilimitado: parseInt(e.target.value) || 0 }))}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {formatPrice(preciosSuscripciones.ilimitado)}/mes
              </p>
            </div>
          </div>
          <Button 
            onClick={handleSavePreciosSuscripciones} 
            disabled={isUpdating}
            size="sm"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Precios Suscripciones
          </Button>
        </CardContent>
      </Card>

      {/* Comisiones por Defecto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Percent className="w-5 h-5 text-accent" />
            Comisiones por Defecto
          </CardTitle>
          <CardDescription>
            Split de comisiones para nuevos asistentes (deben sumar 100%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="comision-asistente">Comisión Asistente (%)</Label>
              <Input
                id="comision-asistente"
                type="number"
                min={0}
                max={100}
                value={comisiones.asistente}
                onChange={(e) => {
                  const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                  setComisiones({ asistente: val, superadmin: 100 - val });
                }}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comision-superadmin">Comisión Super Admin (%)</Label>
              <Input
                id="comision-superadmin"
                type="number"
                value={comisiones.superadmin}
                disabled
                className="font-mono bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Calculado automáticamente
              </p>
            </div>
          </div>
          <Button 
            onClick={handleSaveComisiones} 
            disabled={isUpdating}
            size="sm"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Comisiones
          </Button>
        </CardContent>
      </Card>

      {/* Límites por Defecto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-secondary" />
            Límites por Defecto
          </CardTitle>
          <CardDescription>
            Límites iniciales para nuevos tenants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="limite-asistente">Eventos/mes Asistente</Label>
              <Input
                id="limite-asistente"
                type="number"
                value={limites.eventos_mes_asistente}
                onChange={(e) => setLimites(prev => ({ 
                  ...prev, 
                  eventos_mes_asistente: parseInt(e.target.value) || 0 
                }))}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limite-salon">Eventos/mes Salón</Label>
              <Input
                id="limite-salon"
                type="number"
                value={limites.eventos_mes_salon}
                onChange={(e) => setLimites(prev => ({ 
                  ...prev, 
                  eventos_mes_salon: parseInt(e.target.value) || 0 
                }))}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cortesias-iniciales">Cortesías Iniciales</Label>
              <Input
                id="cortesias-iniciales"
                type="number"
                value={limites.cortesias_iniciales}
                onChange={(e) => setLimites(prev => ({ 
                  ...prev, 
                  cortesias_iniciales: parseInt(e.target.value) || 0 
                }))}
                className="font-mono"
              />
            </div>
          </div>
          <Button 
            onClick={handleSaveLimites} 
            disabled={isUpdating}
            size="sm"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Límites
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
