import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { prompt, format, tone, length } = await req.json();

    // Build the enhanced prompt with context
    const enhancedPrompt = `Você é um assistente de escrita especializado. Crie um texto em português com as seguintes especificações:

FORMATO: ${format}
TOM: ${tone}
COMPRIMENTO: ${length}

TÓPICO: ${prompt}

INSTRUÇÕES IMPORTANTES:
- Escreva APENAS em português do Brasil
- Use o formato "${format}" especificado
- Mantenha o tom "${tone}" durante todo o texto
- O comprimento deve ser "${length}"
- Para "Curto": 1-2 parágrafos (100-200 palavras)
- Para "Médio": 3-5 parágrafos (300-500 palavras)  
- Para "Longo": 6+ parágrafos (600+ palavras)
- Seja criativo e envolvente
- Use estrutura clara com títulos quando apropriado
- Para emails, inclua assunto, saudação e despedida
- Para posts de blog, inclua título atrativo
- Para anúncios, foque em call-to-action

Texto:`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + Deno.env.get('GOOGLE_API_KEY'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: enhancedPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in write-content function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});