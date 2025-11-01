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
    const { sections, userMessage, fileName, totalPages } = await req.json();
    const openAIKey = Deno.env.get('OPENAI_API_KEY');

    console.log(`[RAG Consolidate] Documento: "${fileName}" (${totalPages} páginas, ${sections.length} seções)`);

    const targetPages = Math.floor(totalPages * 0.7);
    
    const prompt = `Você é um especialista em ANÁLISE DOCUMENTAL PROFUNDA.

📖 DOCUMENTO: "${fileName}" (${totalPages} páginas)

SÍNTESES DAS SEÇÕES:
${sections.map((s: string, i: number) => `\n[SEÇÃO ${i+1}/${sections.length}]\n${s}`).join('\n\n---\n\n')}

PERGUNTA DO USUÁRIO:
${userMessage}

🎯 MISSÃO: Crie análise final de ${targetPages} páginas (70% do original) com:

1. 🌍 PANORAMA GERAL
2. 📋 CONTEÚDO CONSOLIDADO (todos os tópicos)
3. 🔬 ANÁLISE PROFUNDA
4. 📊 DADOS ESTRUTURADOS
5. 🎯 RESPOSTA DIRETA à pergunta
6. 💡 INSIGHTS e próximos passos

⚠️ PRESERVE 70% do conteúdo original
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
        max_completion_tokens: Math.floor(totalPages * 1400 * 0.7),
        temperature: 0.2,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[RAG Consolidate] OpenAI error:', response.status, error);
      throw new Error(`OpenAI error: ${response.status} - ${error}`);
    }

    console.log('[RAG Consolidate] ✅ Streaming iniciado');

    // Transformar stream OpenAI → SSE
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(l => l.trim());
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                controller.enqueue(new TextEncoder().encode(line + '\n\n'));
              }
            }
          }
          
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
          console.log('[RAG Consolidate] ✅ Stream concluído');
        } catch (error) {
          console.error('[RAG Consolidate] Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      }
    });

  } catch (error) {
    console.error('[RAG Consolidate] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
