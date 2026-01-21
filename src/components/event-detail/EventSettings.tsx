/**
 * Panel de configuración del evento
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, Shield, Palette, Save, Loader2 } from 'lucide-react';
import type { EventDetails } from '@/hooks/useEventDetails';

interface EventSettingsProps {
  event: EventDetails;
  onUpdate: (updates: Record<string, unknown>) => void;
  isUpdating?: boolean;
}

export function EventSettings({ event, onUpdate, isUpdating }: EventSettingsProps) {
  const [moderationActive, setModerationActive] = useState(event.moderacion_activa);
  const [uploadLimit, setUploadLimit] = useState(event.limite_subidas_por_invitado?.toString() || '');
  const [bannerColor, setBannerColor] = useState(event.color_banner || '#4c1d95');

  const handleSave = () => {
    onUpdate({
      moderacion_activa: moderationActive,
      limite_subidas_por_invitado: uploadLimit ? parseInt(uploadLimit) : null,
      color_banner: bannerColor,
    });
  };

  const hasChanges = 
    moderationActive !== event.moderacion_activa ||
    (uploadLimit || '') !== (event.limite_subidas_por_invitado?.toString() || '') ||
    bannerColor !== (event.color_banner || '#4c1d95');

  return (
    <div className="space-y-6">
      {/* Moderación */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Moderación</CardTitle>
          </div>
          <CardDescription>
            Controla qué contenido se muestra en el muro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="moderation">Moderación activa</Label>
              <p className="text-sm text-muted-foreground">
                El contenido requiere aprobación antes de mostrarse
              </p>
            </div>
            <Switch
              id="moderation"
              checked={moderationActive}
              onCheckedChange={setModerationActive}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="uploadLimit">Límite de subidas por invitado</Label>
            <div className="flex items-center gap-2">
              <Input
                id="uploadLimit"
                type="number"
                min="1"
                max="100"
                placeholder="Sin límite"
                value={uploadLimit}
                onChange={(e) => setUploadLimit(e.target.value)}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">
                fotos/videos por persona
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personalización */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-accent" />
            <CardTitle className="text-lg">Personalización</CardTitle>
          </div>
          <CardDescription>
            Ajusta la apariencia del muro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bannerColor">Color del banner</Label>
            <div className="flex items-center gap-3">
              <Input
                id="bannerColor"
                type="color"
                value={bannerColor}
                onChange={(e) => setBannerColor(e.target.value)}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={bannerColor}
                onChange={(e) => setBannerColor(e.target.value)}
                className="w-32 font-mono"
                placeholder="#000000"
              />
              <div 
                className="w-10 h-10 rounded-lg border"
                style={{ backgroundColor: bannerColor }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información del evento */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-secondary" />
            <CardTitle className="text-lg">Información</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Duración</dt>
              <dd className="font-medium">{event.duracion_horas} horas</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tipo</dt>
              <dd className="font-medium capitalize">{event.tipo}</dd>
            </div>
            {event.es_premium && event.estilo_ia && (
              <>
                <div>
                  <dt className="text-muted-foreground">Estilo IA</dt>
                  <dd className="font-medium capitalize">{event.estilo_ia}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tema IA</dt>
                  <dd className="font-medium">{event.tema_ia || 'Sin tema'}</dd>
                </div>
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Botón guardar */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Guardar Cambios
          </Button>
        </div>
      )}
    </div>
  );
}
