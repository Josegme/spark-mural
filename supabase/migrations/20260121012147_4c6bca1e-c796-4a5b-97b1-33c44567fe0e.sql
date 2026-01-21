-- ============================================
-- PICKEVENT - ESQUEMA DE BASE DE DATOS
-- Migración inicial con todas las tablas
-- ============================================

-- ENUMS
CREATE TYPE public.user_role AS ENUM ('super_admin', 'asistente', 'salon', 'cliente');
CREATE TYPE public.tenant_type AS ENUM ('asistente', 'salon');
CREATE TYPE public.tenant_status AS ENUM ('activo', 'suspendido', 'moroso');
CREATE TYPE public.event_type AS ENUM ('cumpleanos', 'casamiento', 'graduacion', 'corporativo', 'fiesta_tematica', 'otro');
CREATE TYPE public.event_status AS ENUM ('programado', 'activo', 'finalizado', 'cancelado');
CREATE TYPE public.content_type AS ENUM ('foto', 'video', 'mensaje');
CREATE TYPE public.ia_status AS ENUM ('pendiente', 'procesando', 'completado', 'error');
CREATE TYPE public.ia_style AS ENUM ('caricatura', 'comico', 'cinematografico', 'futurista', 'realista', 'fantasia');
CREATE TYPE public.payment_gateway AS ENUM ('mercadopago_ar', 'mercadopago_br', 'mercadopago_py', 'bancard', 'stripe');
CREATE TYPE public.payment_type AS ENUM ('evento_unico', 'suscripcion_mensual');
CREATE TYPE public.payment_status AS ENUM ('pendiente', 'aprobado', 'rechazado', 'reembolsado');
CREATE TYPE public.subscription_status AS ENUM ('activo', 'vencido', 'suspendido');
CREATE TYPE public.rendition_status AS ENUM ('pendiente', 'rendido', 'verificado');

-- TABLA: profiles (usuarios del sistema)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  pais TEXT DEFAULT 'Argentina',
  rol user_role NOT NULL DEFAULT 'cliente',
  tenant_id UUID,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLA: tenants (asistentes y salones)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo tenant_type NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  pais TEXT NOT NULL DEFAULT 'Argentina',
  plan_id UUID,
  precio_mensual INTEGER,
  fecha_vencimiento TIMESTAMPTZ,
  limite_eventos_mes INTEGER DEFAULT 20,
  comision_asistente INTEGER DEFAULT 70,
  comision_superadmin INTEGER DEFAULT 30,
  ubicacion_lat DECIMAL(10, 8),
  ubicacion_lng DECIMAL(11, 8),
  estado tenant_status NOT NULL DEFAULT 'activo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLA: planes
CREATE TABLE public.planes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  precio_sugerido INTEGER NOT NULL,
  limite_eventos_mes INTEGER NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLA: eventos
CREATE TABLE public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  cliente_user_id UUID NOT NULL REFERENCES public.profiles(id),
  nombre TEXT NOT NULL,
  tipo event_type NOT NULL DEFAULT 'cumpleanos',
  fecha_evento DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  duracion_horas INTEGER NOT NULL DEFAULT 24,
  fecha_inicio_real TIMESTAMPTZ,
  fecha_fin_real TIMESTAMPTZ,
  estado event_status NOT NULL DEFAULT 'programado',
  es_premium BOOLEAN NOT NULL DEFAULT false,
  tema_ia TEXT,
  estilo_ia ia_style,
  logo_url TEXT,
  color_banner TEXT DEFAULT '#4c1d95',
  precio_pagado INTEGER NOT NULL DEFAULT 0,
  pasarela_pago payment_gateway,
  payment_id TEXT,
  qr_pantalla_token TEXT NOT NULL UNIQUE,
  qr_invitados_token TEXT NOT NULL UNIQUE,
  qr_descarga_token TEXT NOT NULL UNIQUE,
  limite_subidas_por_invitado INTEGER,
  moderacion_activa BOOLEAN NOT NULL DEFAULT false,
  total_fotos INTEGER NOT NULL DEFAULT 0,
  total_videos INTEGER NOT NULL DEFAULT 0,
  total_mensajes INTEGER NOT NULL DEFAULT 0,
  total_likes INTEGER NOT NULL DEFAULT 0,
  album_disponible_hasta TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLA: contenido
CREATE TABLE public.contenido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  tipo content_type NOT NULL,
  invitado_nombre TEXT,
  invitado_device_id TEXT,
  url_original TEXT,
  url_ia TEXT,
  mensaje_texto TEXT,
  estado_ia ia_status NOT NULL DEFAULT 'pendiente',
  moderado BOOLEAN NOT NULL DEFAULT false,
  aprobado BOOLEAN NOT NULL DEFAULT true,
  likes_count INTEGER NOT NULL DEFAULT 0,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLA: likes
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contenido_id UUID NOT NULL REFERENCES public.contenido(id) ON DELETE CASCADE,
  invitado_device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contenido_id, invitado_device_id)
);

-- TABLA: pagos
CREATE TABLE public.pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES public.eventos(id),
  suscripcion_id UUID,
  tipo payment_type NOT NULL,
  monto INTEGER NOT NULL,
  pasarela payment_gateway NOT NULL,
  payment_id_externo TEXT,
  estado payment_status NOT NULL DEFAULT 'pendiente',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLA: suscripciones
CREATE TABLE public.suscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.tenants(id),
  plan_id UUID NOT NULL REFERENCES public.planes(id),
  precio_mensual INTEGER NOT NULL,
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_vencimiento TIMESTAMPTZ NOT NULL,
  fecha_proximo_pago TIMESTAMPTZ NOT NULL,
  estado subscription_status NOT NULL DEFAULT 'activo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLA: rendiciones
CREATE TABLE public.rendiciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asistente_id UUID NOT NULL REFERENCES public.tenants(id),
  periodo_desde DATE NOT NULL,
  periodo_hasta DATE NOT NULL,
  total_eventos INTEGER NOT NULL DEFAULT 0,
  monto_total_vendido INTEGER NOT NULL DEFAULT 0,
  comision_asistente INTEGER NOT NULL DEFAULT 0,
  monto_a_rendir INTEGER NOT NULL DEFAULT 0,
  estado rendition_status NOT NULL DEFAULT 'pendiente',
  comprobante_url TEXT,
  fecha_rendicion TIMESTAMPTZ,
  fecha_verificacion TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLA: notificaciones
CREATE TABLE public.notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLA: logs_auditoria
CREATE TABLE public.logs_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  accion TEXT NOT NULL,
  tabla_afectada TEXT,
  registro_id TEXT,
  ip_address TEXT,
  detalles JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ÍNDICES
CREATE INDEX idx_eventos_cliente ON public.eventos(cliente_user_id);
CREATE INDEX idx_eventos_estado ON public.eventos(estado);
CREATE INDEX idx_eventos_qr_pantalla ON public.eventos(qr_pantalla_token);
CREATE INDEX idx_eventos_qr_invitados ON public.eventos(qr_invitados_token);
CREATE INDEX idx_contenido_evento ON public.contenido(evento_id);
CREATE INDEX idx_contenido_tipo ON public.contenido(tipo);
CREATE INDEX idx_likes_contenido ON public.likes(contenido_id);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contenido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS: profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- POLÍTICAS RLS: eventos (clientes ven sus eventos)
CREATE POLICY "Clients can view own events" ON public.eventos FOR SELECT USING (auth.uid() = cliente_user_id);
CREATE POLICY "Clients can insert own events" ON public.eventos FOR INSERT WITH CHECK (auth.uid() = cliente_user_id);
CREATE POLICY "Clients can update own events" ON public.eventos FOR UPDATE USING (auth.uid() = cliente_user_id);

-- POLÍTICAS RLS: contenido (público para visualizar en muro)
CREATE POLICY "Anyone can view approved content" ON public.contenido FOR SELECT USING (aprobado = true);
CREATE POLICY "Anyone can insert content" ON public.contenido FOR INSERT WITH CHECK (true);

-- POLÍTICAS RLS: likes
CREATE POLICY "Anyone can view likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert likes" ON public.likes FOR INSERT WITH CHECK (true);

-- POLÍTICAS RLS: notificaciones
CREATE POLICY "Users see own notifications" ON public.notificaciones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notificaciones FOR UPDATE USING (auth.uid() = user_id);

-- TRIGGER: actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_eventos_updated_at BEFORE UPDATE ON public.eventos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- HABILITAR REALTIME para contenido y likes
ALTER PUBLICATION supabase_realtime ADD TABLE public.contenido;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;