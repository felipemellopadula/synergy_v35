import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função auxiliar para estimar tokens
const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, model = "gpt-4o-mini", files = [], conversationHistory = [] } = await req.json();

    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY não configurada");
    }

    // Estimar tokens da mensagem
    const estimatedTokens = estimateTokens(message);
    console.log(`📊 Token estimation: ${estimatedTokens} tokens for model ${model}`);

    // Determinar se precisa de Map-Reduce (documentos grandes > 100k tokens)
    const needsMapReduce = estimatedTokens > 100000;

    if (needsMapReduce) {
      console.log("⚠️ Document too large, using Map-Reduce approach");
      // Implementar Map-Reduce aqui se necessário no futuro
      // Por enquanto, processar direto com streaming
    }

    // Preparar mensagens para OpenAI
    const messages: any[] = [
      {
        role: "system",
        content: "Você é um assistente útil e preciso. Responda de forma clara e organizada.",
      },
    ];

    // Adicionar histórico de conversa
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg: any) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }

    // Processar arquivos (imagens para visão)
    if (files && files.length > 0) {
      const imageFiles = files.filter((f: any) => f.type?.startsWith("image/"));
      
      if (imageFiles.length > 0) {
        // Modelo com visão - formato especial
        const content: any[] = [{ type: "text", text: message }];
        
        imageFiles.forEach((file: any) => {
          if (file.imageData) {
            content.push({
              type: "image_url",
              image_url: {
                url: file.imageData,
              },
            });
          }
        });

        messages.push({
          role: "user",
          content,
        });
      } else {
        // Sem imagens - mensagem de texto simples
        messages.push({
          role: "user",
          content: message,
        });
      }
    } else {
      messages.push({
        role: "user",
        content: message,
      });
    }

    console.log(`🚀 Sending request to OpenAI with model: ${model}`);

    // Determinar parâmetros baseado no modelo
    const isNewerModel = model.includes("gpt-5") || model.includes("gpt-4.1") || model.includes("o3") || model.includes("o4");
    
    const requestBody: any = {
      model,
      messages,
      stream: true,
    };

    // Apenas modelos antigos suportam max_tokens e temperature
    if (!isNewerModel) {
      requestBody.max_tokens = 4000;
      requestBody.temperature = 0.7;
    } else {
      // Modelos novos usam max_completion_tokens
      requestBody.max_completion_tokens = 4000;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ OpenAI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Insufficient credits. Please add funds to your OpenAI account." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    console.log("✅ Streaming response from OpenAI");

    // Retornar stream SSE diretamente
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("❌ Error in openai-chat:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
