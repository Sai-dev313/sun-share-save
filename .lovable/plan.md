

# Fix "Earned by Credits" Value, Credit Decimal Precision, and Rewrite All 3 AI Prompts

## Issues to Fix

### 1. "Earned by Credits" shows ₹5,012 instead of actual earnings (₹12)
The `cash` column in the database defaults to 5000 for all new users. The "Earned by Credits" card on the Producer Dashboard displays `profile.cash` directly (e.g., ₹5,012), but it should only show the amount earned from marketplace credit sales.

**Fix**: Calculate actual earnings by summing `total_price` from the `transactions` table where the user is the `seller_id`, instead of using the raw `cash` balance.

**File**: `src/pages/ProducerDashboard.tsx`
- Add a new state `earnings` that fetches the sum of `total_price` from `transactions` where `seller_id = user.id`
- Display `earnings` in the "Earned by Credits" card instead of `profile.cash`

### 2. Credit savings floating point bug
`4.6 credits x ₹3 = ₹13.799999999999999` -- needs rounding.

**File**: `src/components/BillPayment.tsx`
- Round `creditSavings` display to 1 decimal place: `Math.round(creditSavings * 10) / 10`
- Apply same rounding in all places where credit savings are displayed

**File**: `src/pages/ConsumerDashboard.tsx`
- Round the potential savings calculation: `Math.round(Math.round(profile.credits) * 3)` to avoid float issues

### 3. Login Impact Banner -- Single short sentence, not multi-line
Currently generates 3-5 lines. Change to ONE short sentence (max 15 words) focusing only on total units sent to grid, with varied real-world context each time.

**File**: `supabase/functions/generate-impact-statement/index.ts`
- Rewrite SYSTEM_PROMPT to generate exactly ONE sentence
- Only use `total_units_sent_to_grid` -- remove CO2 and tree references from prompt
- Instruct model to vary sentence structure, metaphor, and framing each time (not just swap numbers)
- Reduce `max_completion_tokens` from 200 to 60
- Simplify user message payload to only include `total_units_sent_to_grid`

### 4. Dashboard Lifetime Impact -- Genuine variety, not template sentences
Current prompt lists 5 templates per role but the model just picks one and swaps numbers.

**File**: `supabase/functions/generate-lifetime-impact/index.ts`
- Rewrite SYSTEM_PROMPT to explicitly forbid reusing sentence structures
- Instruct model to use different grammatical forms (active/passive, short/compound, metaphorical/direct)
- Samples are reference tone only, not templates to copy
- Raise temperature to 0.7 for structural variety

### 5. SolarGPT -- Real-world contextual answers, not templated
Same issue: answers follow a rigid structure with only numbers changing.

**File**: `supabase/functions/solargpt/index.ts`
- Rewrite SYSTEM_PROMPT to require real-world analogies and tangible examples
- Instruct model to vary explanation style (analogy-based, cause-effect, comparison, narrative)
- Add instruction to relate numbers to household equivalents, coal displacement, etc.

---

## Technical Details

| File | Change |
|------|--------|
| `src/pages/ProducerDashboard.tsx` | Fetch actual marketplace earnings from `transactions` table (sum of `total_price` where `seller_id = user.id`); display that instead of `profile.cash` |
| `src/components/BillPayment.tsx` | Round `creditSavings` to 1 decimal in all display locations |
| `src/pages/ConsumerDashboard.tsx` | Round potential savings calculation |
| `supabase/functions/generate-impact-statement/index.ts` | ONE short sentence, only grid units, varied structure, `max_completion_tokens: 60` |
| `supabase/functions/generate-lifetime-impact/index.ts` | Forbid template reuse, require structural variety in sentence framing |
| `supabase/functions/solargpt/index.ts` | Require real-world analogies, varied explanation styles, tangible comparisons |

No database changes required.

