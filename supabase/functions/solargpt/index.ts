import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are SolarGPT, an in-app intelligence layer for SolarCredit.

You do NOT behave like a chatbot.
You do NOT hold open-ended conversations.
You ONLY answer the specific question selected by the user.

Your role is to explain a user's real SolarCredit data in simple, grounded terms.

RULES (NON-NEGOTIABLE):
- Use ONLY the data provided to you.
- Never speculate, predict, or invent values.
- Never exaggerate environmental or financial impact.
- If required data is missing, clearly say so.
- Do NOT mention AI, LLMs, models, or internal processes.
- Tone must be clear, explanatory, neutral, and trustworthy.

IMPORTANT DISTINCTION:
- Producers contribute by generating and exporting solar energy to the grid.
- Consumers contribute by enabling clean energy through credit purchases.
- Both affect the same grid, but through different actions.
- Your explanations MUST reflect this difference.

Answer ONLY the selected question.
Do not add extra suggestions unless explicitly asked.
Keep each answer between 4–6 sentences.`;

const CARD_PROMPTS: Record<number, string> = {
  1: `Question: "How did I earn these credits?"
For producers: Explain energy → grid → credits. Reference logged energy, explain conversion rule (1 kWh exported = 1 credit), connect to grid export.
For consumers: Explain purchase → demand → credits. Each credit represents one unit of clean electricity that entered the grid.`,

  2: `Question: "What's my lifetime impact?"
Use lifetime_units_contributed_to_grid and cause → effect language. Tie to the grid, not abstract climate claims.
For producers: Emphasize units sent to grid replacing fossil fuel electricity.
For consumers: Emphasize enabling solar units to enter the grid through credit purchases. Impact accumulates even if current balance is zero.`,

  3: `Question: "What happens if I sell vs use credits?"
Explain balance change. Explain impact does NOT reset. Separate financial action from lifetime impact.
If you sell credits, your credit balance decreases and you receive money, but your lifetime contribution remains unchanged. If you use credits to pay bills, you apply their value directly to electricity costs. In both cases, the clean energy contribution has already occurred.`,

  4: `Question: "How can I increase my contribution?"
For producers: Focus on generation behavior - log more solar generation and export surplus to the grid. Contribution grows cumulatively over time. No upsell tone.
For consumers: Focus on participation - buy or use more clean credits. Each credit supports one unit of solar energy entering the grid. No pressure tone.`,

  5: `Question: "Where did my solar energy go?"
For producers: The solar energy exported enters the local electricity grid and is consumed nearby. Once injected, it mixes with other power sources and helps reduce reliance on fossil fuel generation.
For consumers: The credits purchased represent solar energy sent to the grid by producers. While you don't receive that exact electricity, your participation helps ensure solar replaces fossil power in the system.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const { question_id } = await req.json();
    if (!question_id || !CARD_PROMPTS[question_id]) {
      return new Response(
        JSON.stringify({ error: "Invalid question_id (1-5)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    // Fetch user context
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, credits")
      .eq("id", user.id)
      .single();

    const role = profile?.role || "consumer";
    const creditBalance = Number(profile?.credits) || 0;

    let lifetimeUnits = 0;
    let totalMoneyEarned = 0;

    if (role === "producer") {
      const { data: energyData } = await supabase
        .from("energy_logs")
        .select("sent_to_grid")
        .eq("user_id", user.id);
      lifetimeUnits = (energyData || []).reduce((sum, r) => sum + (Number(r.sent_to_grid) || 0), 0);

      // Money earned from marketplace sales
      const { data: salesData } = await supabase
        .from("transactions")
        .select("total_price")
        .eq("seller_id", user.id);
      totalMoneyEarned = (salesData || []).reduce((sum, r) => sum + (Number(r.total_price) || 0), 0);
    } else {
      const { data: purchaseData } = await supabase
        .from("transactions")
        .select("credits_amount, total_price")
        .eq("buyer_id", user.id);
      lifetimeUnits = (purchaseData || []).reduce((sum, r) => sum + (Number(r.credits_amount) || 0), 0);
      totalMoneyEarned = (purchaseData || []).reduce((sum, r) => sum + (Number(r.total_price) || 0), 0);
    }

    const userMessage = JSON.stringify({
      user_role: role,
      credit_balance: Math.round(creditBalance),
      lifetime_credits: Math.round(lifetimeUnits),
      lifetime_units_contributed_to_grid: Math.round(lifetimeUnits),
      total_money_saved_or_earned: Math.round(totalMoneyEarned),
    });

    const cardInstruction = CARD_PROMPTS[question_id];

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
          { role: "user", content: `${cardInstruction}\n\nUser data:\n${userMessage}` },
        ],
        max_tokens: 250,
        temperature: 0.4,
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error("OpenAI API error:", openaiResponse.status, errText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const aiData = await openaiResponse.json();
    const answer = aiData.choices?.[0]?.message?.content?.trim() || "";

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("solargpt error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
