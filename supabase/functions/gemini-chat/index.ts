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
    const { message, model = 'gemini-2.0-flash-exp', conversationHistory = [], contextEnabled = false } = await req.json();
    
    console.log('Gemini Chat - Request received:', {
      model,
      messageLength: message?.length || 0,
      messagePreview: message?.substring(0, 200) + '...',
      hasMessage: !!message,
      contextEnabled,
      historyLength: conversationHistory.length
    });
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    // Build contents array with conversation history if context is enabled
    let contents = [];
    
    if (contextEnabled && conversationHistory.length > 0) {
      // Add conversation history for context
      console.log('Building conversation context with', conversationHistory.length, 'previous messages');
      
      conversationHistory.forEach((historyMsg) => {
        // Gemini uses different role names
        const role = historyMsg.role === 'assistant' ? 'model' : 'user';
        contents.push({
          role: role,
          parts: [{ text: historyMsg.content }]
        });
      });
    }
    
    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    console.log('Sending request to Gemini with model:', model, 'and', contents.length, 'messages');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Erro da API Gemini: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Não foi possível gerar resposta';

    console.log('Gemini response received successfully');

    return new Response(JSON.stringify({ response: generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro na função gemini-chat:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});