import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DeleteEventRequest = {
  eventId?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ ok: false, error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userRes, error: userError } = await supabase.auth.getUser(token);
    const user = userRes?.user;
    if (userError || !user) {
      return new Response(
        JSON.stringify({ ok: false, error: "Usuario no autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body: DeleteEventRequest = await req.json().catch(() => ({}));
    const eventId = body.eventId;
    if (!eventId) {
      return new Response(
        JSON.stringify({ ok: false, error: "Falta eventId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Obtener evento
    const { data: evento, error: eventoError } = await supabase
      .from("eventos")
      .select("id, cliente_user_id, estado")
      .eq("id", eventId)
      .maybeSingle();

    if (eventoError) {
      console.error("Error fetching event:", eventoError);
      return new Response(
        JSON.stringify({ ok: false, error: "Error al buscar el evento" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!evento) {
      return new Response(
        JSON.stringify({ ok: false, error: "Evento no encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validar rol super_admin (tabla user_roles) o dueño del evento
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .limit(1)
      .maybeSingle();

    const isSuperAdmin = !!roleRow;
    const isOwner = evento.cliente_user_id === user.id;

    if (!isOwner && !isSuperAdmin) {
      return new Response(
        JSON.stringify({ ok: false, error: "No tenés permisos para eliminar este evento" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Regla de negocio: no permitir eliminar eventos activos (tu observación es correcta)
    if (evento.estado === "activo") {
      return new Response(
        JSON.stringify({ ok: false, error: "No se puede eliminar un evento activo" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Borrado en cascada manual
    const { error: contenidoError } = await supabase
      .from("contenido")
      .delete()
      .eq("evento_id", eventId);

    if (contenidoError) {
      console.error("Error deleting contenido:", contenidoError);
      return new Response(
        JSON.stringify({ ok: false, error: "No se pudo eliminar el contenido del evento" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: pagosError } = await supabase
      .from("pagos")
      .delete()
      .eq("evento_id", eventId);

    if (pagosError) {
      console.error("Error deleting pagos:", pagosError);
      return new Response(
        JSON.stringify({ ok: false, error: "No se pudieron eliminar los pagos del evento" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: deleteError } = await supabase
      .from("eventos")
      .delete()
      .eq("id", eventId);

    if (deleteError) {
      console.error("Error deleting event:", deleteError);
      return new Response(
        JSON.stringify({ ok: false, error: "No se pudo eliminar el evento" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("delete-event error:", error);
    const msg = error instanceof Error ? error.message : "Error inesperado";
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
