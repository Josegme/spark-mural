import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenantId } = await req.json();

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: "tenantId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get current count
    const { data: tenant, error: selectError } = await supabase
      .from("tenants")
      .select("eventos_cortesia_disponibles")
      .eq("id", tenantId)
      .single();

    if (selectError || !tenant) {
      console.error("Error selecting tenant:", selectError);
      return new Response(
        JSON.stringify({ error: "Tenant not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (tenant.eventos_cortesia_disponibles <= 0) {
      return new Response(
        JSON.stringify({ ok: false, message: "No courtesy events available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Decrement
    const newCount = tenant.eventos_cortesia_disponibles - 1;
    const { error: updateError } = await supabase
      .from("tenants")
      .update({ eventos_cortesia_disponibles: newCount })
      .eq("id", tenantId);

    if (updateError) {
      console.error("Error updating tenant:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to decrement courtesy count" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Courtesy counter decremented for tenant ${tenantId}: ${tenant.eventos_cortesia_disponibles} -> ${newCount}`);

    return new Response(
      JSON.stringify({ ok: true, nuevoCuenta: newCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
