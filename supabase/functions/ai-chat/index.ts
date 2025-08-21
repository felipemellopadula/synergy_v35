import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  model: string;
  files?: Array<{
    name: string;
    type: string;
    data: string;
    pdfContent?: string;
  }>;
}

// ... (as outras funções como getApiKey, performWebSearch, etc. podem continuar como estão) ...
const getApiKey = (model: string): string | null => {
  if (model.includes('gpt-5') || model.includes('gpt-4.1') || model.includes('o4')) {
    return Deno.env.get('OPENAI_API_KEY');
  }
  if (model.includes('claude')) {
    return Deno.env.get('ANTHROPIC_API_KEY');
  }
  if (model.includes('gemini')) {
    return Deno.env.get('GOOGLE_API_KEY');
  }
  if (model.includes('grok')) {
    return Deno.env.get('XAI_API_KEY');
  }
  if (model.includes('deepseek')) {
    return Deno.env.get('DEEPSEEK_API_KEY');
  }
  if (model.includes('Llama-4')) {
    return Deno.env.get('APILLM_API_KEY');
  }
  return null;
};
const performWebSearch = async (query: string): Promise<string | null> => {return null};


const callOpenAI = async (message: string, model: string, files?: ChatRequest['files']): Promise<string> => {
  console.log(`[callOpenAI] Iniciando para o modelo: ${model}`);
  
  if (files && files.length > 0) {
    console.log(`[callOpenAI] Recebeu ${files.length} arquivo(s).`);
    // Log detalhado de cada arquivo
    files.forEach((file, index) => {
      console.log(`[callOpenAI] Arquivo ${index + 1}: Nome: ${file.name}, Tipo: ${file.type}, Conteúdo PDF (tamanho): ${file.pdfContent?.length ?? 0} chars`);
    });
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  const finalMessage = message; // Simplificado para focar no problema do PDF
  
  const messages: any[] = [{
    role: 'system',
    content: 'Você é um assistente útil em português. Analise o conteúdo de quaisquer arquivos fornecidos no prompt e responda com base neles.'
  }];

  if (files && files.length > 0) {
    const userMessage: { role: string; content: any[] } = { role: 'user', content: [] };
    
    if (finalMessage.trim()) {
      userMessage.content.push({ type: 'text', text: finalMessage });
    }
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        console.log(`[callOpenAI] Adicionando imagem: ${file.name}`);
        userMessage.content.push({
          type: 'image_url',
          image_url: { url: file.data }
        });
      } else if (file.type.includes('pdf')) {
        if (typeof file.pdfContent === 'string' && file.pdfContent.trim() !== '') {
          console.log(`[callOpenAI] Adicionando conteúdo do PDF: ${file.name}`);
          userMessage.content.push({
            type: 'text',
            text: `[Conteúdo do PDF: ${file.name}]\n\n${file.pdfContent}`
          });
        } else {
          console.log(`[callOpenAI] PDF sem conteúdo extraível detectado: ${file.name}. Enviando fallback.`);
          userMessage.content.push({
            type: 'text',
            text: `[Arquivo PDF anexado: ${file.name}]\n\nAVISO: Não foi possível extrair texto deste PDF. O arquivo pode ser composto apenas por imagens ou estar corrompido.`
          });
        }
      }
    }
    
    messages.push(userMessage);
  } else {
    messages.push({ role: 'user', content: finalMessage });
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: 4096 }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[callOpenAI] Erro da API OpenAI:', error);
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? 'Nenhuma resposta recebida.';
};

serve(async (req) => {
  console.log('--- NOVA REQUISIÇÃO RECEBIDA ---');
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, model, files }: ChatRequest = await req.json();
    console.log(`Modelo recebido: ${model}, Mensagem: "${message}"`);

    let actualModel = model;
    if (model === 'gpt-5-mini') actualModel = 'gpt-4o-mini';

    const response = await callOpenAI(message, actualModel, files);

    console.log('--- RESPOSTA GERADA COM SUCESSO ---');
    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ERRO GERAL NA FUNÇÃO:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});