import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    const { prompt, imageUrl } = await req.json();

    if (!prompt) {
      throw new Error('Prompt é obrigatório');
    }

    const isGeneration = !imageUrl;
    console.log(isGeneration ? 'Gerando imagem com Gemini API' : 'Editando imagem com Gemini API');

    // Prepara o formato de imagem para o Gemini (apenas para edição)
    let inlineData;
    if (imageUrl) {
      if (imageUrl.startsWith('data:image')) {
        const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          throw new Error('Formato de base64 inválido');
        }
        inlineData = {
          mimeType: matches[1],
          data: matches[2]
        };
      } else {
        throw new Error('Apenas imagens em base64 são suportadas');
      }
    }

    // Monta as parts do conteúdo
    const parts = [{ text: prompt }];
    if (inlineData) {
      parts.push({ inlineData });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: parts
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API Gemini:', errorText);
      throw new Error(`Erro da API Gemini: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Resposta da API Gemini recebida:', JSON.stringify(result));

    // Para geração de imagem, a resposta do Gemini não retorna uma imagem, apenas texto
    // Isso ocorre porque a API Gemini padrão não suporta geração de imagem
    // Apenas modelos específicos via outros endpoints suportam isso
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('Nenhuma resposta foi gerada pela API');
    }

    return new Response(
      JSON.stringify({ 
        text: generatedText,
        warning: isGeneration ? 'A API Gemini padrão não gera imagens, apenas texto' : undefined
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Erro ao editar imagem:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao editar imagem',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
