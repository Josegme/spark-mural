/**
 * PICKEVENT - Tabs de subida de contenido
 */

import { useState } from 'react';
import { Camera, Video, MessageCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PhotoUploadForm } from './PhotoUploadForm';
import { VideoUploadForm } from './VideoUploadForm';
import { MessageForm } from './MessageForm';

interface UploadTabsProps {
  onUploadPhoto: (file: File, guestName: string, message?: string) => Promise<{ success: boolean }>;
  onUploadVideo: (file: File, guestName: string) => Promise<{ success: boolean }>;
  onSendMessage: (message: string, guestName: string) => Promise<{ success: boolean }>;
  isUploading: boolean;
  isPremium: boolean;
}

export function UploadTabs({
  onUploadPhoto,
  onUploadVideo,
  onSendMessage,
  isUploading,
  isPremium,
}: UploadTabsProps) {
  const [activeTab, setActiveTab] = useState('foto');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="foto" className="gap-2">
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">Foto</span>
        </TabsTrigger>
        <TabsTrigger value="video" className="gap-2">
          <Video className="w-4 h-4" />
          <span className="hidden sm:inline">Video</span>
        </TabsTrigger>
        <TabsTrigger value="mensaje" className="gap-2">
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Mensaje</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="foto">
        <PhotoUploadForm
          onUpload={onUploadPhoto}
          isUploading={isUploading}
          isPremium={isPremium}
        />
      </TabsContent>

      <TabsContent value="video">
        <VideoUploadForm
          onUpload={onUploadVideo}
          isUploading={isUploading}
        />
      </TabsContent>

      <TabsContent value="mensaje">
        <MessageForm
          onSend={onSendMessage}
          isUploading={isUploading}
        />
      </TabsContent>
    </Tabs>
  );
}
