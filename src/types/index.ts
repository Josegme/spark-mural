/**
 * PICKEVENT - Tipos del Sistema
 * Definición de todos los tipos TypeScript del sistema
 */

// ============================================
// ENUMS
// ============================================

export type UserRole = 'super_admin' | 'asistente' | 'salon' | 'cliente' | 'invitado';

export type TenantType = 'asistente' | 'salon';

export type EventType = 'cumpleanos' | 'casamiento' | 'graduacion' | 'corporativo' | 'fiesta_tematica' | 'otro';

export type EventStatus = 'programado' | 'activo' | 'finalizado' | 'cancelado';

export type ContentType = 'foto' | 'video' | 'mensaje';

export type IAStatus = 'pendiente' | 'procesando' | 'completado' | 'error';

export type IAStyle = 'caricatura' | 'comico' | 'cinematografico' | 'futurista' | 'realista' | 'fantasia';

export type PaymentGateway = 'mercadopago_ar' | 'mercadopago_br' | 'mercadopago_py' | 'bancard' | 'stripe';

export type PaymentType = 'evento_unico' | 'suscripcion_mensual';

export type PaymentStatus = 'pendiente' | 'aprobado' | 'rechazado' | 'reembolsado';

export type RenditionStatus = 'pendiente' | 'rendido' | 'verificado';

export type SubscriptionStatus = 'activo' | 'vencido' | 'suspendido';

export type TenantStatus = 'activo' | 'suspendido' | 'moroso';

export type NotificationType = 
  | 'aprobacion_precio'
  | 'rendicion_pendiente'
  | 'evento_creado'
  | 'suscripcion_vencida'
  | 'pago_recibido'
  | 'contenido_nuevo';

// ============================================
// INTERFACES PRINCIPALES
// ============================================

export interface User {
  id: string;
  email: string;
  nombre: string;
  telefono?: string;
  pais?: string;
  rol: UserRole;
  tenant_id?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  tipo: TenantType;
  nombre: string;
  email: string;
  pais: string;
  // Solo para salones
  plan_id?: string;
  precio_mensual?: number;
  fecha_vencimiento?: string;
  limite_eventos_mes?: number;
  // Solo para asistentes
  comision_asistente?: number;
  comision_superadmin?: number;
  // Ubicación
  ubicacion_lat?: number;
  ubicacion_lng?: number;
  // Estado
  estado: TenantStatus;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  tenant_id?: string;
  cliente_user_id: string;
  nombre: string;
  tipo: EventType;
  fecha_evento: string;
  hora_inicio: string;
  duracion_horas: 6 | 12 | 24;
  fecha_inicio_real?: string;
  fecha_fin_real?: string;
  estado: EventStatus;
  // Premium / IA
  es_premium: boolean;
  tema_ia?: string;
  estilo_ia?: IAStyle;
  // Personalización
  logo_url?: string;
  color_banner?: string;
  // Pago
  precio_pagado: number;
  pasarela_pago?: PaymentGateway;
  payment_id?: string;
  // QR Tokens (únicos por evento)
  qr_pantalla_token: string;
  qr_invitados_token: string;
  qr_descarga_token: string;
  // Configuración
  limite_subidas_por_invitado?: number;
  moderacion_activa: boolean;
  // Estadísticas
  total_fotos: number;
  total_videos: number;
  total_mensajes: number;
  total_likes: number;
  // Álbum
  album_disponible_hasta?: string;
  created_at: string;
  updated_at: string;
}

export interface Content {
  id: string;
  evento_id: string;
  tipo: ContentType;
  invitado_nombre?: string;
  invitado_device_id?: string;
  url_original?: string;
  url_ia?: string;
  mensaje_texto?: string;
  estado_ia: IAStatus;
  moderado: boolean;
  aprobado: boolean;
  likes_count: number;
  ip_address?: string;
  created_at: string;
}

export interface Like {
  id: string;
  contenido_id: string;
  invitado_device_id: string;
  created_at: string;
}

export interface Plan {
  id: string;
  nombre: string;
  precio_sugerido: number;
  limite_eventos_mes: number;
  descripcion?: string;
  activo: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  salon_id: string;
  plan_id: string;
  precio_mensual: number;
  fecha_inicio: string;
  fecha_vencimiento: string;
  fecha_proximo_pago: string;
  estado: SubscriptionStatus;
  created_at: string;
}

export interface Rendition {
  id: string;
  asistente_id: string;
  periodo_desde: string;
  periodo_hasta: string;
  total_eventos: number;
  monto_total_vendido: number;
  comision_asistente: number;
  monto_a_rendir: number;
  estado: RenditionStatus;
  comprobante_url?: string;
  fecha_rendicion?: string;
  fecha_verificacion?: string;
  notas?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  evento_id?: string;
  suscripcion_id?: string;
  tipo: PaymentType;
  monto: number;
  pasarela: PaymentGateway;
  payment_id_externo?: string;
  estado: PaymentStatus;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  accion: string;
  tabla_afectada?: string;
  registro_id?: string;
  ip_address?: string;
  detalles?: Record<string, unknown>;
  created_at: string;
}

// ============================================
// INTERFACES PARA FORMULARIOS
// ============================================

export interface CreateEventForm {
  nombre: string;
  tipo: EventType;
  fecha_evento: string;
  hora_inicio: string;
  duracion_horas: 6 | 12 | 24;
  es_premium: boolean;
  tema_ia?: string;
  estilo_ia?: IAStyle;
  logo_url?: string;
  color_banner?: string;
}

export interface UploadContentForm {
  tipo: ContentType;
  file?: File;
  mensaje_texto?: string;
  invitado_nombre?: string;
}

// ============================================
// INTERFACES PARA WEBSOCKETS / REALTIME
// ============================================

export interface RealtimePhotoPayload {
  tipo: 'nueva_foto';
  contenido_id: string;
  url_original: string;
  mensaje?: string;
  invitado_nombre?: string;
  timestamp: number;
}

export interface RealtimeIAPayload {
  tipo: 'foto_con_ia';
  contenido_id: string;
  url_original: string;
  url_ia: string;
  efecto: 'transicion';
}

export interface RealtimeMessagePayload {
  tipo: 'nuevo_mensaje';
  contenido_id: string;
  mensaje_texto: string;
  invitado_nombre?: string;
  timestamp: number;
}

export interface RealtimeLikePayload {
  tipo: 'nuevo_like';
  contenido_id: string;
  likes_count: number;
}

export type RealtimePayload = 
  | RealtimePhotoPayload 
  | RealtimeIAPayload 
  | RealtimeMessagePayload 
  | RealtimeLikePayload;

// ============================================
// INTERFACES PARA API RESPONSES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================
// CREDENCIALES DE PRUEBA (solo desarrollo)
// ============================================

export const TEST_USERS = {
  super_admin: {
    email: 'superadmin@pickevent.com',
    password: 'superadmin123',
    rol: 'super_admin' as UserRole,
  },
  asistente: {
    email: 'asistente@pickevent.com',
    password: 'asistente123',
    rol: 'asistente' as UserRole,
    nombre: 'Juan Pérez',
    pais: 'Argentina',
    comision_asistente: 70,
    comision_superadmin: 30,
  },
  salon: {
    email: 'salon@pickevent.com',
    password: 'salon123',
    rol: 'salon' as UserRole,
    nombre: 'Salón La Fiesta',
    plan: 'premium',
    precio_mensual: 50000,
    ubicacion: 'Buenos Aires, Argentina',
    limite_eventos_mes: 30,
  },
  cliente: {
    email: 'cliente@pickevent.com',
    password: 'cliente123',
    rol: 'cliente' as UserRole,
    nombre: 'María González',
  },
};
