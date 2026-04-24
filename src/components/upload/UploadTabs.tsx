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
      <TabsList className="grid w-full grid-cols-3 mb-6 h-auto p-1">
        <TabsTrigger value="foto" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2 sm:py-1.5 touch-feedback">
          <Camera className="w-4 h-4" />
          <span className="text-xs sm:text-sm">Foto</span>
        </TabsTrigger>
        <TabsTrigger value="video" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2 sm:py-1.5 touch-feedback">
          <Video className="w-4 h-4" />
          <span className="text-xs sm:text-sm">Video</span>
        </TabsTrigger>
        <TabsTrigger value="mensaje" className="flex-col sm:flex-row gap-1 sm:gap-2 py-2 sm:py-1.5 touch-feedback">
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs sm:text-sm">Mensaje</span>
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
