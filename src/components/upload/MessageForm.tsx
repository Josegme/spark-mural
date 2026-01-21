/**
 * PICKEVENT - Formulario de envío de mensajes
 */

import { useState } from 'react';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { APP_CONFIG } from '@/lib/constants';

interface MessageFormProps {
  onSend: (message: string, guestName: string) => Promise<{ success: boolean }>;
  isUploading: boolean;
}

export function MessageForm({ onSend, isUploading }: MessageFormProps) {
  const [message, setMessage] = useState('');
  const [guestName, setGuestName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const result = await onSend(message, guestName);
    if (result.success) {
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Icono decorativo */}
      <div className="flex justify-center">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageCircle className="w-12 h-12 text-primary" />
        </div>
      </div>

      {/* Mensaje */}
      <div className="space-y-2">
        <Label htmlFor="messageText">Tu mensaje</Label>
        <Textarea
          id="messageText"
          placeholder="Escribí tu mensaje para los anfitriones..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={APP_CONFIG.MAX_MESSAGE_LENGTH}
          rows={4}
          className="text-lg"
        />
        <p className="text-xs text-muted-foreground text-right">
          {message.length}/{APP_CONFIG.MAX_MESSAGE_LENGTH}
        </p>
      </div>

      {/* Nombre del invitado */}
      <div className="space-y-2">
        <Label htmlFor="messageGuestName">Tu nombre (opcional)</Label>
        <Input
          id="messageGuestName"
          placeholder="¿Cómo te llamás?"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          maxLength={50}
        />
      </div>

      {/* Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm">
        <p className="text-foreground">
          💬 Tu mensaje aparecerá en la pantalla del evento como una burbuja flotante.
        </p>
      </div>

      {/* Botón de envío */}
      <Button
        type="submit"
        className="w-full btn-hero"
        disabled={!message.trim() || isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            Enviar mensaje
          </>
        )}
      </Button>
    </form>
  );
}
