/**
 * PICKEVENT - Utilidades
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { APP_CONFIG } from "./constants";

// Combinar clases de Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generar token único para QR
export function generateQRToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generar ID de dispositivo para invitados
export function generateDeviceId(): string {
  const stored = localStorage.getItem('pickevent_device_id');
  if (stored) return stored;
  
  const newId = crypto.randomUUID();
  localStorage.setItem('pickevent_device_id', newId);
  return newId;
}

// Formatear fecha para mostrar (sin problemas de timezone)
export function formatDate(date: string | Date): string {
  // Si es un string en formato YYYY-MM-DD, parsearlo directamente sin timezone
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  }
  
  // Para otros formatos, usar el parsing normal pero con precaución de timezone
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Formatear hora
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}hs`;
}

// Formatear fecha y hora completa
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Formatear precio en pesos argentinos
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Calcular fecha de fin del evento
export function calculateEventEndDate(startDate: string, durationHours: number): Date {
  const start = new Date(startDate);
  return new Date(start.getTime() + durationHours * 60 * 60 * 1000);
}

// Calcular fecha de expiración del álbum
export function calculateAlbumExpiry(eventEndDate: Date): Date {
  const expiry = new Date(eventEndDate);
  expiry.setDate(expiry.getDate() + APP_CONFIG.ALBUM_DURATION_DAYS);
  return expiry;
}

// Validar tamaño de archivo
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

// Obtener extensión del archivo
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// Validar extensión de archivo
export function validateFileExtension(filename: string, allowedExtensions: string[]): boolean {
  const ext = getFileExtension(filename);
  return allowedExtensions.includes(ext);
}

// Truncar texto
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Generar URL del muro
export function getMuroUrl(token: string): string {
  return `${window.location.origin}/muro/${token}`;
}

// Generar URL de subida
export function getUploadUrl(token: string): string {
  return `${window.location.origin}/subir/${token}`;
}

// Generar URL de descarga
export function getDownloadUrl(token: string): string {
  return `${window.location.origin}/album/${token}`;
}

// Tiempo transcurrido (hace X tiempo)
export function timeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
  if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  return 'hace un momento';
}

// Tiempo restante
export function timeRemaining(endDate: string | Date): string {
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Finalizado';
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} día${days > 1 ? 's' : ''} restante${days > 1 ? 's' : ''}`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}min restantes`;
  }
  
  return `${minutes} minuto${minutes > 1 ? 's' : ''} restante${minutes > 1 ? 's' : ''}`;
}

// Verificar si el evento está activo
export function isEventActive(event: { estado: string; fecha_inicio_real?: string; fecha_fin_real?: string }): boolean {
  if (event.estado !== 'activo') return false;
  if (!event.fecha_inicio_real) return false;
  
  const now = new Date();
  const start = new Date(event.fecha_inicio_real);
  
  if (event.fecha_fin_real) {
    const end = new Date(event.fecha_fin_real);
    return now >= start && now <= end;
  }
  
  return now >= start;
}

// Obtener iniciales de un nombre
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Delay promise
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
