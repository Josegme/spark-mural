/**
 * Editor de plantilla de certificado con preview en vivo.
 */
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload, X, Save, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  TIPO_PRESETS,
  uploadCertAsset,
  useGuardarCertificado,
  type Certificado,
  type CertOrientacion,
  type CertPlantilla,
  type CertTipo,
  type CertTipografia,
  type Firma,
} from '@/hooks/useCertificados';
import { CertificadoPreview } from './CertificadoPreview';
import { generarCertificadoPDF, downloadPdfBlob } from './pdfUtils';

interface Props {
  eventoId: string;
  eventoNombre: string;
  fechaEvento: string;
  certificado: Certificado | null;
}

const DEFAULT: Omit<Certificado, 'id' | 'evento_id' | 'created_at' | 'updated_at'> = {
  tipo: 'participacion',
  plantilla: 'moderna',
  orientacion: 'horizontal',
  titulo: TIPO_PRESETS.participacion.titulo,
  texto_principal: TIPO_PRESETS.participacion.texto,
  texto_secundario: '',
  organizador: '',
  lugar: '',
  logo_principal_url: null,
  logo_secundario_url: null,
  firmas: [],
  color_primario: '#4c1d95',
  color_secundario: '#ec4899',
  tipografia: 'sans',
  fondo_url: null,
  activo: true,
};

export function CertificadoEditor({ eventoId, eventoNombre, fechaEvento, certificado }: Props) {
  const [form, setForm] = useState<Omit<Certificado, 'id' | 'evento_id' | 'created_at' | 'updated_at'>>(DEFAULT);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const guardar = useGuardarCertificado(eventoId);

  useEffect(() => {
    if (certificado) {
      const { id, evento_id, created_at, updated_at, ...rest } = certificado;
      setForm({ ...DEFAULT, ...rest, firmas: rest.firmas || [] });
      setSavedId(id);
    }
  }, [certificado]);

  const update = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleTipoChange = (tipo: CertTipo) => {
    const preset = TIPO_PRESETS[tipo];
    setForm(prev => ({
      ...prev,
      tipo,
      titulo: preset.titulo,
      texto_principal: preset.texto,
    }));
  };

  const handleUpload = async (file: File, kind: 'logo_principal' | 'logo_secundario' | 'fondo' | 'firma', firmaIdx?: number) => {
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Imagen muy pesada', description: 'Máximo 2 MB', variant: 'destructive' });
      return;
    }
    setUploading(kind + (firmaIdx ?? ''));
    try {
      const assetKind = kind === 'firma' ? 'firma' : 'logo';
      const url = await uploadCertAsset(eventoId, file, assetKind);
      if (kind === 'logo_principal') update('logo_principal_url', url);
      else if (kind === 'logo_secundario') update('logo_secundario_url', url);
      else if (kind === 'fondo') update('fondo_url', url);
      else if (kind === 'firma' && firmaIdx !== undefined) {
        const nuevas = [...form.firmas];
        nuevas[firmaIdx] = { ...nuevas[firmaIdx], imagen_url: url };
        update('firmas', nuevas);
      }
      toast({ title: 'Imagen subida' });
    } catch (e) {
      toast({ title: 'Error al subir', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    try {
      const id = await guardar.mutateAsync({ ...form, id: savedId || undefined });
      setSavedId(id);
      toast({ title: 'Plantilla guardada' });
    } catch (e) {
      toast({ title: 'Error al guardar', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  const handleDownloadPreview = async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      const { blob } = await generarCertificadoPDF(previewRef.current, form.orientacion);
      downloadPdfBlob(blob, `preview-certificado.pdf`);
      toast({ title: 'PDF descargado' });
    } catch (e) {
      toast({ title: 'Error al generar PDF', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  const addFirma = () => {
    if (form.firmas.length >= 2) return;
    update('firmas', [...form.firmas, { nombre: '', cargo: '', imagen_url: null }]);
  };
  const updateFirma = (idx: number, patch: Partial<Firma>) => {
    const nuevas = [...form.firmas];
    nuevas[idx] = { ...nuevas[idx], ...patch };
    update('firmas', nuevas);
  };
  const removeFirma = (idx: number) => {
    update('firmas', form.firmas.filter((_, i) => i !== idx));
  };

  const fechaFmt = fechaEvento
    ? new Date(fechaEvento + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* CONFIGURACIÓN */}
      <Card>
        <CardHeader>
          <CardTitle>Personalizar certificado</CardTitle>
          <CardDescription>Configurá una vez y emití para todos los invitados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="contenido" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="contenido">Contenido</TabsTrigger>
              <TabsTrigger value="diseno">Diseño</TabsTrigger>
              <TabsTrigger value="firmas">Firmas</TabsTrigger>
            </TabsList>

            <TabsContent value="contenido" className="space-y-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => handleTipoChange(v as CertTipo)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_PRESETS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Título</Label>
                <Input value={form.titulo} onChange={e => update('titulo', e.target.value)} />
              </div>
              <div>
                <Label>Texto principal</Label>
                <Textarea
                  rows={4}
                  value={form.texto_principal}
                  onChange={e => update('texto_principal', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Variables: <code>{'{nombre}'}</code>, <code>{'{evento}'}</code>, <code>{'{fecha}'}</code>, <code>{'{lugar}'}</code>, <code>{'{organizador}'}</code>
                </p>
              </div>
              <div>
                <Label>Texto secundario (opcional)</Label>
                <Textarea
                  rows={2}
                  value={form.texto_secundario || ''}
                  onChange={e => update('texto_secundario', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Organizador</Label>
                  <Input value={form.organizador || ''} onChange={e => update('organizador', e.target.value)} placeholder="Ej. Empresa X" />
                </div>
                <div>
                  <Label>Lugar</Label>
                  <Input value={form.lugar || ''} onChange={e => update('lugar', e.target.value)} placeholder="Ej. Buenos Aires" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="diseno" className="space-y-4">
              <div>
                <Label>Plantilla</Label>
                <Select value={form.plantilla} onValueChange={v => update('plantilla', v as CertPlantilla)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moderna">Moderna — minimalista, ideal corporativo</SelectItem>
                    <SelectItem value="clasica">Clásica — ornamental, ideal diplomas</SelectItem>
                    <SelectItem value="festiva">Festiva — colorida, ideal cumpleaños / bodas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Orientación</Label>
                  <Select value={form.orientacion} onValueChange={v => update('orientacion', v as CertOrientacion)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="horizontal">Horizontal (apaisado)</SelectItem>
                      <SelectItem value="vertical">Vertical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipografía</Label>
                  <Select value={form.tipografia} onValueChange={v => update('tipografia', v as CertTipografia)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans">Sans (moderna)</SelectItem>
                      <SelectItem value="serif">Serif (clásica)</SelectItem>
                      <SelectItem value="mixta">Mixta (elegante)</SelectItem>
                      <SelectItem value="script">Script (cursiva)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Color primario</Label>
                  <div className="flex gap-2 items-center">
                    <Input type="color" value={form.color_primario} onChange={e => update('color_primario', e.target.value)} className="w-16 h-10 p-1" />
                    <Input value={form.color_primario} onChange={e => update('color_primario', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Color secundario</Label>
                  <div className="flex gap-2 items-center">
                    <Input type="color" value={form.color_secundario} onChange={e => update('color_secundario', e.target.value)} className="w-16 h-10 p-1" />
                    <Input value={form.color_secundario} onChange={e => update('color_secundario', e.target.value)} />
                  </div>
                </div>
              </div>

              <FileField
                label="Logo principal"
                url={form.logo_principal_url}
                uploading={uploading === 'logo_principal'}
                onUpload={f => handleUpload(f, 'logo_principal')}
                onClear={() => update('logo_principal_url', null)}
              />
              <FileField
                label="Logo secundario (auspiciante)"
                url={form.logo_secundario_url}
                uploading={uploading === 'logo_secundario'}
                onUpload={f => handleUpload(f, 'logo_secundario')}
                onClear={() => update('logo_secundario_url', null)}
              />
            </TabsContent>

            <TabsContent value="firmas" className="space-y-4">
              {form.firmas.map((firma, idx) => (
                <div key={idx} className="space-y-2 p-3 border rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Firma {idx + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeFirma(idx)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input placeholder="Nombre" value={firma.nombre} onChange={e => updateFirma(idx, { nombre: e.target.value })} />
                  <Input placeholder="Cargo" value={firma.cargo} onChange={e => updateFirma(idx, { cargo: e.target.value })} />
                  <FileField
                    label="Imagen de firma (PNG con fondo transparente)"
                    url={firma.imagen_url}
                    uploading={uploading === 'firma' + idx}
                    onUpload={f => handleUpload(f, 'firma', idx)}
                    onClear={() => updateFirma(idx, { imagen_url: null })}
                  />
                </div>
              ))}
              {form.firmas.length < 2 && (
                <Button variant="outline" onClick={addFirma} className="w-full">
                  + Agregar firma
                </Button>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-6 pt-4 border-t">
            <Button onClick={handleSave} disabled={guardar.isPending} className="flex-1">
              {guardar.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar plantilla
            </Button>
            <Button variant="outline" onClick={handleDownloadPreview} disabled={downloading}>
              {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Probar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PREVIEW */}
      <Card>
        <CardHeader>
          <CardTitle>Vista previa</CardTitle>
          <CardDescription>Datos de muestra. Se reemplazan al emitir.</CardDescription>
        </CardHeader>
        <CardContent>
          <CertificadoPreview
            ref={previewRef}
            cert={{ ...form, id: savedId || '', evento_id: eventoId, created_at: '', updated_at: '' }}
            nombre="Juan Pérez García"
            evento={eventoNombre}
            fecha={fechaFmt}
            codigo="DEMO1234"
            verifyUrl={`${window.location.origin}/certificado/DEMO1234`}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function FileField({
  label,
  url,
  uploading,
  onUpload,
  onClear,
}: {
  label: string;
  url: string | null;
  uploading: boolean;
  onUpload: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 items-center mt-1">
        {url ? (
          <>
            <img src={url} alt="" className="h-10 max-w-[120px] object-contain bg-muted rounded px-2" />
            <Button variant="ghost" size="sm" onClick={onClear}>
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Subir imagen
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
