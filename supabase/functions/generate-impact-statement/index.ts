import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are SolarCredit's Platform Impact Narrator.

Your task is to generate a short, authoritative, human-readable impact statement for the login screen, based on real, aggregated grid-export data from SolarCredit producers.

This is NOT a chatbot.
This is NOT a marketing message.

Rules:
- Use ONLY the numeric values provided to you.
- Never invent, estimate, or calculate numbers.
- Never exaggerate environmental impact.
- Do NOT mention AI, models, or calculations.
- Do NOT explain methodology.
- Tone must be factual, confident, and calm.

Inputs you will receive:
- total_units_sent_to_grid (number, kWh)
- total_co2_avoided_kg (number)
- equivalent_trees (number)
- last_updated_at (timestamp)

Output requirements:
- Maximum 2 lines of text
- Highlight ONE primary metric (units sent to grid)
- Secondary metrics must support the primary metric
- Suitable for repeated viewing on every login
- Feels "live", not promotional

Preferred structure:
Line 1: Primary impact statement
Line 2: Supporting equivalence or clarification

Example outputs:
"124,380 clean units sent to the grid.
102 tons of CO₂ avoided — equal to 4,600 trees planted."

If total_units_sent_to_grid is 0:
- Output a neutral sentence indicating platform impact will appear as solar energy is logged.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: snapshot, error: dbError } = await supabase
      .from("platform_impact_snapshot")
      .select("*")
      .limit(1)
      .single();

    if (dbError || !snapshot) {
      throw new Error("Failed to read impact snapshot: " + (dbError?.message || "no data"));
    }

    const userMessage = JSON.stringify({
      total_units_sent_to_grid: snapshot.total_units_sent_to_grid,
      total_co2_avoided_kg: snapshot.total_co2_avoided_kg,
      equivalent_trees: snapshot.equivalent_trees,
      last_updated_at: snapshot.last_updated_at,
    });

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: 120,
        temperature: 0.4,
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
      JSON.stringify({
        statement,
        last_updated_at: snapshot.last_updated_at,
        total_units_sent_to_grid: snapshot.total_units_sent_to_grid,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-impact-statement error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
