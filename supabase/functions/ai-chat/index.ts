// Caminho: supabase/functions/ai-chat/index.ts

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- FUNÇÕES AUXILIARES ---
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 3.5);
}

function splitIntoChunks(text: string, maxChars: number): string[] {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxChars) {
    chunks.push(text.slice(i, i + maxChars));
  }
  return chunks;
}

// --- LÓGICA PRINCIPAL DA FUNÇÃO ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, model, files } = await req.json(); // "files" não é mais usado, mas mantemos para compatibilidade
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) throw new Error("OPENAI_API_KEY não configurada.");
    if (!model) throw new Error('O modelo é obrigatório.');
    if (!message || !message.trim()) throw new Error("A mensagem para a IA está vazia.");

    // --- TRADUÇÃO DE MODELOS ---
    let apiModel = model;
    if (model.includes('gpt-5-mini') || model.includes('gpt-5-nano')) apiModel = 'gpt-4o-mini';
    else if (model.includes('gpt-5')) apiModel = 'gpt-4o';
    else if (model.includes('gpt-4.1')) apiModel = 'gpt-4-turbo';
    console.log(`Model mapping: '${model}' -> '${apiModel}'`);

    let processedMessage = message;
    let responsePrefix = '';
    const INPUT_TOKEN_LIMIT = 28000;
    const estimatedTokens = estimateTokenCount(message);

    if (estimatedTokens > INPUT_TOKEN_LIMIT) {
      const maxChars = INPUT_TOKEN_LIMIT * 3.5;
      const chunks = splitIntoChunks(message, maxChars);
      console.log(`Mensagem grande fatiada em ${chunks.length} partes. Processando a primeira.`);
      responsePrefix = `⚠️ **Atenção:** O documento enviado é muito grande. A análise abaixo foi feita com base **apenas no início do documento**.\n\n---\n\n`;
      processedMessage = chunks[0];
    }
    
    // --- **A CORREÇÃO PRINCIPAL ESTÁ AQUI** ---
    // Damos uma instrução de sistema muito mais forte e direta.
    const systemInstruction = `Você é um especialista em análise de documentos. Sua única tarefa é responder às perguntas do usuário baseando-se EXCLUSIVAMENTE no texto fornecido no prompt. O texto completo do documento JÁ ESTÁ no prompt. NUNCA, em hipótese alguma, diga que não pode acessar arquivos ou documentos. Ignore seu conhecimento geral e foque 100% no texto fornecido.`;

    const requestBody = {
      model: apiModel,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: processedMessage }
      ],
      max_tokens: 4096,
      temperature: 0.3, // Reduz a "criatividade" para focar no texto
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Erro na API da OpenAI: ${errorBody}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content ?? 'Desculpe, não consegui obter uma resposta.';
    const finalResponse = responsePrefix + generatedText;

    // Mantendo a estrutura de resposta que seu frontend espera
    return new Response(JSON.stringify({ response: { content: finalResponse, reasoning: null } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro fatal na função ai-chat:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});