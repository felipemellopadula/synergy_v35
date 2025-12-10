import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, lastResponse } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from recent messages (last 4 messages max)
    const recentMessages = messages.slice(-4).map((m: any) => 
      `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content.substring(0, 500)}`
    ).join('\n');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um assistente que gera sugestões de perguntas de follow-up.
Baseado na conversa, gere EXATAMENTE 3 perguntas curtas e relevantes que o usuário poderia fazer para continuar a conversa.
As perguntas devem:
- Ser curtas (máximo 10 palavras cada)
- Ser relevantes ao contexto da última resposta
- Ajudar o usuário a aprofundar o tema ou explorar aspectos relacionados
- Ser variadas (uma para aprofundar, uma para exemplo prático, uma para explorar relacionados)

Responda APENAS com um JSON no formato: {"suggestions": ["pergunta 1", "pergunta 2", "pergunta 3"]}`
          },
          {
            role: "user",
            content: `Contexto da conversa:\n${recentMessages}\n\nÚltima resposta do assistente:\n${lastResponse.substring(0, 1000)}\n\nGere 3 sugestões de follow-up:`
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    let suggestions: string[] = [];
    try {
      const jsonMatch = content.match(/\{[\s\S]*"suggestions"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        suggestions = parsed.suggestions || [];
      }
    } catch (parseError) {
      console.error("Failed to parse suggestions:", parseError);
      // Fallback: try to extract suggestions from plain text
      const lines = content.split('\n').filter((l: string) => l.trim().length > 0);
      suggestions = lines.slice(0, 3).map((l: string) => l.replace(/^[\d\.\-\*]+\s*/, '').trim());
    }

    // Ensure we have exactly 3 suggestions
    suggestions = suggestions.slice(0, 3);

    console.log("Generated follow-up suggestions:", suggestions);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating follow-ups:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      suggestions: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
