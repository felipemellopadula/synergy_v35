import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { prompt } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    console.log('Enhancing prompt:', prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini-2025-04-14',
        max_tokens: 500,
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em prompts para geração de imagens com IA. Sua tarefa é melhorar prompts básicos transformando-os em descrições ricas, detalhadas e artísticas.

Regras:
- Adicione detalhes visuais específicos (iluminação, cores, texturas, estilo artístico)
- Inclua elementos técnicos como qualidade da imagem (ultra-high resolution, photorealistic, detailed)
- Mantenha a essência do prompt original
- Use linguagem rica e descritiva
- Adicione elementos de composição (foreground, background, depth of field)
- Responda APENAS com o prompt melhorado, sem explicações adicionais`
          },
          {
            role: 'user',
            content: `Melhore este prompt para geração de imagem: "${prompt}"`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const enhancedPrompt = data.choices[0].message.content.trim();

    console.log('Enhanced prompt:', enhancedPrompt);

    return new Response(JSON.stringify({ enhancedPrompt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in enhance-prompt function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});