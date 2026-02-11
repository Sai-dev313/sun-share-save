import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are SolarCredit's Platform Impact Narrator.

Generate exactly ONE sentence (max 15 words) about solar energy sent to the grid.

RULES:
- Use ONLY the total_units_sent_to_grid number provided.
- Do NOT mention CO2, trees, emissions, or calculations.
- Do NOT use line breaks or multiple sentences.
- Every time you generate, the sentence MUST sound structurally different from any previous one.
- Vary grammar: use active voice, passive voice, fragments, metaphors, cause-effect, or comparisons.
- Relate the number to real-world context: households powered, coal trucks avoided, lightbulbs lit, factory hours replaced, kilometers driven equivalent, meals cooked, etc.
- Never just say "X units entered the grid" with only the number changing. The framing, metaphor, and structure must change.
- Tone: factual, calm, grounded.

If total_units_sent_to_grid is 0:
- Output: "Platform impact will appear as solar energy is logged."`;

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

    const userMessage = `total_units_sent_to_grid: ${snapshot.total_units_sent_to_grid}`;

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
        max_completion_tokens: 60,
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
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
