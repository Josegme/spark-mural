/**
 * PICKEVENT - Formulario de subida de fotos
 */

import { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { APP_CONFIG } from '@/lib/constants';

interface PhotoUploadFormProps {
  onUpload: (file: File, guestName: string, message?: string) => Promise<{ success: boolean }>;
  isUploading: boolean;
  isPremium: boolean;
}

export function PhotoUploadForm({ onUpload, isUploading, isPremium }: PhotoUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const result = await onUpload(file, guestName, message);
    if (result.success) {
      clearFile();
      setGuestName('');
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Área de selección de foto */}
      <div className="relative">
        {preview ? (
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-cover"
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
            {isPremium && (
              <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-gradient-premium px-3 py-1.5 rounded-full">
                <Sparkles className="w-4 h-4 text-black" />
                <span className="text-black text-sm font-medium">Se transformará con IA</span>
              </div>
            )}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-muted-foreground/30 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
            <Camera className="w-16 h-16 text-muted-foreground mb-4" />
            <span className="text-lg font-medium text-muted-foreground">
              Tocá para elegir foto
            </span>
            <span className="text-sm text-muted-foreground/70 mt-1">
              JPG, PNG, HEIC hasta {APP_CONFIG.MAX_PHOTO_SIZE_MB}MB
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Nombre del invitado */}
      <div className="space-y-2">
        <Label htmlFor="guestName">Tu nombre (opcional)</Label>
        <Input
          id="guestName"
          placeholder="¿Cómo te llamás?"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          maxLength={50}
        />
      </div>

      {/* Mensaje opcional */}
      <div className="space-y-2">
        <Label htmlFor="message">Mensaje (opcional)</Label>
        <Textarea
          id="message"
          placeholder="Escribí un mensaje para los anfitriones..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={APP_CONFIG.MAX_MESSAGE_LENGTH}
          rows={2}
        />
        <p className="text-xs text-muted-foreground text-right">
          {message.length}/{APP_CONFIG.MAX_MESSAGE_LENGTH}
        </p>
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
            Subir foto
          </>
        )}
      </Button>
    </form>
  );
}
