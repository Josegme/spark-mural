/**
 * Edge function para operaciones admin sobre usuarios.
 * Solo accesible para usuarios con rol super_admin.
 *
 * Acciones soportadas:
 *  - update_profile: edita nombre/email/telefono/pais
 *  - change_role: cambia rol en profiles + user_roles
 *  - suspend_user: marca tenant asociado como suspendido (soft delete)
 *  - reactivate_user: reactiva el tenant asociado
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VALID_ROLES = ["super_admin", "asistente", "salon", "cliente"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

interface RequestBody {
  action:
    | "update_profile"
    | "change_role"
    | "suspend_user"
    | "reactivate_user";
  target_user_id: string;
  payload?: {
    nombre?: string;
    email?: string;
    telefono?: string;
    pais?: string;
    new_role?: ValidRole;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // 1) Validar JWT del invocante
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2) Verificar super_admin
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin, error: roleErr } = await adminClient.rpc("is_super_admin", {
      _user_id: user.id,
    });

    if (roleErr || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Solo super_admin puede ejecutar esta acción" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3) Parsear y validar body
    const body: RequestBody = await req.json();
    if (!body.action || !body.target_user_id) {
      return new Response(
        JSON.stringify({ error: "action y target_user_id requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let result: Record<string, unknown> = {};

    switch (body.action) {
      case "update_profile": {
        const updates: Record<string, unknown> = {};
        if (body.payload?.nombre !== undefined) updates.nombre = body.payload.nombre;
        if (body.payload?.email !== undefined) updates.email = body.payload.email;
        if (body.payload?.telefono !== undefined) updates.telefono = body.payload.telefono;
        if (body.payload?.pais !== undefined) updates.pais = body.payload.pais;
        updates.updated_at = new Date().toISOString();

        const { error } = await adminClient
          .from("profiles")
          .update(updates)
          .eq("id", body.target_user_id);
        if (error) throw error;
        result = { updated: updates };
        break;
      }

      case "change_role": {
        const newRole = body.payload?.new_role;
        if (!newRole || !VALID_ROLES.includes(newRole)) {
          return new Response(
            JSON.stringify({ error: "new_role inválido" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        // Update profiles.rol
        const { error: profileErr } = await adminClient
          .from("profiles")
          .update({ rol: newRole, updated_at: new Date().toISOString() })
          .eq("id", body.target_user_id);
        if (profileErr) throw profileErr;

        // Reset user_roles: borrar todos y crear el nuevo
        await adminClient.from("user_roles").delete().eq("user_id", body.target_user_id);

        // Mapear rol app -> app_role enum (super_admin / moderator / user)
        // Solo super_admin se mapea directamente, el resto van como "user"
        const appRole = newRole === "super_admin" ? "super_admin" : "user";
        const { error: roleInsertErr } = await adminClient
          .from("user_roles")
          .insert({ user_id: body.target_user_id, role: appRole });
        if (roleInsertErr) throw roleInsertErr;

        result = { new_role: newRole, app_role: appRole };
        break;
      }

      case "suspend_user": {
        // Buscar tenant asociado
        const { data: profile } = await adminClient
          .from("profiles")
          .select("tenant_id")
          .eq("id", body.target_user_id)
          .single();

        if (profile?.tenant_id) {
          const { error } = await adminClient
            .from("tenants")
            .update({ estado: "suspendido", updated_at: new Date().toISOString() })
            .eq("id", profile.tenant_id);
          if (error) throw error;
          result = { tenant_suspended: profile.tenant_id };
        } else {
          result = { warning: "Usuario sin tenant asociado, no se puede suspender vía tenant" };
        }
        break;
      }

      case "reactivate_user": {
        const { data: profile } = await adminClient
          .from("profiles")
          .select("tenant_id")
          .eq("id", body.target_user_id)
          .single();

        if (profile?.tenant_id) {
          const { error } = await adminClient
            .from("tenants")
            .update({ estado: "activo", updated_at: new Date().toISOString() })
            .eq("id", profile.tenant_id);
          if (error) throw error;
          result = { tenant_reactivated: profile.tenant_id };
        }
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Acción desconocida" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }

    // 4) Audit log
    await adminClient.from("logs_auditoria").insert({
      user_id: user.id,
      accion: `admin_${body.action}`,
      tabla_afectada: body.action === "change_role" ? "user_roles" : "profiles",
      registro_id: body.target_user_id,
      detalles: JSON.parse(JSON.stringify({ action: body.action, payload: body.payload, result })),
    });

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("admin-user-management error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
