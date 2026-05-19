/**
 * PICKEVENT - Constantes del Sistema
 */

// URLs base (se actualizarán en producción)
// Feature flags
export const FEATURE_FLAGS = {
  IA_ENABLED: false, // Cambiar a true cuando la IA esté lista
  INVITACIONES: true, // Módulo de invitaciones digitales (RSVP + QR + Check-in)
  CERTIFICADOS: true, // Módulo de certificados de participación
} as const;

export const APP_CONFIG = {
  APP_NAME: 'PickEvent',
  APP_DESCRIPTION: 'Sistema de Muros Interactivos para Eventos',
  APP_VERSION: '1.0.0',
  
  // Duración del álbum en días
  ALBUM_DURATION_DAYS: 30,
  
  // Duraciones de evento disponibles
  EVENT_DURATIONS: [6, 12, 24] as const,
  
  // Límites de contenido
  MAX_PHOTO_SIZE_MB: 10,
  MAX_VIDEO_SIZE_MB: 50,
  MAX_VIDEO_DURATION_SECONDS: 30,
  MAX_MESSAGE_LENGTH: 150,
  
  // Extensiones permitidas
  ALLOWED_PHOTO_EXTENSIONS: ['jpg', 'jpeg', 'png', 'heic', 'webp'],
  ALLOWED_VIDEO_EXTENSIONS: ['mp4', 'mov', 'webm'],
  
  // Tiempos del carrusel (en milisegundos)
  CAROUSEL_PHOTO_DURATION: 5000, // 5 segundos
  CAROUSEL_PHOTO_WITH_IA_DURATION: 7000, // 7 segundos (3 original + 1 transición + 3 IA)
  CAROUSEL_TRANSITION_DURATION: 1000, // 1 segundo
  
  // Tiempos de mensajes flotantes (en milisegundos)
  MESSAGE_BUBBLE_DURATION: 5000, // 5 segundos - luego desaparece
  MESSAGE_MAX_VISIBLE: 3, // Máximo 3 mensajes visibles a la vez
  
  // Colores por defecto del muro
  DEFAULT_BANNER_COLOR: '#4c1d95', // Púrpura oscuro
} as const;

// Tipos de eventos con sus íconos y labels
export const EVENT_TYPES = {
  cumpleanos: { label: 'Cumpleaños', icon: '🎂', color: 'primary' },
  casamiento: { label: 'Casamiento', icon: '💍', color: 'accent' },
  graduacion: { label: 'Graduación', icon: '🎓', color: 'info' },
  corporativo: { label: 'Corporativo', icon: '🏢', color: 'secondary' },
  fiesta_tematica: { label: 'Fiesta Temática', icon: '🎉', color: 'warning' },
  otro: { label: 'Otro', icon: '✨', color: 'muted' },
} as const;

// Estados de eventos con sus configuraciones
export const EVENT_STATUS = {
  programado: { label: 'Programado', icon: '⏱️', color: 'info' },
  activo: { label: 'En Vivo', icon: '🔴', color: 'success' },
  pausado: { label: 'Pausado', icon: '⏸️', color: 'warning' },
  finalizado: { label: 'Finalizado', icon: '✅', color: 'muted' },
  cancelado: { label: 'Cancelado', icon: '❌', color: 'destructive' },
} as const;

// Estilos de IA disponibles (incluyendo los nuevos)
export const IA_STYLES = {
  caricatura: { 
    label: 'Caricatura', 
    description: 'Estilo cartoon, colores vibrantes y rasgos exagerados',
    icon: '🎨'
  },
  comico: { 
    label: 'Cómic', 
    description: 'Estilo cómic americano, pop art con puntos halftone',
    icon: '💥'
  },
  cinematografico: { 
    label: 'Cinematográfico', 
    description: 'Estilo de película, iluminación dramática y profesional',
    icon: '🎬'
  },
  futurista: { 
    label: 'Futurista', 
    description: 'Estilo sci-fi, luces neón y estética cyberpunk',
    icon: '🚀'
  },
  realista: { 
    label: 'Realista', 
    description: 'Mejora fotorealista con iluminación natural',
    icon: '📸'
  },
  fantasia: { 
    label: 'Fantasía', 
    description: 'Arte fantástico, mágico y etéreo',
    icon: '🧚'
  },
  anime: { 
    label: 'Anime', 
    description: 'Estilo japonés con ojos grandes y colores vibrantes',
    icon: '🌸'
  },
  vintage: { 
    label: 'Vintage', 
    description: 'Filtro retro con tonos sepia y grano de película',
    icon: '📷'
  },
  acuarela: { 
    label: 'Acuarela', 
    description: 'Pintura artística con colores fluidos y bordes suaves',
    icon: '🖌️'
  },
  neon: { 
    label: 'Neón', 
    description: 'Efectos brillantes con colores fluorescentes',
    icon: '💜'
  },
  minimalista: { 
    label: 'Minimalista', 
    description: 'Formas simples, paleta limitada y diseño limpio',
    icon: '⬜'
  },
} as const;

// Pasarelas de pago por país
export const PAYMENT_GATEWAYS = {
  AR: { gateway: 'mercadopago_ar', label: 'Mercado Pago', icon: '🇦🇷' },
  BR: { gateway: 'mercadopago_br', label: 'Mercado Pago Brasil', icon: '🇧🇷' },
  PY: { gateway: 'mercadopago_py', label: 'Mercado Pago / Bancard', icon: '🇵🇾' },
  NZ: { gateway: 'stripe', label: 'Stripe', icon: '🇳🇿' },
} as const;

// Planes de suscripción (fallback - fuente de verdad: configuracion_global)
export const SUBSCRIPTION_PLANS = {
  basico: {
    nombre: 'Starter',
    precio: 150000,
    limite_eventos_mes: 10,
    descripcion: 'Ideal para salones pequeños',
    features: [
      'Hasta 10 eventos por mes',
      'Muro interactivo en tiempo real',
      '3 QR codes por evento',
      'Álbum descargable',
      'Soporte por email',
    ],
  },
  premium: {
    nombre: 'Profesional',
    precio: 290000,
    limite_eventos_mes: 20,
    descripcion: 'Para salones con alta demanda',
    features: [
      'Hasta 20 eventos por mes',
      'Todo lo del plan Starter',
      'IA generativa incluida',
      'Personalización avanzada',
      'Soporte prioritario',
      'Reportes detallados',
    ],
  },
  enterprise: {
    nombre: 'Ilimitado',
    precio: 457000,
    limite_eventos_mes: -1, // Ilimitado
    descripcion: 'Solución completa para grandes empresas',
    features: [
      'Eventos ilimitados',
      'Todo lo del plan Profesional',
      'API acceso',
      'White-label opcional',
      'Soporte dedicado 24/7',
      'Capacitación incluida',
    ],
  },
} as const;

// Precios de eventos individuales (fallback - fuente de verdad: configuracion_global)
export const EVENT_PRICES = {
  basico: {
    nombre: 'Básico',
    precio: 110000,
    descripcion: 'Muro interactivo sin IA',
    features: [
      'Muro interactivo en vivo',
      '3 QR codes',
      'Fotos y videos ilimitados',
      'Mensajes flotantes',
      'Álbum descargable (30 días)',
      'Juegos interactivos en vivo',
    ],
  },
  premium: {
    nombre: 'Premium + IA',
    precio: 153000,
    descripcion: 'Con transformación de fotos',
    features: [
      'Todo lo del plan Básico',
      'IA generativa para fotos (próximamente)',
      'Elegí tema y estilo',
      'Efecto transición en muro',
      'Fotos originales + transformadas',
    ],
  },
} as const;

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  PHOTO_TOO_LARGE: `La foto es muy pesada. Máximo ${APP_CONFIG.MAX_PHOTO_SIZE_MB}MB`,
  VIDEO_TOO_LARGE: `El video es muy pesado. Máximo ${APP_CONFIG.MAX_VIDEO_SIZE_MB}MB`,
  VIDEO_TOO_LONG: `El video es muy largo. Máximo ${APP_CONFIG.MAX_VIDEO_DURATION_SECONDS} segundos`,
  MESSAGE_TOO_LONG: `Mensaje muy largo. Máximo ${APP_CONFIG.MAX_MESSAGE_LENGTH} caracteres`,
  INVALID_FILE_TYPE: 'Tipo de archivo no permitido',
  EVENT_NOT_FOUND: 'Evento no encontrado',
  EVENT_NOT_ACTIVE: 'Este evento no está activo',
  UPLOAD_LIMIT_REACHED: 'Alcanzaste el límite de subidas',
  OFFENSIVE_CONTENT: 'Tu mensaje contiene palabras inapropiadas',
  AUTH_REQUIRED: 'Necesitás iniciar sesión',
  PERMISSION_DENIED: 'No tenés permisos para esta acción',
} as const;

// Mensajes de éxito
export const SUCCESS_MESSAGES = {
  PHOTO_UPLOADED: '¡Foto subida! Aparecerá en la pantalla en segundos',
  VIDEO_UPLOADED: '¡Video subido! Se guardó en el álbum',
  MESSAGE_SENT: '¡Mensaje enviado! Aparecerá en la pantalla',
  EVENT_CREATED: '¡Evento creado exitosamente!',
  EVENT_ACTIVATED: '¡Evento activado! Ya pueden subir contenido',
  PAYMENT_SUCCESS: '¡Pago confirmado!',
} as const;
