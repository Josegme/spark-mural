export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      checkins: {
        Row: {
          evento_id: string
          id: string
          ingreso_at: string
          invitacion_id: string
          operador_user_id: string | null
        }
        Insert: {
          evento_id: string
          id?: string
          ingreso_at?: string
          invitacion_id: string
          operador_user_id?: string | null
        }
        Update: {
          evento_id?: string
          id?: string
          ingreso_at?: string
          invitacion_id?: string
          operador_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_invitacion_id_fkey"
            columns: ["invitacion_id"]
            isOneToOne: true
            referencedRelation: "invitaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      comisiones_config: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          mp_application_id: string | null
          mp_marketplace_id: string | null
          porcentaje_asistente: number
          porcentaje_superadmin: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          mp_application_id?: string | null
          mp_marketplace_id?: string | null
          porcentaje_asistente?: number
          porcentaje_superadmin?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          mp_application_id?: string | null
          mp_marketplace_id?: string | null
          porcentaje_asistente?: number
          porcentaje_superadmin?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comisiones_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_global: {
        Row: {
          clave: string
          descripcion: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
          valor: Json
        }
        Insert: {
          clave: string
          descripcion?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
          valor: Json
        }
        Update: {
          clave?: string
          descripcion?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
          valor?: Json
        }
        Relationships: []
      }
      contenido: {
        Row: {
          aprobado: boolean
          created_at: string
          estado_ia: Database["public"]["Enums"]["ia_status"]
          evento_id: string
          id: string
          invitado_device_id: string | null
          invitado_nombre: string | null
          ip_address: string | null
          likes_count: number
          mensaje_texto: string | null
          moderado: boolean
          tipo: Database["public"]["Enums"]["content_type"]
          url_ia: string | null
          url_original: string | null
        }
        Insert: {
          aprobado?: boolean
          created_at?: string
          estado_ia?: Database["public"]["Enums"]["ia_status"]
          evento_id: string
          id?: string
          invitado_device_id?: string | null
          invitado_nombre?: string | null
          ip_address?: string | null
          likes_count?: number
          mensaje_texto?: string | null
          moderado?: boolean
          tipo: Database["public"]["Enums"]["content_type"]
          url_ia?: string | null
          url_original?: string | null
        }
        Update: {
          aprobado?: boolean
          created_at?: string
          estado_ia?: Database["public"]["Enums"]["ia_status"]
          evento_id?: string
          id?: string
          invitado_device_id?: string | null
          invitado_nombre?: string | null
          ip_address?: string | null
          likes_count?: number
          mensaje_texto?: string | null
          moderado?: boolean
          tipo?: Database["public"]["Enums"]["content_type"]
          url_ia?: string | null
          url_original?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contenido_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contenido_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_public"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          album_disponible_hasta: string | null
          cliente_user_id: string
          color_banner: string | null
          created_at: string
          duracion_horas: number
          es_premium: boolean
          estado: Database["public"]["Enums"]["event_status"]
          estilo_ia: Database["public"]["Enums"]["ia_style"] | null
          fecha_evento: string
          fecha_fin_real: string | null
          fecha_inicio_real: string | null
          hora_inicio: string
          id: string
          invitacion_tarjeta_formato: string | null
          invitacion_tarjeta_url: string | null
          invitaciones_acompanantes_max: number
          invitaciones_activas: boolean
          invitaciones_cupo_maximo: number | null
          invitaciones_fecha_limite_rsvp: string | null
          invitaciones_mensaje: string | null
          limite_subidas_por_invitado: number | null
          logo_url: string | null
          moderacion_activa: boolean
          nombre: string
          pasarela_pago: Database["public"]["Enums"]["payment_gateway"] | null
          payment_id: string | null
          precio_pagado: number
          qr_checkin_token: string | null
          qr_descarga_token: string
          qr_invitaciones_token: string | null
          qr_invitados_token: string
          qr_pantalla_token: string
          tema_ia: string | null
          tenant_id: string | null
          tipo: Database["public"]["Enums"]["event_type"]
          total_fotos: number
          total_likes: number
          total_mensajes: number
          total_videos: number
          updated_at: string
        }
        Insert: {
          album_disponible_hasta?: string | null
          cliente_user_id: string
          color_banner?: string | null
          created_at?: string
          duracion_horas?: number
          es_premium?: boolean
          estado?: Database["public"]["Enums"]["event_status"]
          estilo_ia?: Database["public"]["Enums"]["ia_style"] | null
          fecha_evento: string
          fecha_fin_real?: string | null
          fecha_inicio_real?: string | null
          hora_inicio: string
          id?: string
          invitacion_tarjeta_formato?: string | null
          invitacion_tarjeta_url?: string | null
          invitaciones_acompanantes_max?: number
          invitaciones_activas?: boolean
          invitaciones_cupo_maximo?: number | null
          invitaciones_fecha_limite_rsvp?: string | null
          invitaciones_mensaje?: string | null
          limite_subidas_por_invitado?: number | null
          logo_url?: string | null
          moderacion_activa?: boolean
          nombre: string
          pasarela_pago?: Database["public"]["Enums"]["payment_gateway"] | null
          payment_id?: string | null
          precio_pagado?: number
          qr_checkin_token?: string | null
          qr_descarga_token: string
          qr_invitaciones_token?: string | null
          qr_invitados_token: string
          qr_pantalla_token: string
          tema_ia?: string | null
          tenant_id?: string | null
          tipo?: Database["public"]["Enums"]["event_type"]
          total_fotos?: number
          total_likes?: number
          total_mensajes?: number
          total_videos?: number
          updated_at?: string
        }
        Update: {
          album_disponible_hasta?: string | null
          cliente_user_id?: string
          color_banner?: string | null
          created_at?: string
          duracion_horas?: number
          es_premium?: boolean
          estado?: Database["public"]["Enums"]["event_status"]
          estilo_ia?: Database["public"]["Enums"]["ia_style"] | null
          fecha_evento?: string
          fecha_fin_real?: string | null
          fecha_inicio_real?: string | null
          hora_inicio?: string
          id?: string
          invitacion_tarjeta_formato?: string | null
          invitacion_tarjeta_url?: string | null
          invitaciones_acompanantes_max?: number
          invitaciones_activas?: boolean
          invitaciones_cupo_maximo?: number | null
          invitaciones_fecha_limite_rsvp?: string | null
          invitaciones_mensaje?: string | null
          limite_subidas_por_invitado?: number | null
          logo_url?: string | null
          moderacion_activa?: boolean
          nombre?: string
          pasarela_pago?: Database["public"]["Enums"]["payment_gateway"] | null
          payment_id?: string | null
          precio_pagado?: number
          qr_checkin_token?: string | null
          qr_descarga_token?: string
          qr_invitaciones_token?: string | null
          qr_invitados_token?: string
          qr_pantalla_token?: string
          tema_ia?: string | null
          tenant_id?: string | null
          tipo?: Database["public"]["Enums"]["event_type"]
          total_fotos?: number
          total_likes?: number
          total_mensajes?: number
          total_videos?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_cliente_user_id_fkey"
            columns: ["cliente_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_cliente_user_id_fkey"
            columns: ["cliente_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invitaciones: {
        Row: {
          acompanantes: number
          confirmado_at: string | null
          created_at: string
          device_id: string | null
          email: string | null
          estado: Database["public"]["Enums"]["invitacion_status"]
          evento_id: string
          id: string
          mensaje_anfitrion: string | null
          nombre: string
          qr_token: string
          restricciones: string | null
          telefono: string | null
        }
        Insert: {
          acompanantes?: number
          confirmado_at?: string | null
          created_at?: string
          device_id?: string | null
          email?: string | null
          estado?: Database["public"]["Enums"]["invitacion_status"]
          evento_id: string
          id?: string
          mensaje_anfitrion?: string | null
          nombre: string
          qr_token: string
          restricciones?: string | null
          telefono?: string | null
        }
        Update: {
          acompanantes?: number
          confirmado_at?: string | null
          created_at?: string
          device_id?: string | null
          email?: string | null
          estado?: Database["public"]["Enums"]["invitacion_status"]
          evento_id?: string
          id?: string
          mensaje_anfitrion?: string | null
          nombre?: string
          qr_token?: string
          restricciones?: string | null
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitaciones_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitaciones_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_public"
            referencedColumns: ["id"]
          },
        ]
      }
      juego_activo: {
        Row: {
          created_at: string
          estado: string
          evento_id: string
          fotos_seleccionadas: Json
          id: string
          juego_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: string
          evento_id: string
          fotos_seleccionadas?: Json
          id?: string
          juego_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: string
          evento_id?: string
          fotos_seleccionadas?: Json
          id?: string
          juego_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "juego_activo_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "juego_activo_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "juego_activo_juego_id_fkey"
            columns: ["juego_id"]
            isOneToOne: false
            referencedRelation: "juegos_evento"
            referencedColumns: ["id"]
          },
        ]
      }
      juegos_evento: {
        Row: {
          cantidad_fotos: number
          created_at: string
          evento_id: string
          id: string
          nombre: string
          orden: number
          regla: string
        }
        Insert: {
          cantidad_fotos?: number
          created_at?: string
          evento_id: string
          id?: string
          nombre?: string
          orden?: number
          regla?: string
        }
        Update: {
          cantidad_fotos?: number
          created_at?: string
          evento_id?: string
          id?: string
          nombre?: string
          orden?: number
          regla?: string
        }
        Relationships: [
          {
            foreignKeyName: "juegos_evento_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "juegos_evento_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_public"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          contenido_id: string
          created_at: string
          id: string
          invitado_device_id: string
        }
        Insert: {
          contenido_id: string
          created_at?: string
          id?: string
          invitado_device_id: string
        }
        Update: {
          contenido_id?: string
          created_at?: string
          id?: string
          invitado_device_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_contenido_id_fkey"
            columns: ["contenido_id"]
            isOneToOne: false
            referencedRelation: "contenido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_contenido_id_fkey"
            columns: ["contenido_id"]
            isOneToOne: false
            referencedRelation: "contenido_public"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_auditoria: {
        Row: {
          accion: string
          created_at: string
          detalles: Json | null
          id: string
          ip_address: string | null
          registro_id: string | null
          tabla_afectada: string | null
          user_id: string | null
        }
        Insert: {
          accion: string
          created_at?: string
          detalles?: Json | null
          id?: string
          ip_address?: string | null
          registro_id?: string | null
          tabla_afectada?: string | null
          user_id?: string | null
        }
        Update: {
          accion?: string
          created_at?: string
          detalles?: Json | null
          id?: string
          ip_address?: string | null
          registro_id?: string | null
          tabla_afectada?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_auditoria_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_auditoria_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          created_at: string
          id: string
          leida: boolean
          mensaje: string
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          leida?: boolean
          mensaje: string
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          leida?: boolean
          mensaje?: string
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["payment_status"]
          evento_id: string | null
          id: string
          metadata: Json | null
          monto: number
          pasarela: Database["public"]["Enums"]["payment_gateway"]
          payment_id_externo: string | null
          suscripcion_id: string | null
          tipo: Database["public"]["Enums"]["payment_type"]
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["payment_status"]
          evento_id?: string | null
          id?: string
          metadata?: Json | null
          monto: number
          pasarela: Database["public"]["Enums"]["payment_gateway"]
          payment_id_externo?: string | null
          suscripcion_id?: string | null
          tipo: Database["public"]["Enums"]["payment_type"]
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["payment_status"]
          evento_id?: string | null
          id?: string
          metadata?: Json | null
          monto?: number
          pasarela?: Database["public"]["Enums"]["payment_gateway"]
          payment_id_externo?: string | null
          suscripcion_id?: string | null
          tipo?: Database["public"]["Enums"]["payment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "pagos_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_public"
            referencedColumns: ["id"]
          },
        ]
      }
      planes: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          id: string
          limite_eventos_mes: number
          nombre: string
          precio_sugerido: number
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          limite_eventos_mes: number
          nombre: string
          precio_sugerido: number
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          limite_eventos_mes?: number
          nombre?: string
          precio_sugerido?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nombre: string
          pais: string | null
          rol: Database["public"]["Enums"]["user_role"]
          telefono: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          nombre: string
          pais?: string | null
          rol?: Database["public"]["Enums"]["user_role"]
          telefono?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nombre?: string
          pais?: string | null
          rol?: Database["public"]["Enums"]["user_role"]
          telefono?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rendiciones: {
        Row: {
          asistente_id: string
          comision_asistente: number
          comprobante_url: string | null
          created_at: string
          estado: Database["public"]["Enums"]["rendition_status"]
          fecha_rendicion: string | null
          fecha_verificacion: string | null
          id: string
          monto_a_rendir: number
          monto_total_vendido: number
          notas: string | null
          periodo_desde: string
          periodo_hasta: string
          total_eventos: number
        }
        Insert: {
          asistente_id: string
          comision_asistente?: number
          comprobante_url?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["rendition_status"]
          fecha_rendicion?: string | null
          fecha_verificacion?: string | null
          id?: string
          monto_a_rendir?: number
          monto_total_vendido?: number
          notas?: string | null
          periodo_desde: string
          periodo_hasta: string
          total_eventos?: number
        }
        Update: {
          asistente_id?: string
          comision_asistente?: number
          comprobante_url?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["rendition_status"]
          fecha_rendicion?: string | null
          fecha_verificacion?: string | null
          id?: string
          monto_a_rendir?: number
          monto_total_vendido?: number
          notas?: string | null
          periodo_desde?: string
          periodo_hasta?: string
          total_eventos?: number
        }
        Relationships: [
          {
            foreignKeyName: "rendiciones_asistente_id_fkey"
            columns: ["asistente_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suscripciones: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["subscription_status"]
          fecha_inicio: string
          fecha_proximo_pago: string
          fecha_vencimiento: string
          id: string
          plan_id: string
          precio_mensual: number
          salon_id: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["subscription_status"]
          fecha_inicio?: string
          fecha_proximo_pago: string
          fecha_vencimiento: string
          id?: string
          plan_id: string
          precio_mensual: number
          salon_id: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["subscription_status"]
          fecha_inicio?: string
          fecha_proximo_pago?: string
          fecha_vencimiento?: string
          id?: string
          plan_id?: string
          precio_mensual?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suscripciones_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_payment_credentials: {
        Row: {
          created_at: string
          credentials_encrypted: string
          id: string
          is_active: boolean
          is_sandbox: boolean
          provider: Database["public"]["Enums"]["payment_gateway"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credentials_encrypted: string
          id?: string
          is_active?: boolean
          is_sandbox?: boolean
          provider: Database["public"]["Enums"]["payment_gateway"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credentials_encrypted?: string
          id?: string
          is_active?: boolean
          is_sandbox?: boolean
          provider?: Database["public"]["Enums"]["payment_gateway"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_payment_credentials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          comision_asistente: number | null
          comision_superadmin: number | null
          created_at: string
          duracion_suscripcion_meses: number | null
          email: string
          estado: Database["public"]["Enums"]["tenant_status"]
          eventos_cortesia_disponibles: number
          eventos_ilimitados: boolean | null
          eventos_vendidos_total: number
          fecha_vencimiento: string | null
          id: string
          limite_eventos_mes: number | null
          nombre: string
          notas_trato: string | null
          pais: string
          plan_id: string | null
          precio_evento_basico: number | null
          precio_evento_premium: number | null
          precio_mensual: number | null
          puede_modificar_precios: boolean | null
          tipo: Database["public"]["Enums"]["tenant_type"]
          ubicacion_lat: number | null
          ubicacion_lng: number | null
          updated_at: string
          usuario_asignado_id: string | null
          whatsapp_contacto: string | null
        }
        Insert: {
          comision_asistente?: number | null
          comision_superadmin?: number | null
          created_at?: string
          duracion_suscripcion_meses?: number | null
          email: string
          estado?: Database["public"]["Enums"]["tenant_status"]
          eventos_cortesia_disponibles?: number
          eventos_ilimitados?: boolean | null
          eventos_vendidos_total?: number
          fecha_vencimiento?: string | null
          id?: string
          limite_eventos_mes?: number | null
          nombre: string
          notas_trato?: string | null
          pais?: string
          plan_id?: string | null
          precio_evento_basico?: number | null
          precio_evento_premium?: number | null
          precio_mensual?: number | null
          puede_modificar_precios?: boolean | null
          tipo: Database["public"]["Enums"]["tenant_type"]
          ubicacion_lat?: number | null
          ubicacion_lng?: number | null
          updated_at?: string
          usuario_asignado_id?: string | null
          whatsapp_contacto?: string | null
        }
        Update: {
          comision_asistente?: number | null
          comision_superadmin?: number | null
          created_at?: string
          duracion_suscripcion_meses?: number | null
          email?: string
          estado?: Database["public"]["Enums"]["tenant_status"]
          eventos_cortesia_disponibles?: number
          eventos_ilimitados?: boolean | null
          eventos_vendidos_total?: number
          fecha_vencimiento?: string | null
          id?: string
          limite_eventos_mes?: number | null
          nombre?: string
          notas_trato?: string | null
          pais?: string
          plan_id?: string | null
          precio_evento_basico?: number | null
          precio_evento_premium?: number | null
          precio_mensual?: number | null
          puede_modificar_precios?: boolean | null
          tipo?: Database["public"]["Enums"]["tenant_type"]
          ubicacion_lat?: number | null
          ubicacion_lng?: number | null
          updated_at?: string
          usuario_asignado_id?: string | null
          whatsapp_contacto?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      contenido_public: {
        Row: {
          aprobado: boolean | null
          created_at: string | null
          estado_ia: Database["public"]["Enums"]["ia_status"] | null
          evento_id: string | null
          id: string | null
          invitado_nombre: string | null
          likes_count: number | null
          mensaje_texto: string | null
          moderado: boolean | null
          tipo: Database["public"]["Enums"]["content_type"] | null
          url_ia: string | null
          url_original: string | null
        }
        Insert: {
          aprobado?: boolean | null
          created_at?: string | null
          estado_ia?: Database["public"]["Enums"]["ia_status"] | null
          evento_id?: string | null
          id?: string | null
          invitado_nombre?: never
          likes_count?: number | null
          mensaje_texto?: string | null
          moderado?: boolean | null
          tipo?: Database["public"]["Enums"]["content_type"] | null
          url_ia?: string | null
          url_original?: string | null
        }
        Update: {
          aprobado?: boolean | null
          created_at?: string | null
          estado_ia?: Database["public"]["Enums"]["ia_status"] | null
          evento_id?: string | null
          id?: string | null
          invitado_nombre?: never
          likes_count?: number | null
          mensaje_texto?: string | null
          moderado?: boolean | null
          tipo?: Database["public"]["Enums"]["content_type"] | null
          url_ia?: string | null
          url_original?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contenido_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contenido_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_public"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_public: {
        Row: {
          color_banner: string | null
          duracion_horas: number | null
          es_premium: boolean | null
          estado: Database["public"]["Enums"]["event_status"] | null
          estilo_ia: Database["public"]["Enums"]["ia_style"] | null
          fecha_evento: string | null
          hora_inicio: string | null
          id: string | null
          limite_subidas_por_invitado: number | null
          logo_url: string | null
          moderacion_activa: boolean | null
          nombre: string | null
          tema_ia: string | null
          tipo: Database["public"]["Enums"]["event_type"] | null
          total_fotos: number | null
          total_likes: number | null
          total_mensajes: number | null
          total_videos: number | null
        }
        Insert: {
          color_banner?: string | null
          duracion_horas?: number | null
          es_premium?: boolean | null
          estado?: Database["public"]["Enums"]["event_status"] | null
          estilo_ia?: Database["public"]["Enums"]["ia_style"] | null
          fecha_evento?: string | null
          hora_inicio?: string | null
          id?: string | null
          limite_subidas_por_invitado?: number | null
          logo_url?: string | null
          moderacion_activa?: boolean | null
          nombre?: string | null
          tema_ia?: string | null
          tipo?: Database["public"]["Enums"]["event_type"] | null
          total_fotos?: number | null
          total_likes?: number | null
          total_mensajes?: number | null
          total_videos?: number | null
        }
        Update: {
          color_banner?: string | null
          duracion_horas?: number | null
          es_premium?: boolean | null
          estado?: Database["public"]["Enums"]["event_status"] | null
          estilo_ia?: Database["public"]["Enums"]["ia_style"] | null
          fecha_evento?: string | null
          hora_inicio?: string | null
          id?: string | null
          limite_subidas_por_invitado?: number | null
          logo_url?: string | null
          moderacion_activa?: boolean | null
          nombre?: string | null
          tema_ia?: string | null
          tipo?: Database["public"]["Enums"]["event_type"] | null
          total_fotos?: number | null
          total_likes?: number | null
          total_mensajes?: number | null
          total_videos?: number | null
        }
        Relationships: []
      }
      pagos_summary: {
        Row: {
          created_at: string | null
          estado: Database["public"]["Enums"]["payment_status"] | null
          evento_id: string | null
          id: string | null
          pasarela: Database["public"]["Enums"]["payment_gateway"] | null
          tipo: Database["public"]["Enums"]["payment_type"] | null
        }
        Insert: {
          created_at?: string | null
          estado?: Database["public"]["Enums"]["payment_status"] | null
          evento_id?: string | null
          id?: string | null
          pasarela?: Database["public"]["Enums"]["payment_gateway"] | null
          tipo?: Database["public"]["Enums"]["payment_type"] | null
        }
        Update: {
          created_at?: string | null
          estado?: Database["public"]["Enums"]["payment_status"] | null
          evento_id?: string | null
          id?: string | null
          pasarela?: Database["public"]["Enums"]["payment_gateway"] | null
          tipo?: Database["public"]["Enums"]["payment_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string | null
          nombre: string | null
          pais: string | null
          rol: Database["public"]["Enums"]["user_role"] | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          nombre?: string | null
          pais?: string | null
          rol?: Database["public"]["Enums"]["user_role"] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          nombre?: string | null
          pais?: string | null
          rol?: Database["public"]["Enums"]["user_role"] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_read_public_event: { Args: { _evento_id: string }; Returns: boolean }
      crear_rsvp: {
        Args: {
          _acompanantes: number
          _device_id: string
          _email: string
          _mensaje: string
          _nombre: string
          _restricciones: string
          _telefono: string
          _token: string
        }
        Returns: {
          estado: string
          motivo: string
          qr_token: string
        }[]
      }
      event_accepts_uploads: { Args: { _evento_id: string }; Returns: boolean }
      evento_has_valid_token: {
        Args: { _evento_id: string; _token: string }
        Returns: boolean
      }
      get_contenido_by_evento_token: {
        Args: { _evento_id: string; _token: string }
        Returns: {
          created_at: string
          estado_ia: string
          evento_id: string
          id: string
          invitado_nombre: string
          likes_count: number
          mensaje_texto: string
          tipo: string
          url_ia: string
          url_original: string
        }[]
      }
      get_evento_by_token: {
        Args: { _token: string }
        Returns: {
          color_banner: string
          duracion_horas: number
          es_premium: boolean
          estado: string
          estilo_ia: string
          fecha_evento: string
          hora_inicio: string
          id: string
          logo_url: string
          moderacion_activa: boolean
          nombre: string
          qr_invitados_token: string
          tema_ia: string
          tipo: string
          total_fotos: number
          total_likes: number
          total_mensajes: number
          total_videos: number
        }[]
      }
      get_global_config: { Args: { config_key: string }; Returns: Json }
      get_invitacion_evento_by_token: {
        Args: { _token: string }
        Returns: {
          acompanantes_max: number
          color_banner: string
          cupo_maximo: number
          cupo_restante: number
          evento_id: string
          fecha_evento: string
          fecha_limite_rsvp: string
          hora_inicio: string
          logo_url: string
          mensaje: string
          nombre: string
          tarjeta_formato: string
          tarjeta_url: string
          tipo: string
        }[]
      }
      get_invitacion_personal: {
        Args: { _qr_token: string }
        Returns: {
          acompanantes: number
          color_banner: string
          estado: string
          evento_id: string
          evento_nombre: string
          fecha_evento: string
          hora_inicio: string
          invitacion_id: string
          logo_url: string
          nombre: string
          ya_ingreso: boolean
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      validar_checkin: {
        Args: {
          _checkin_token: string
          _invitacion_qr_token: string
          _operador_id: string
        }
        Returns: {
          acompanantes: number
          estado: string
          nombre: string
        }[]
      }
    }
    Enums: {
      app_role: "super_admin" | "asistente" | "salon" | "cliente"
      content_type: "foto" | "video" | "mensaje"
      event_status:
        | "programado"
        | "activo"
        | "pausado"
        | "finalizado"
        | "cancelado"
      event_type:
        | "cumpleanos"
        | "casamiento"
        | "graduacion"
        | "corporativo"
        | "fiesta_tematica"
        | "otro"
      ia_status: "pendiente" | "procesando" | "completado" | "error"
      ia_style:
        | "caricatura"
        | "comico"
        | "cinematografico"
        | "futurista"
        | "realista"
        | "fantasia"
        | "anime"
        | "vintage"
        | "acuarela"
        | "neon"
        | "minimalista"
      invitacion_status: "pendiente" | "confirmado" | "rechazado"
      payment_gateway:
        | "mercadopago_ar"
        | "mercadopago_br"
        | "mercadopago_py"
        | "bancard"
        | "stripe"
      payment_status: "pendiente" | "aprobado" | "rechazado" | "reembolsado"
      payment_type: "evento_unico" | "suscripcion_mensual"
      rendition_status: "pendiente" | "rendido" | "verificado"
      subscription_status: "activo" | "vencido" | "suspendido"
      tenant_status: "activo" | "suspendido" | "moroso"
      tenant_type: "asistente" | "salon"
      user_role: "super_admin" | "asistente" | "salon" | "cliente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "asistente", "salon", "cliente"],
      content_type: ["foto", "video", "mensaje"],
      event_status: [
        "programado",
        "activo",
        "pausado",
        "finalizado",
        "cancelado",
      ],
      event_type: [
        "cumpleanos",
        "casamiento",
        "graduacion",
        "corporativo",
        "fiesta_tematica",
        "otro",
      ],
      ia_status: ["pendiente", "procesando", "completado", "error"],
      ia_style: [
        "caricatura",
        "comico",
        "cinematografico",
        "futurista",
        "realista",
        "fantasia",
        "anime",
        "vintage",
        "acuarela",
        "neon",
        "minimalista",
      ],
      invitacion_status: ["pendiente", "confirmado", "rechazado"],
      payment_gateway: [
        "mercadopago_ar",
        "mercadopago_br",
        "mercadopago_py",
        "bancard",
        "stripe",
      ],
      payment_status: ["pendiente", "aprobado", "rechazado", "reembolsado"],
      payment_type: ["evento_unico", "suscripcion_mensual"],
      rendition_status: ["pendiente", "rendido", "verificado"],
      subscription_status: ["activo", "vencido", "suspendido"],
      tenant_status: ["activo", "suspendido", "moroso"],
      tenant_type: ["asistente", "salon"],
      user_role: ["super_admin", "asistente", "salon", "cliente"],
    },
  },
} as const
