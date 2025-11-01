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
    const { analyses, sectionIndex, totalSections } = await req.json();
    const openAIKey = Deno.env.get('OPENAI_API_KEY');

    console.log(`[RAG Section ${sectionIndex + 1}/${totalSections}] Sintetizando ${analyses.length} análises`);

    const prompt = `Você é um sintetizador especializado em INTEGRAÇÃO DE INFORMAÇÕES.

SEÇÃO [${sectionIndex + 1} de ${totalSections}]

ANÁLISES DOS CHUNKS:
${analyses.join('\n\n---\n\n')}

🎯 MISSÃO: Crie uma síntese integrada que:
1. Una todas as análises em narrativa coerente
2. Preserve TODOS os detalhes importantes
3. Elimine apenas redundâncias exatas
4. Mantenha dados, exemplos e conceitos
5. Preserve terminologia técnica

⚠️ PRESERVE 80% do conteúdo das análises
Use Markdown extensivamente`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 16000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[RAG Section ${sectionIndex + 1}] OpenAI error:`, response.status, error);
      throw new Error(`OpenAI error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const synthesis = data.choices[0].message.content;

    console.log(`[RAG Section ${sectionIndex + 1}/${totalSections}] ✅ Síntese concluída`);

    return new Response(
      JSON.stringify({ synthesis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[RAG Section] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
