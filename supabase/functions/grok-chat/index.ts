import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to estimate token count (rough approximation)
function estimateTokenCount(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for Portuguese text
  return Math.ceil(text.length / 3);
}

// Function to split text into chunks
function splitIntoChunks(text: string, maxTokens: number): string[] {
  const maxChars = maxTokens * 3; // Convert tokens to approximate characters
  const chunks = [];
  
  for (let i = 0; i < text.length; i += maxChars) {
    chunks.push(text.slice(i, i + maxChars));
  }
  
  return chunks;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, model = 'grok-3', conversationHistory = [], contextEnabled = false } = await req.json();
    
    const xaiApiKey = Deno.env.get('XAI_API_KEY');
    if (!xaiApiKey) {
      throw new Error('XAI_API_KEY não configurada');
    }

    // Define token limits for different xAI models
    const getModelLimits = (modelName: string) => {
      if (modelName.includes('grok-4')) return { input: 128000, output: 8192 };
      if (modelName.includes('grok-3-mini')) return { input: 32000, output: 4096 };
      if (modelName.includes('grok-3')) return { input: 128000, output: 8192 };
      return { input: 128000, output: 8192 }; // Default for Grok models
    };

    const limits = getModelLimits(model);
    
    // Build messages array with conversation history if context is enabled
    let messages = [];
    
    if (contextEnabled && conversationHistory.length > 0) {
      // Add conversation history for context
      console.log('Building conversation context with', conversationHistory.length, 'previous messages');
      
      messages = conversationHistory.map((historyMsg: any) => ({
        role: historyMsg.role,
        content: historyMsg.content
      }));
    }
    
    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });
    
    // Calculate total token count for the entire conversation
    const totalText = messages.map((msg: any) => msg.content).join('\n');
    const estimatedTokens = estimateTokenCount(totalText);
    
    console.log('Token estimation:', { 
      estimatedTokens, 
      inputLimit: limits.input, 
      model,
      messageLength: totalText.length,
      contextMessages: messages.length - 1
    });

    let processedMessages = messages;
    let responsePrefix = '';

    // If conversation is too large, truncate older messages but keep recent context
    if (estimatedTokens > limits.input * 0.4) {
      console.log('Conversation too large, truncating older messages...');
      
      // Keep the current message and try to fit as many recent messages as possible
      const currentMessage = messages[messages.length - 1];
      let keptMessages = [currentMessage];
      let currentTokens = estimateTokenCount(currentMessage.content);
      
      // Add messages from most recent backwards until we hit the limit
      for (let i = messages.length - 2; i >= 0; i--) {
        const msgTokens = estimateTokenCount(messages[i].content);
        if (currentTokens + msgTokens < limits.input * 0.4) {
          keptMessages.unshift(messages[i]);
          currentTokens += msgTokens;
        } else {
          break;
        }
      }
      
      processedMessages = keptMessages;
      
      if (keptMessages.length < messages.length) {
        responsePrefix = `ℹ️ Mantendo contexto das últimas ${keptMessages.length - 1} mensagens da conversa.\n\n`;
      }
    }
    
    const requestBody = {
      model: model,
      messages: processedMessages,
      max_tokens: limits.output,
      temperature: 0.7,
    };

    console.log('Sending request to xAI with model:', model);
    console.log('Request config:', { 
      model, 
      maxTokens: requestBody.max_tokens,
      temperature: requestBody.temperature 
    });

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${xaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('xAI API error:', errorData);
      throw new Error(`Erro da API xAI: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || 'Não foi possível gerar resposta';
    
    // Add prefix if message was processed in chunks
    const finalResponse = responsePrefix + generatedText;

    console.log('xAI response received successfully');

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
          const inputTokens = Math.ceil((messages[messages.length - 1]?.content?.length || 0) / 4);
          const outputTokens = Math.ceil(generatedText.length / 4);
          const totalTokens = inputTokens + outputTokens;
          
          console.log('Recording Grok token usage:', {
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
              message_content: messages[messages.length - 1]?.content?.length > 1000 
                ? messages[messages.length - 1]?.content.substring(0, 1000) + '...' 
                : messages[messages.length - 1]?.content,
              ai_response_content: generatedText.length > 2000
                ? generatedText.substring(0, 2000) + '...'
                : generatedText,
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

    return new Response(JSON.stringify({ response: finalResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro na função xai-chat:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});