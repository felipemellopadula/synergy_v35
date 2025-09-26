import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para dividir texto em chunks otimizados para DeepSeek
function chunkText(text: string, maxChunkSize: number = 120000): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = '';
  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxChunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = sentence;
      } else {
        // Sentença muito longa, dividir por caracteres
        for (let i = 0; i < sentence.length; i += maxChunkSize) {
          chunks.push(sentence.slice(i, i + maxChunkSize));
        }
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, model = 'deepseek-chat' } = await req.json();

    console.log(`DeepSeek Chat - Modelo: ${model}`);
    console.log(`Tamanho da mensagem: ${message.length} caracteres`);

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY não configurada');
    }

    let processedMessage = message;
    let chunks: string[] = [];

    // Configurar chunk size baseado no modelo
    const maxChunkSize = model === 'deepseek-reasoner' ? 100000 : 120000; // Reasoner é mais conservador

    // Se a mensagem for muito longa, usar chunking
    if (message.length > maxChunkSize) {
      console.log('Mensagem longa detectada, usando chunking...');
      chunks = chunkText(message, maxChunkSize);
      console.log(`Dividido em ${chunks.length} chunks`);

      // Para mensagens longas, usar resumo progressivo
      let summary = '';
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Processando chunk ${i + 1}/${chunks.length}`);
        
        const chunkPrompt = i === 0 
          ? `Analise este documento (parte ${i + 1} de ${chunks.length}). Extraia os pontos principais:\n\n${chunks[i]}`
          : `Continue a análise do documento (parte ${i + 1} de ${chunks.length}). Pontos anteriores: ${summary}\n\nNova parte:\n${chunks[i]}`;

        const chunkResponse = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${deepseekApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek-chat', // Usar sempre chat para chunks (mais rápido)
            messages: [
              { role: 'system', content: 'Você é um assistente especializado em análise de documentos. Seja conciso e objetivo.' },
              { role: 'user', content: chunkPrompt }
            ],
            max_tokens: 4000,
            temperature: 0.7,
            stream: false
          }),
        });

        if (!chunkResponse.ok) {
          throw new Error(`Erro no chunk ${i + 1}: ${chunkResponse.statusText}`);
        }

        const chunkData = await chunkResponse.json();
        const chunkResult = chunkData.choices[0].message.content;
        summary += (summary ? '\n\n' : '') + chunkResult;
      }

      // Usar o resumo como mensagem final
      processedMessage = `Baseado na análise completa do documento:\n\n${summary}\n\nAgora responda de forma detalhada e completa.`;
    }

    // Fazer a requisição final
    console.log('Enviando requisição para DeepSeek API...');
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { 
            role: 'system', 
            content: model === 'deepseek-reasoner' 
              ? 'Você é um assistente inteligente com capacidades de raciocínio avançado. Pense profundamente sobre cada pergunta antes de responder.' 
              : 'Você é um assistente inteligente e útil. Responda de forma clara e precisa.'
          },
          { role: 'user', content: processedMessage }
        ],
        max_tokens: 8000,
        temperature: 0.7,
        stream: true // Usar stream para melhor performance
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro da API DeepSeek:', errorData);
      throw new Error(`Erro da API DeepSeek: ${response.status} - ${errorData}`);
    }

    // Para stream response
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                  fullResponse += parsed.choices[0].delta.content;
                }
              } catch (e) {
                // Ignorar erros de parsing de chunks individuais
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      console.log('Resposta completa recebida');
      return new Response(JSON.stringify({ response: fullResponse }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback para resposta não-stream
    const data = await response.json();
    const responseText = data.choices[0].message.content;

    // Record token usage in database  
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token) {
      try {
        // Get user info from JWT
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data: { user } } = await supabase.auth.getUser(token);
        const userId = user?.id;
        
        if (userId) {
          // Calculate token usage - 4 characters = 1 token
          const inputTokens = Math.ceil((message?.length || 0) / 4);
          const outputTokens = Math.ceil(responseText.length / 4);
          const totalTokens = inputTokens + outputTokens;
          
          console.log('Recording DeepSeek token usage:', {
            userId,
            model,
            inputTokens,
            outputTokens,
            totalTokens
          });

          // Save token usage to database
          const { error: tokenError } = await supabase
            .from('token_usage')
            .insert({
              user_id: userId,
              model_name: model,
              tokens_used: totalTokens,
              input_tokens: inputTokens,
              output_tokens: outputTokens,
              message_content: message?.length > 1000 
                ? message.substring(0, 1000) + '...' 
                : message,
              ai_response_content: responseText.length > 2000
                ? responseText.substring(0, 2000) + '...'
                : responseText,
              created_at: new Date().toISOString()
            });

          if (tokenError) {
            console.error('Error saving token usage:', tokenError);
          } else {
            console.log('Token usage recorded successfully');
          }
        }
      } catch (tokenRecordError) {
        console.error('Error recording token usage:', tokenRecordError);
      }
    }

    return new Response(JSON.stringify({ response: responseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro na função DeepSeek Chat:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      details: 'Erro interno na função DeepSeek Chat'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});