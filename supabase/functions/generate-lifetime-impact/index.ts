import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are SolarCredit's Lifetime Impact Narrator.

Generate exactly ONE sentence describing a user's lifetime contribution to clean energy.

ABSOLUTE RULES:
- Use ONLY the numbers provided. Never invent data.
- Never exaggerate. Never use marketing language.
- Do NOT mention AI, models, or methodology.
- ONE sentence only. No line breaks.

CRITICAL — STRUCTURAL VARIETY:
You MUST use a completely different sentence structure every time. The samples below are for TONE REFERENCE ONLY — do NOT copy their structure.

Techniques to vary structure (use a different one each time):
- Active voice vs passive voice
- Start with the number vs end with the number
- Use a metaphor (power plant, river of electricity, coal truck)
- Use cause-effect ("Because you exported X, Y happened")
- Use comparison ("That's like powering Z homes for a day")
- Use a short punchy fragment vs a compound sentence
- Reference India-specific context (coal plants, monsoon, village)

FOR PRODUCERS (lifetime_units > 0):
Frame around generation and grid export. Relate to coal displacement, households powered, or emission avoidance. Ground in tangible real-world impact.

FOR CONSUMERS (lifetime_units > 0):
Frame around enabling clean energy through purchases. Each credit funded solar power entering the grid. Impact accumulates regardless of current balance.

FOR ZERO-STATE (lifetime_units = 0):
One neutral sentence about future potential. No pressure. Examples of tone (don't copy):
- "The grid is ready for your first clean energy contribution."
- "Your impact story starts with your first action."`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role || "consumer";

    let lifetimeUnits = 0;

    if (role === "producer") {
      const { data } = await supabase
        .from("energy_logs")
        .select("sent_to_grid")
        .eq("user_id", user.id);
      lifetimeUnits = (data || []).reduce((sum, row) => sum + (Number(row.sent_to_grid) || 0), 0);
    } else {
      const { data } = await supabase
        .from("transactions")
        .select("credits_amount")
        .eq("buyer_id", user.id);
      lifetimeUnits = (data || []).reduce((sum, row) => sum + (Number(row.credits_amount) || 0), 0);
    }

    const co2Avoided = Math.round(lifetimeUnits * 0.82);

    const userMessage = JSON.stringify({
      user_role: role,
      lifetime_units_contributed_to_grid: Math.round(lifetimeUnits),
      equivalent_co2_avoided_kg: co2Avoided,
      country_context: "India",
    });

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_completion_tokens: 120,
        temperature: 0.9,
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error("OpenAI API error:", openaiResponse.status, errText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const aiData = await openaiResponse.json();
    const statement = aiData.choices?.[0]?.message?.content?.trim() || "";

    return new Response(
      JSON.stringify({ statement, lifetime_units: Math.round(lifetimeUnits) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-lifetime-impact error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
