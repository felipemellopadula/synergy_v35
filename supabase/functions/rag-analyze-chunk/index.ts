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
    const { chunk, chunkIndex, totalChunks, totalPages } = await req.json();
    const openAIKey = Deno.env.get('OPENAI_API_KEY');

    console.log(`[RAG Chunk ${chunkIndex + 1}/${totalChunks}] Analisando chunk de documento de ${totalPages} páginas`);

    const prompt = `Você é um analista especializado em PRESERVAÇÃO MÁXIMA DE INFORMAÇÃO.

📄 CHUNK [${chunkIndex + 1} de ${totalChunks}] de um documento de ${totalPages} páginas

${chunk}

🎯 MISSÃO: Extraia e preserve TODOS os detalhes importantes:
1. Estrutura e hierarquia do conteúdo
2. Conceitos-chave e definições
3. Dados, números, estatísticas
4. Exemplos e casos práticos
5. Relações e conexões
6. Terminologia técnica

⚠️ PRESERVE 90% do conteúdo original
Use Markdown para estruturação`;

    // Retry logic com exponential backoff
    const MAX_RETRIES = 2;
    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openAIKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini-2025-04-14",
            messages: [{ role: "user", content: prompt }],
            max_completion_tokens: 4000,
            temperature: 0.3,
          }),
        });

        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000 * Math.pow(2, attempt);
          
          if (attempt < MAX_RETRIES) {
            console.log(`⏳ Rate limit (429), aguardando ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        if (!response.ok) {
          lastError = await response.text();
          throw new Error(`OpenAI error: ${response.status}`);
        }

        const data = await response.json();
        const analysis = data.choices[0].message.content;

        console.log(`[RAG Chunk ${chunkIndex + 1}/${totalChunks}] ✅ Análise concluída`);

        return new Response(
          JSON.stringify({ analysis }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES) {
          const delay = 3000 * Math.pow(2, attempt);
          console.log(`⚠️ Chunk ${chunkIndex+1} tentativa ${attempt+1} falhou, aguardando ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Todas tentativas falharam
    console.error(`[RAG Chunk ${chunkIndex + 1}] ❌ Falhou após ${MAX_RETRIES+1} tentativas`);
    throw new Error(`Failed after ${MAX_RETRIES+1} attempts: ${lastError}`);

  } catch (error) {
    console.error('[RAG Chunk] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
