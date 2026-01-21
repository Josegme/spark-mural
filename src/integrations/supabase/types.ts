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
          limite_subidas_por_invitado: number | null
          logo_url: string | null
          moderacion_activa: boolean
          nombre: string
          pasarela_pago: Database["public"]["Enums"]["payment_gateway"] | null
          payment_id: string | null
          precio_pagado: number
          qr_descarga_token: string
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
          limite_subidas_por_invitado?: number | null
          logo_url?: string | null
          moderacion_activa?: boolean
          nombre: string
          pasarela_pago?: Database["public"]["Enums"]["payment_gateway"] | null
          payment_id?: string | null
          precio_pagado?: number
          qr_descarga_token: string
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
          limite_subidas_por_invitado?: number | null
          logo_url?: string | null
          moderacion_activa?: boolean
          nombre?: string
          pasarela_pago?: Database["public"]["Enums"]["payment_gateway"] | null
          payment_id?: string | null
          precio_pagado?: number
          qr_descarga_token?: string
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
            foreignKeyName: "eventos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      tenants: {
        Row: {
          comision_asistente: number | null
          comision_superadmin: number | null
          created_at: string
          email: string
          estado: Database["public"]["Enums"]["tenant_status"]
          fecha_vencimiento: string | null
          id: string
          limite_eventos_mes: number | null
          nombre: string
          pais: string
          plan_id: string | null
          precio_mensual: number | null
          tipo: Database["public"]["Enums"]["tenant_type"]
          ubicacion_lat: number | null
          ubicacion_lng: number | null
          updated_at: string
        }
        Insert: {
          comision_asistente?: number | null
          comision_superadmin?: number | null
          created_at?: string
          email: string
          estado?: Database["public"]["Enums"]["tenant_status"]
          fecha_vencimiento?: string | null
          id?: string
          limite_eventos_mes?: number | null
          nombre: string
          pais?: string
          plan_id?: string | null
          precio_mensual?: number | null
          tipo: Database["public"]["Enums"]["tenant_type"]
          ubicacion_lat?: number | null
          ubicacion_lng?: number | null
          updated_at?: string
        }
        Update: {
          comision_asistente?: number | null
          comision_superadmin?: number | null
          created_at?: string
          email?: string
          estado?: Database["public"]["Enums"]["tenant_status"]
          fecha_vencimiento?: string | null
          id?: string
          limite_eventos_mes?: number | null
          nombre?: string
          pais?: string
          plan_id?: string | null
          precio_mensual?: number | null
          tipo?: Database["public"]["Enums"]["tenant_type"]
          ubicacion_lat?: number | null
          ubicacion_lng?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      content_type: "foto" | "video" | "mensaje"
      event_status: "programado" | "activo" | "finalizado" | "cancelado"
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
      content_type: ["foto", "video", "mensaje"],
      event_status: ["programado", "activo", "finalizado", "cancelado"],
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
      ],
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
