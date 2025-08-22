import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to estimate token count (rough estimate: 1 token ≈ 4 characters)
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

// Function to split text into chunks based on token limits
function splitIntoChunks(text: string, maxTokens: number): string[] {
  const words = text.split(' ');
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const word of words) {
    const testChunk = currentChunk + (currentChunk ? ' ' : '') + word;
    if (estimateTokenCount(testChunk) > maxTokens && currentChunk) {
      chunks.push(currentChunk);
      currentChunk = word;
    } else {
      currentChunk = testChunk;
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
    const { message, model = 'grok-beta' } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    // Get API key
    const apiKey = Deno.env.get('XAI_API_KEY');
    if (!apiKey) {
      throw new Error('XAI_API_KEY not configured');
    }

    console.log(`🤖 Processando com Grok modelo: ${model}`);
    console.log(`📝 Tamanho da mensagem: ${message.length} caracteres`);

    // Check if this is a large message (likely PDF content)
    const isLargeMessage = message.length > 50000;
    const tokenCount = estimateTokenCount(message);
    
    console.log(`🔢 Tokens estimados: ${tokenCount}`);

    let responseContent = '';

    if (isLargeMessage && tokenCount > 25000) {
      console.log('📄 PDF grande detectado, processando em chunks...');
      
      // Split into chunks for large PDFs
      const maxTokensPerChunk = 25000; // Conservative limit for Grok
      const chunks = splitIntoChunks(message, maxTokensPerChunk);
      
      console.log(`📊 Dividido em ${chunks.length} chunks`);

      const summaries: string[] = [];

      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        console.log(`🔄 Processando chunk ${i + 1}/${chunks.length}`);
        
        const chunkPrompt = `Por favor, analise e resuma este conteúdo (parte ${i + 1} de ${chunks.length}):

${chunks[i]}

Forneça um resumo conciso e detalhado dos pontos principais desta seção.`;

        const chunkResponse = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: chunkPrompt
              }
            ],
            max_tokens: 2000,
            temperature: 0.7
          }),
        });

        if (!chunkResponse.ok) {
          const errorText = await chunkResponse.text();
          console.error(`❌ Erro no chunk ${i + 1}:`, errorText);
          throw new Error(`Grok API error for chunk ${i + 1}: ${chunkResponse.status} - ${errorText}`);
        }

        const chunkData = await chunkResponse.json();
        const chunkSummary = chunkData.choices[0]?.message?.content || `Resumo do chunk ${i + 1} não disponível`;
        summaries.push(`**Parte ${i + 1}:**\n${chunkSummary}`);
        
        // Add delay between chunks to respect rate limits
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Create final comprehensive summary
      const finalPrompt = `Com base nos seguintes resumos de um documento, forneça uma análise final completa e bem estruturada:

${summaries.join('\n\n')}

Por favor, forneça:
1. Um resumo executivo
2. Os principais pontos identificados
3. Conclusões e insights importantes

Organize a resposta de forma clara e estruturada.`;

      console.log('📋 Gerando resumo final...');

      const finalResponse = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: finalPrompt
            }
          ],
          max_tokens: 3000,
          temperature: 0.7
        }),
      });

      if (!finalResponse.ok) {
        const errorText = await finalResponse.text();
        console.error('❌ Erro no resumo final:', errorText);
        throw new Error(`Grok API error for final summary: ${finalResponse.status} - ${errorText}`);
      }

      const finalData = await finalResponse.json();
      responseContent = `## 📄 Análise Completa do Documento

${finalData.choices[0]?.message?.content || 'Análise final não disponível'}

---
*Documento processado em ${chunks.length} partes pelo Grok*`;

    } else {
      // Regular message processing
      console.log('💬 Processando mensagem regular...');
      
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 4000,
          temperature: 0.7
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na API do Grok:', errorText);
        throw new Error(`Grok API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      responseContent = data.choices[0]?.message?.content || 'Resposta não disponível';
    }

    console.log('✅ Resposta gerada com sucesso');

    return new Response(JSON.stringify({ 
      response: responseContent 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na função grok-chat:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});