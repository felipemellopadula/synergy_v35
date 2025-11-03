import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { section } = await req.json();
    const openAIKey = Deno.env.get('OPENAI_API_KEY');

    console.log(`[RAG Compress] Comprimindo seção de ${section.length} caracteres`);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Você é um especialista em COMPRESSÃO INTELIGENTE de conteúdo.

SEÇÃO PARA COMPRIMIR:
${section}

TAREFA: Reduza esta seção para 40% do tamanho original (~${Math.floor(section.length * 0.4)} caracteres), mantendo:
1. ✅ Todos os tópicos principais
2. ✅ Dados numéricos críticos
3. ✅ Conclusões e insights chave
4. ❌ Remova repetições e detalhes secundários

Use Markdown. Seja conciso mas completo.`
        }],
        max_tokens: Math.min(8000, Math.floor(section.length * 0.4 / 3))
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[RAG Compress] OpenAI error:', response.status, error);
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    const compressed = data.choices[0].message.content;

    console.log(`[RAG Compress] ✅ Comprimido: ${section.length} → ${compressed.length} chars`);

    return new Response(
      JSON.stringify({ compressed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[RAG Compress] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
