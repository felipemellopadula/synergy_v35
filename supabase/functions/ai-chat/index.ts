import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { env } from "https://deno.land/x/dotenv/mod.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface ChatRequest {
  message: string
  model: string
  files?: Array<{
    name: string
    type: string
    data: string
    pdfContent?: string
  }>
}

const getApiKey = (model: string): string | null => {
  if (model.includes("gpt-5") || model.includes("gpt-4.1") || model.includes("o4")) {
    return env.get("OPENAI_API_KEY")
  }
  if (model.includes("claude")) {
    return env.get("ANTHROPIC_API_KEY")
  }
  if (model.includes("gemini")) {
    return env.get("GOOGLE_API_KEY")
  }
  if (model.includes("grok")) {
    return env.get("XAI_API_KEY")
  }
  if (model.includes("deepseek")) {
    return env.get("DEEPSEEK_API_KEY")
  }
  if (model.includes("Llama-4")) {
    return env.get("APILLM_API_KEY")
  }
  return null
}

const performWebSearch = async (query: string): Promise<string | null> => {
  return null
}

const callClaude = async (message: string, model: string, files?: ChatRequest["files"]): Promise<string> => {
  console.log(`[callClaude] Iniciando para o modelo: ${model}`)

  if (files && files.length > 0) {
    console.log(`[callClaude] Recebeu ${files.length} arquivo(s).`)
    files.forEach((file, index) => {
      console.log(
        `[callClaude] Arquivo ${index + 1}: Nome: ${file.name}, Tipo: ${file.type}, Conteúdo PDF (tamanho): ${file.pdfContent?.length ?? 0} chars`,
      )
    })
  }

  const apiKey = env.get("ANTHROPIC_API_KEY")
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada")

  const messages: any[] = []
  const content: any[] = []

  if (message.trim()) {
    content.push({ type: "text", text: message })
  }

  if (files && files.length > 0) {
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        console.log(`[callClaude] Adicionando imagem: ${file.name}`)
        const base64Data = file.data.split(",")[1] || file.data
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: file.type,
            data: base64Data,
          },
        })
      } else if (file.type.includes("pdf")) {
        if (typeof file.pdfContent === "string" && file.pdfContent.trim() !== "") {
          console.log(`[callClaude] Adicionando conteúdo do PDF: ${file.name}`)
          content.push({
            type: "text",
            text: `[Conteúdo do PDF: ${file.name}]\n\n${file.pdfContent}`,
          })
        } else {
          console.log(`[callClaude] PDF sem conteúdo extraível detectado: ${file.name}`)
          content.push({
            type: "text",
            text: `[Arquivo PDF anexado: ${file.name}]\n\nAVISO: Não foi possível extrair texto deste PDF.`,
          })
        }
      }
    }
  }

  messages.push({ role: "user", content })

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4096,
      messages: messages,
      system:
        "Você é um assistente útil em português. Analise o conteúdo de quaisquer arquivos fornecidos no prompt e responda com base neles.",
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error("[callClaude] Erro da API Claude:", error)
    throw new Error(`Claude API error: ${error}`)
  }

  const data = await response.json()
  return data?.content?.[0]?.text ?? "Nenhuma resposta recebida."
}

const callGemini = async (message: string, model: string, files?: ChatRequest["files"]): Promise<string> => {
  console.log(`[callGemini] Iniciando para o modelo: ${model}`)

  if (files && files.length > 0) {
    console.log(`[callGemini] Recebeu ${files.length} arquivo(s).`)
    files.forEach((file, index) => {
      console.log(
        `[callGemini] Arquivo ${index + 1}: Nome: ${file.name}, Tipo: ${file.type}, Conteúdo PDF (tamanho): ${file.pdfContent?.length ?? 0} chars`,
      )
    })
  }

  const apiKey = env.get("GOOGLE_API_KEY")
  if (!apiKey) throw new Error("GOOGLE_API_KEY não configurada")

  const parts: any[] = []

  if (message.trim()) {
    parts.push({ text: message })
  }

  if (files && files.length > 0) {
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        console.log(`[callGemini] Adicionando imagem: ${file.name}`)
        const base64Data = file.data.split(",")[1] || file.data
        parts.push({
          inline_data: {
            mime_type: file.type,
            data: base64Data,
          },
        })
      } else if (file.type.includes("pdf")) {
        if (typeof file.pdfContent === "string" && file.pdfContent.trim() !== "") {
          console.log(`[callGemini] Adicionando conteúdo do PDF: ${file.name}`)
          parts.push({
            text: `[Conteúdo do PDF: ${file.name}]\n\n${file.pdfContent}`,
          })
        } else {
          console.log(`[callGemini] PDF sem conteúdo extraível detectado: ${file.name}`)
          parts.push({
            text: `[Arquivo PDF anexado: ${file.name}]\n\nAVISO: Não foi possível extrair texto deste PDF.`,
          })
        }
      }
    }
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: parts,
          },
        ],
        systemInstruction: {
          parts: [
            {
              text: "Você é um assistente útil em português. Analise o conteúdo de quaisquer arquivos fornecidos no prompt e responda com base neles.",
            },
          ],
        },
        generationConfig: {
          maxOutputTokens: 4096,
        },
      }),
    },
  )

  if (!response.ok) {
    const error = await response.text()
    console.error("[callGemini] Erro da API Gemini:", error)
    throw new Error(`Gemini API error: ${error}`)
  }

  const data = await response.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Nenhuma resposta recebida."
}

const callGrok = async (message: string, model: string, files?: ChatRequest["files"]): Promise<string> => {
  console.log(`[callGrok] Iniciando para o modelo: ${model}`)

  if (files && files.length > 0) {
    console.log(`[callGrok] Recebeu ${files.length} arquivo(s).`)
    files.forEach((file, index) => {
      console.log(
        `[callGrok] Arquivo ${index + 1}: Nome: ${file.name}, Tipo: ${file.type}, Conteúdo PDF (tamanho): ${file.pdfContent?.length ?? 0} chars`,
      )
    })
  }

  const apiKey = env.get("XAI_API_KEY")
  if (!apiKey) throw new Error("XAI_API_KEY não configurada")

  const messages: any[] = [
    {
      role: "system",
      content:
        "Você é um assistente útil em português. Analise o conteúdo de quaisquer arquivos fornecidos no prompt e responda com base neles.",
    },
  ]

  if (files && files.length > 0) {
    const userMessage: { role: string; content: any[] } = { role: "user", content: [] }

    if (message.trim()) {
      userMessage.content.push({ type: "text", text: message })
    }

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        console.log(`[callGrok] Adicionando imagem: ${file.name}`)
        userMessage.content.push({
          type: "image_url",
          image_url: { url: file.data },
        })
      } else if (file.type.includes("pdf")) {
        if (typeof file.pdfContent === "string" && file.pdfContent.trim() !== "") {
          console.log(`[callGrok] Adicionando conteúdo do PDF: ${file.name}`)
          userMessage.content.push({
            type: "text",
            text: `[Conteúdo do PDF: ${file.name}]\n\n${file.pdfContent}`,
          })
        } else {
          console.log(`[callGrok] PDF sem conteúdo extraível detectado: ${file.name}`)
          userMessage.content.push({
            type: "text",
            text: `[Arquivo PDF anexado: ${file.name}]\n\nAVISO: Não foi possível extrair texto deste PDF.`,
          })
        }
      }
    }

    messages.push(userMessage)
  } else {
    messages.push({ role: "user", content: message })
  }

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error("[callGrok] Erro da API Grok:", error)
    throw new Error(`Grok API error: ${error}`)
  }

  const data = await response.json()
  return data?.choices?.[0]?.message?.content ?? "Nenhuma resposta recebida."
}

const callOpenAI = async (message: string, model: string, files?: ChatRequest["files"]): Promise<string> => {
  console.log(`[callOpenAI] Iniciando para o modelo: ${model}`)

  if (files && files.length > 0) {
    console.log(`[callOpenAI] Recebeu ${files.length} arquivo(s).`)
    files.forEach((file, index) => {
      console.log(
        `[callOpenAI] Arquivo ${index + 1}: Nome: ${file.name}, Tipo: ${file.type}, Conteúdo PDF (tamanho): ${file.pdfContent?.length ?? 0} chars`,
      )
    })
  }

  const apiKey = env.get("OPENAI_API_KEY")
  const messages: any[] = [
    {
      role: "system",
      content:
        "Você é um assistente útil em português. Analise o conteúdo de quaisquer arquivos fornecidos no prompt e responda com base neles.",
    },
  ]

  if (files && files.length > 0) {
    const userMessage: { role: string; content: any[] } = { role: "user", content: [] }

    if (message.trim()) {
      userMessage.content.push({ type: "text", text: message })
    }

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        console.log(`[callOpenAI] Adicionando imagem: ${file.name}`)
        userMessage.content.push({
          type: "image_url",
          image_url: { url: file.data },
        })
      } else if (file.type.includes("pdf")) {
        if (typeof file.pdfContent === "string" && file.pdfContent.trim() !== "") {
          console.log(`[callOpenAI] Adicionando conteúdo do PDF: ${file.name}`)
          userMessage.content.push({
            type: "text",
            text: `[Conteúdo do PDF: ${file.name}]\n\n${file.pdfContent}`,
          })
        } else {
          console.log(`[callOpenAI] PDF sem conteúdo extraível detectado: ${file.name}. Enviando fallback.`)
          userMessage.content.push({
            type: "text",
            text: `[Arquivo PDF anexado: ${file.name}]\n\nAVISO: Não foi possível extrair texto deste PDF. O arquivo pode ser composto apenas por imagens ou estar corrompido.`,
          })
        }
      }
    }

    messages.push(userMessage)
  } else {
    messages.push({ role: "user", content: message })
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, max_tokens: 4096 }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error("[callOpenAI] Erro da API OpenAI:", error)
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  return data?.choices?.[0]?.message?.content ?? "Nenhuma resposta recebida."
}

const callAI = async (message: string, model: string, files?: ChatRequest["files"]): Promise<string> => {
  console.log(`[callAI] Roteando para o modelo: ${model}`)

  if (model.includes("claude")) {
    return await callClaude(message, model, files)
  } else if (model.includes("gemini")) {
    return await callGemini(message, model, files)
  } else if (model.includes("grok")) {
    return await callGrok(message, model, files)
  } else {
    // Default to OpenAI for other models (GPT, etc.)
    return await callOpenAI(message, model, files)
  }
}

serve(async (req) => {
  console.log("--- NOVA REQUISIÇÃO RECEBIDA ---")
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, model, files }: ChatRequest = await req.json()
    console.log(`Modelo recebido: ${model}, Mensagem: "${message}"`)

    let actualModel = model
    if (model === "gpt-5-mini") actualModel = "gpt-4o-mini"

    const response = await callAI(message, actualModel, files)

    console.log("--- RESPOSTA GERADA COM SUCESSO ---")
    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("ERRO GERAL NA FUNÇÃO:", error)
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
