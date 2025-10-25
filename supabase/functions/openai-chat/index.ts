import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { message, model = 'gpt-5-2025-08-07', files, conversationHistory = [], contextEnabled = false } = await req.json();
    
    // Get user info from JWT
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let userId = null;
    if (token) {
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      } catch (error) {
        console.log('Could not get user from token:', error);
      }
    }
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // Check if it's a newer model that uses max_completion_tokens
    const isNewerModel = model.includes('gpt-5') || model.includes('gpt-4.1') || model.includes('o3') || model.includes('o4');
    
    // Process files if present
    let finalMessage = message;
    if (files && files.length > 0) {
      const pdfFiles = files.filter((f: any) => f.type === 'application/pdf' && f.pdfContent);
      const docFiles = files.filter((f: any) => f.wordContent);
      
      const fileContents = [];
      
      if (pdfFiles.length > 0) {
        fileContents.push(...pdfFiles.map((pdf: any) => 
          `[Arquivo PDF: ${pdf.name}]\n\n${pdf.pdfContent}`
        ));
      }
      
      if (docFiles.length > 0) {
        fileContents.push(...docFiles.map((doc: any) => 
          `[Arquivo Word: ${doc.name}]\n\n${doc.wordContent}`
        ));
      }
      
      if (fileContents.length > 0) {
        finalMessage = `${message}\n\n${fileContents.join('\n\n---\n\n')}`;
      }
    }

    // Detect if we have images
    const imageFiles = files?.filter((f: any) => 
      f.type?.startsWith('image/') && f.imageData
    ) || [];
    const hasImages = imageFiles.length > 0;
    
    // Build messages array
    let messages = [];
    
    // Add system prompt
    messages.push({
      role: 'system',
      content: 'Você é um assistente prestativo e inteligente.'
    });
    
    // Add conversation history if context is enabled
    if (contextEnabled && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-5);
      messages.push(...recentHistory.map((historyMsg: any) => ({
        role: historyMsg.role,
        content: historyMsg.content
      })));
    }
    
    // Add current user message (with images if present)
    if (hasImages) {
      const content: any[] = [
        { type: 'text', text: finalMessage }
      ];
      
      for (const imageFile of imageFiles) {
        content.push({
          type: 'image_url',
          image_url: {
            url: imageFile.imageData,
            detail: 'high'
          }
        });
      }
      
      messages.push({
        role: 'user',
        content: content
      });
    } else {
      messages.push({
        role: 'user',
        content: finalMessage
      });
    }

    // Build request body with streaming enabled
    const requestBody: any = {
      model: model,
      messages: messages,
      stream: true, // ✅ Streaming ativado
    };

    // Add model-specific parameters
    if (isNewerModel) {
      requestBody.max_completion_tokens = 16384;
    } else {
      requestBody.max_tokens = 4096;
      requestBody.temperature = 0.7;
    }

    console.log('Sending streaming request to OpenAI with model:', model);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ 
          error: `Erro da API OpenAI: ${response.status}`,
          details: errorData 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status 
        }
      );
    }

    console.log('✅ OpenAI streaming response received, returning stream to client');

    // ✅ Return the stream directly to the client
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
    });

  } catch (error: any) {
    console.error('Error in openai-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
