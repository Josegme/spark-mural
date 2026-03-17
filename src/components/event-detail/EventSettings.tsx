/**
 * Panel de configuración del evento
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Shield, 
  Palette, 
  Save, 
  Loader2, 
  Trash2, 
  AlertTriangle,
  Link as LinkIcon,
  Copy,
  Check
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { EventDetails } from '@/hooks/useEventDetails';
import { useAuth } from '@/contexts/AuthContext';

interface EventSettingsProps {
  event: EventDetails;
  onUpdate: (updates: Record<string, unknown>) => void;
  onDelete?: () => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function EventSettings({ event, onUpdate, onDelete, isUpdating, isDeleting }: EventSettingsProps) {
  const { profile } = useAuth();
  const [moderationActive, setModerationActive] = useState(event.moderacion_activa);

  // Keep local state in sync with DB after refetch
  useEffect(() => {
    setModerationActive(event.moderacion_activa);
  }, [event.moderacion_activa]);
  const [uploadLimit, setUploadLimit] = useState(event.limite_subidas_por_invitado?.toString() || '');
  const [bannerColor, setBannerColor] = useState(event.color_banner || '#4c1d95');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Lógica de eliminación por rol
  const userRole = profile?.rol || 'cliente';
  const isSuperAdmin = userRole === 'super_admin';
  const isSalon = userRole === 'salon';
  const isEventActive = event.estado === 'activo';
  const isPaid = event.precio_pagado > 0;
  const paymentPending = event.pago_estado === 'pendiente';

  // Super Admin: siempre (excepto activos)
  // Salón: siempre (excepto activos) - trabaja por cuota
  // Asistente/Cliente: solo si no está pagado, o si el pago sigue pendiente
  const canDeleteEvent = !isEventActive && (
    isSuperAdmin || isSalon || !isPaid || paymentPending
  );

  const deleteReason = isEventActive
    ? 'No se puede eliminar un evento activo'
    : isPaid && !paymentPending && !isSuperAdmin && !isSalon
      ? 'No se puede eliminar un evento que ya fue pagado'
      : null;

  const handleSave = () => {
    onUpdate({
      moderacion_activa: moderationActive,
      limite_subidas_por_invitado: uploadLimit ? parseInt(uploadLimit) : null,
      color_banner: bannerColor,
    });
  };

  const handleCopyPaymentLink = async () => {
    if (event.payment_link) {
      await navigator.clipboard.writeText(event.payment_link);
      setLinkCopied(true);
      toast.success('Link de pago copiado');
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      // La navegación se hace en el hook después de que la mutación sea exitosa
    }
  };

  const hasChanges = 
    moderationActive !== event.moderacion_activa ||
    (uploadLimit || '') !== (event.limite_subidas_por_invitado?.toString() || '') ||
    bannerColor !== (event.color_banner || '#4c1d95');

  const canDelete = deleteConfirmation.toLowerCase() === 'eliminar';

  return (
    <div className="space-y-6">
      {/* Link de Pago (si existe) */}
      {event.payment_link && event.precio_pagado > 0 && (
        <Card className="border-info/50 bg-info/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-info" />
              <CardTitle className="text-lg">Link de Pago</CardTitle>
            </div>
            <CardDescription>
              Compartí este link con el cliente para que complete el pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={event.payment_link}
                className="font-mono text-sm bg-background"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyPaymentLink}
                className="shrink-0"
              >
                {linkCopied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              onCheckedChange={(checked) => {
                setModerationActive(checked);
                // Auto-save moderation toggle immediately for instant sync with Moderación tab
                onUpdate({ moderacion_activa: checked });
              }}
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

      {/* Zona de peligro - Eliminar evento */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <CardTitle className="text-lg text-destructive">Zona de Peligro</CardTitle>
          </div>
          <CardDescription>
            Acciones irreversibles que afectan permanentemente al evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Eliminar evento</p>
              <p className="text-sm text-muted-foreground">
                {deleteReason || 'Elimina el evento y todo su contenido permanentemente'}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={!canDeleteEvent}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    ¿Eliminar evento permanentemente?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <p>
                      Esta acción es <strong>irreversible</strong>. Se eliminarán:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>El evento "{event.nombre}"</li>
                      <li>Todas las fotos y videos ({event.total_fotos + event.total_videos} archivos)</li>
                      <li>Todos los mensajes ({event.total_mensajes})</li>
                      <li>Los códigos QR asociados</li>
                    </ul>
                    <div className="pt-4">
                      <Label htmlFor="deleteConfirm">
                        Escribí <strong>ELIMINAR</strong> para confirmar
                      </Label>
                      <Input
                        id="deleteConfirm"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="ELIMINAR"
                        className="mt-2"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={!canDelete || isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Eliminar Permanentemente
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
