/**
 * PICKEVENT - Formulario de subida de videos
 */

import { useState, useRef } from 'react';
import { Video, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { APP_CONFIG } from '@/lib/constants';

interface VideoUploadFormProps {
  onUpload: (file: File, guestName: string) => Promise<{ success: boolean }>;
  isUploading: boolean;
}

export function VideoUploadForm({ onUpload, isUploading }: VideoUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
    }
  };

  const clearFile = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const result = await onUpload(file, guestName);
    if (result.success) {
      clearFile();
      setGuestName('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Área de selección de video */}
      <div className="relative">
        {preview ? (
          <div className="relative rounded-2xl overflow-hidden">
            <video
              src={preview}
              className="w-full h-64 object-cover"
              controls
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={clearFile}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-muted-foreground/30 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
            <Video className="w-16 h-16 text-muted-foreground mb-4" />
            <span className="text-lg font-medium text-muted-foreground">
              Tocá para elegir video
            </span>
            <span className="text-sm text-muted-foreground/70 mt-1">
              MP4, MOV hasta {APP_CONFIG.MAX_VIDEO_SIZE_MB}MB
            </span>
            <span className="text-sm text-muted-foreground/70">
              Máximo {APP_CONFIG.MAX_VIDEO_DURATION_SECONDS} segundos
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Nombre del invitado */}
      <div className="space-y-2">
        <Label htmlFor="videoGuestName">Tu nombre (opcional)</Label>
        <Input
          id="videoGuestName"
          placeholder="¿Cómo te llamás?"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          maxLength={50}
        />
      </div>

      {/* Info */}
      <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
        <p>📹 Los videos se guardan en el álbum para descargar después del evento.</p>
      </div>

      {/* Botón de envío */}
      <Button
        type="submit"
        className="w-full btn-hero"
        disabled={!file || isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Subiendo...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 mr-2" />
            Subir video
          </>
        )}
      </Button>
    </form>
  );
}
