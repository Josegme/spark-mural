/**
 * Grid de contenido del evento (fotos, videos, mensajes)
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Camera, 
  Video, 
  MessageSquare, 
  Heart, 
  Check, 
  X, 
  Eye,
  Sparkles,
  Clock
} from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import type { EventContent } from '@/hooks/useEventDetails';

interface ContentGridProps {
  content: EventContent[];
  onModerate: (contentId: string, aprobado: boolean) => void;
  showModeration?: boolean;
}

export function ContentGrid({ content, onModerate, showModeration = false }: ContentGridProps) {
  const [selectedContent, setSelectedContent] = useState<EventContent | null>(null);

  const photos = content.filter(c => c.tipo === 'foto');
  const videos = content.filter(c => c.tipo === 'video');
  const messages = content.filter(c => c.tipo === 'mensaje');

  const pendingCount = content.filter(c => !c.moderado && !c.aprobado).length;

  return (
    <>
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            Todos
            <Badge variant="secondary" className="text-xs">{content.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="photos" className="gap-2">
            <Camera className="w-4 h-4" />
            Fotos
            <Badge variant="secondary" className="text-xs">{photos.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-2">
            <Video className="w-4 h-4" />
            Videos
            <Badge variant="secondary" className="text-xs">{videos.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Mensajes
            <Badge variant="secondary" className="text-xs">{messages.length}</Badge>
          </TabsTrigger>
          {showModeration && pendingCount > 0 && (
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pendientes
              <Badge variant="destructive" className="text-xs">{pendingCount}</Badge>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all">
          <ContentItems 
            items={content} 
            onSelect={setSelectedContent}
            onModerate={onModerate}
            showModeration={showModeration}
          />
        </TabsContent>

        <TabsContent value="photos">
          <ContentItems 
            items={photos} 
            onSelect={setSelectedContent}
            onModerate={onModerate}
            showModeration={showModeration}
          />
        </TabsContent>

        <TabsContent value="videos">
          <ContentItems 
            items={videos} 
            onSelect={setSelectedContent}
            onModerate={onModerate}
            showModeration={showModeration}
          />
        </TabsContent>

        <TabsContent value="messages">
          <MessagesList messages={messages} />
        </TabsContent>

        {showModeration && (
          <TabsContent value="pending">
            <ContentItems 
              items={content.filter(c => !c.moderado)} 
              onSelect={setSelectedContent}
              onModerate={onModerate}
              showModeration={true}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Modal de visualización */}
      <ContentPreviewModal
        content={selectedContent}
        open={!!selectedContent}
        onOpenChange={(open) => !open && setSelectedContent(null)}
        onModerate={onModerate}
        showModeration={showModeration}
      />
    </>
  );
}

interface ContentItemsProps {
  items: EventContent[];
  onSelect: (content: EventContent) => void;
  onModerate: (contentId: string, aprobado: boolean) => void;
  showModeration: boolean;
}

function ContentItems({ items, onSelect, onModerate, showModeration }: ContentItemsProps) {
  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Camera className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No hay contenido todavía</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <ContentCard
          key={item.id}
          content={item}
          onSelect={() => onSelect(item)}
          onModerate={onModerate}
          showModeration={showModeration}
        />
      ))}
    </div>
  );
}

interface ContentCardProps {
  content: EventContent;
  onSelect: () => void;
  onModerate: (contentId: string, aprobado: boolean) => void;
  showModeration: boolean;
}

function ContentCard({ content, onSelect, onModerate, showModeration }: ContentCardProps) {
  const isPhoto = content.tipo === 'foto';
  const isVideo = content.tipo === 'video';
  const hasIA = content.url_ia;
  const isPending = !content.moderado && !content.aprobado;

  return (
    <Card className="group relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
      <div className="aspect-square relative" onClick={onSelect}>
        {(isPhoto || isVideo) && content.url_original && (
          <>
            {isPhoto ? (
              <img
                src={hasIA ? content.url_ia! : content.url_original}
                alt="Contenido"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={content.url_original}
                className="w-full h-full object-cover"
              />
            )}
          </>
        )}

        {/* Overlay con info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs">
            <span>{content.invitado_nombre || 'Anónimo'}</span>
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {content.likes_count}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {isVideo && (
            <Badge variant="secondary" className="text-xs">
              <Video className="w-3 h-3" />
            </Badge>
          )}
          {hasIA && (
            <Badge className="badge-premium text-xs">
              <Sparkles className="w-3 h-3" />
            </Badge>
          )}
        </div>

        {/* Estado de moderación */}
        {!content.aprobado && content.moderado && (
          <div className="absolute top-2 right-2">
            <Badge variant="destructive" className="text-xs">Rechazado</Badge>
          </div>
        )}
        {isPending && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="text-xs bg-background">Pendiente</Badge>
          </div>
        )}
      </div>

      {/* Acciones de moderación */}
      {showModeration && isPending && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-background/95 backdrop-blur flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-destructive hover:text-destructive/80"
            onClick={(e) => {
              e.stopPropagation();
              onModerate(content.id, false);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onModerate(content.id, true);
            }}
          >
            <Check className="w-4 h-4" />
          </Button>
        </div>
      )}
    </Card>
  );
}

interface MessagesListProps {
  messages: EventContent[];
}

function MessagesList({ messages }: MessagesListProps) {
  if (messages.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No hay mensajes todavía</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <Card key={message.id}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">
                  {message.invitado_nombre || 'Anónimo'}
                </p>
                <p className="text-muted-foreground">
                  {message.mensaje_texto}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Heart className="w-3 h-3" />
                {message.likes_count}
                <span>•</span>
                {timeAgo(message.created_at)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface ContentPreviewModalProps {
  content: EventContent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModerate: (contentId: string, aprobado: boolean) => void;
  showModeration: boolean;
}

function ContentPreviewModal({ content, open, onOpenChange, onModerate, showModeration }: ContentPreviewModalProps) {
  if (!content) return null;

  const isPhoto = content.tipo === 'foto';
  const hasIA = content.url_ia;
  const isPending = !content.moderado;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPhoto ? <Camera className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            {content.invitado_nombre || 'Anónimo'}
            {hasIA && (
              <Badge className="badge-premium ml-2">
                <Sparkles className="w-3 h-3 mr-1" />
                IA
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Media */}
          <div className="rounded-lg overflow-hidden bg-muted">
            {isPhoto ? (
              <img
                src={hasIA ? content.url_ia! : content.url_original!}
                alt="Contenido"
                className="w-full max-h-[60vh] object-contain"
              />
            ) : (
              <video
                src={content.url_original!}
                controls
                className="w-full max-h-[60vh]"
              />
            )}
          </div>

          {/* Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>{timeAgo(content.created_at)}</span>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {content.likes_count} likes
              </div>
            </div>

            {/* Acciones de moderación */}
            {showModeration && isPending && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive/80"
                  onClick={() => {
                    onModerate(content.id, false);
                    onOpenChange(false);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
                <Button
                  className="bg-success hover:bg-success/90 text-success-foreground"
                  onClick={() => {
                    onModerate(content.id, true);
                    onOpenChange(false);
                  }}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Aprobar
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
