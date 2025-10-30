import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============= CONFIGURAÇÕES =============
const ACTIVATION_THRESHOLD_PAGES = 20;
const TARGET_OUTPUT_RATIO = 0.7; // 70% do original
const CHUNK_OUTPUT_RATIO = 0.9;  // Nível 1: 90%
const SECTION_OUTPUT_RATIO = 0.8; // Nível 2: 80%
const FINAL_OUTPUT_RATIO = 0.93; // Nível 3: 93% (para atingir 70% total)

const TOKENS_PER_PAGE = 1400;
const CHARS_PER_PAGE = 3500;

// Configurações de chunking adaptativo
const getChunkConfig = (pages: number) => {
  if (pages <= 50) return { chunkPages: 12, overlapPages: 2 };
  if (pages <= 100) return { chunkPages: 15, overlapPages: 3 };
  if (pages <= 200) return { chunkPages: 20, overlapPages: 4 };
  if (pages <= 500) return { chunkPages: 25, overlapPages: 5 };
  if (pages <= 1000) return { chunkPages: 30, overlapPages: 6 };
  return { chunkPages: 40, overlapPages: 8 };
};

// Estimação de tokens
const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============= NÍVEL 0: CHUNKING INTELIGENTE =============
const createAdaptiveChunks = (content: string, totalPages: number): string[] => {
  const { chunkPages, overlapPages } = getChunkConfig(totalPages);
  const chunkSize = chunkPages * CHARS_PER_PAGE;
  const overlapSize = overlapPages * CHARS_PER_PAGE;
  
  const chunks: string[] = [];
  let position = 0;
  
  while (position < content.length) {
    const end = Math.min(position + chunkSize, content.length);
    chunks.push(content.slice(position, end));
    position += (chunkSize - overlapSize);
    
    if (end === content.length) break;
  }
  
  console.log(`📚 Criados ${chunks.length} chunks (${chunkPages} páginas cada, overlap ${overlapPages} páginas)`);
  return chunks;
};

// ============= NÍVEL 1: CHUNK ANALYSIS =============
const analyzeChunk = async (
  chunk: string,
  chunkIndex: number,
  totalChunks: number,
  totalPages: number,
  openAIApiKey: string,
  retryCount = 0
): Promise<string> => {
  const chunkTokens = estimateTokens(chunk);
  const chunkPages = Math.ceil(chunkTokens / TOKENS_PER_PAGE);
  const targetOutputTokens = Math.floor(chunkTokens * CHUNK_OUTPUT_RATIO);
  
  console.log(`🔍 Chunk ${chunkIndex + 1}/${totalChunks}: ${chunkPages} páginas → ${Math.floor(chunkPages * CHUNK_OUTPUT_RATIO)} páginas`);
  
  const prompt = `Você é um analista especializado em PRESERVAÇÃO MÁXIMA DE INFORMAÇÃO.

📄 CHUNK [${chunkIndex + 1} de ${totalChunks}] de um documento de ${totalPages} páginas

${chunk}

🎯 MISSÃO: Crie uma análise ULTRA-DETALHADA de ${targetOutputTokens} tokens (90% do original) que preserve:

1. 📋 ESTRUTURA COMPLETA
   - Todos os títulos, subtítulos e hierarquia
   - Numeração de seções e referências
   - Organização lógica do conteúdo

2. 💎 CONTEÚDO ESSENCIAL (MÁXIMA PRESERVAÇÃO)
   - Todos os conceitos principais explicados em detalhes
   - Argumentos centrais com contexto completo
   - Definições e terminologias importantes
   - Exemplos relevantes e casos práticos

3. 📊 DADOS CRÍTICOS (100% DE RETENÇÃO)
   - Todas as tabelas, gráficos e estatísticas
   - Números, percentuais e métricas exatas
   - Citações textuais relevantes
   - Referências bibliográficas e fontes

4. 🔗 CONEXÕES E RELAÇÕES
   - Referências a outras seções do documento
   - Ligações conceituais entre tópicos
   - Dependências e pré-requisitos

5. 🧠 INSIGHTS E ANÁLISE
   - Pontos de destaque e descobertas
   - Implicações e consequências
   - Questões emergentes

⚠️ REGRAS CRÍTICAS:
- NÃO resuma excessivamente - mantenha riqueza de detalhes
- NÃO descarte informações secundárias
- MANTENHA o nível técnico original
- USE Markdown (H2/H3/H4, listas, tabelas)
- PRESERVE citações literais

🎯 Target: ${targetOutputTokens} tokens (≈${Math.floor(chunkPages * CHUNK_OUTPUT_RATIO)} páginas)`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: Math.min(64000, targetOutputTokens),
        temperature: 0.3,
        stream: false,
      }),
    });

    if (response.status === 429 && retryCount < 3) {
      console.log(`⏳ Rate limit hit, retrying chunk ${chunkIndex + 1} in 60s (attempt ${retryCount + 1}/3)`);
      await delay(60000);
      return analyzeChunk(chunk, chunkIndex, totalChunks, totalPages, openAIApiKey, retryCount + 1);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chunk analysis failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const result = data.choices[0].message.content;
    
    console.log(`✅ Chunk ${chunkIndex + 1}: ${estimateTokens(result)} tokens gerados`);
    return result;
  } catch (error) {
    console.error(`❌ Error analyzing chunk ${chunkIndex + 1}:`, error);
    throw error;
  }
};

// ============= NÍVEL 2: SECTION SYNTHESIS =============
const synthesizeSection = async (
  chunkAnalyses: string[],
  sectionIndex: number,
  totalSections: number,
  openAIApiKey: string,
  retryCount = 0
): Promise<string> => {
  const totalSectionTokens = chunkAnalyses.reduce((sum, analysis) => sum + estimateTokens(analysis), 0);
  const targetOutputTokens = Math.floor(totalSectionTokens * SECTION_OUTPUT_RATIO);
  const totalSectionPages = Math.ceil(totalSectionTokens / TOKENS_PER_PAGE);
  
  console.log(`🧩 Section ${sectionIndex + 1}/${totalSections}: ${chunkAnalyses.length} chunks (${totalSectionPages} páginas) → ${Math.floor(totalSectionPages * SECTION_OUTPUT_RATIO)} páginas`);
  
  const prompt = `Você é um sintetizador especializado em CONSOLIDAÇÃO SEM PERDA.

📚 SEÇÃO [${sectionIndex + 1} de ${totalSections}] - Consolidando ${chunkAnalyses.length} chunks

ANÁLISES DOS CHUNKS:
${chunkAnalyses.map((analysis, i) => `\n[CHUNK ${i+1}/${chunkAnalyses.length}]\n${analysis}\n`).join('\n---\n')}

🎯 MISSÃO: Crie uma SÍNTESE CONSOLIDADA de ${targetOutputTokens} tokens (80% do agregado) que:

1. 🔗 INTEGRE todos os chunks mantendo estrutura hierárquica e fluxo lógico
2. 💎 PRESERVE conceitos, argumentos, dados, tabelas e exemplos
3. 🧩 ELIMINE apenas redundâncias e repetições entre chunks
4. ✨ ADICIONE conexões identificadas entre chunks e padrões recorrentes

⚠️ REGRAS:
- Máxima fidelidade ao original
- NÃO crie conteúdo novo
- PRESERVE dados numéricos e citações
- USE Markdown estruturado

🎯 Target: ${targetOutputTokens} tokens (≈${Math.floor(totalSectionPages * SECTION_OUTPUT_RATIO)} páginas)`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: Math.min(64000, targetOutputTokens),
        temperature: 0.2,
        stream: false,
      }),
    });

    if (response.status === 429 && retryCount < 3) {
      console.log(`⏳ Rate limit hit, retrying section ${sectionIndex + 1} in 60s (attempt ${retryCount + 1}/3)`);
      await delay(60000);
      return synthesizeSection(chunkAnalyses, sectionIndex, totalSections, openAIApiKey, retryCount + 1);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Section synthesis failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const result = data.choices[0].message.content;
    
    console.log(`✅ Section ${sectionIndex + 1}: ${estimateTokens(result)} tokens gerados`);
    return result;
  } catch (error) {
    console.error(`❌ Error synthesizing section ${sectionIndex + 1}:`, error);
    throw error;
  }
};

// ============= TRANSFORMAR STREAM OPENAI → SSE =============
const transformOpenAIStreamToSSE = (openAIStream: ReadableStream): ReadableStream => {
  const reader = openAIStream.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  
  return new ReadableStream({
    async start(controller) {
      let buffer = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('✅ Stream OpenAI concluído');
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            
            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6);
              
              if (data === '[DONE]') {
                console.log('🏁 Recebido [DONE] da OpenAI');
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  const sseEvent = `data: ${JSON.stringify({ content })}\n\n`;
                  controller.enqueue(encoder.encode(sseEvent));
                }
              } catch (e) {
                console.warn('⚠️ Erro ao parsear JSON da OpenAI:', e);
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro no transformStream:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    }
  });
};

// ============= NÍVEL 3: DOCUMENT CONSOLIDATION =============
const consolidateDocument = async (
  sectionSyntheses: string[],
  userMessage: string,
  fileName: string,
  totalPages: number,
  openAIApiKey: string
): Promise<ReadableStream> => {
  const targetOutputTokens = Math.floor(totalPages * TOKENS_PER_PAGE * TARGET_OUTPUT_RATIO);
  const targetPages = Math.floor(totalPages * TARGET_OUTPUT_RATIO);
  
  console.log(`🎯 Consolidação Final: ${totalPages} páginas → ${targetPages} páginas (${targetOutputTokens} tokens)`);
  
  const prompt = `Você é um especialista em ANÁLISE DOCUMENTAL PROFUNDA E CONSOLIDAÇÃO FINAL.

📖 DOCUMENTO COMPLETO: "${fileName}" (${totalPages} páginas)

SÍNTESES DAS SEÇÕES:
${sectionSyntheses.map((synthesis, i) => `\n[SEÇÃO ${i+1}/${sectionSyntheses.length}]\n${synthesis}\n`).join('\n---\n')}

PERGUNTA/CONTEXTO DO USUÁRIO:
${userMessage}

🎯 MISSÃO: Crie uma ANÁLISE FINAL de ${targetOutputTokens} tokens (70% do original, ≈${targetPages} páginas) com:

1. 🌍 PANORAMA GERAL: Visão holística, estrutura, objetivos
2. 📋 CONTEÚDO CONSOLIDADO: Todos os tópicos com detalhes, conceitos, dados, exemplos
3. 🔬 ANÁLISE PROFUNDA: Padrões globais, conexões, insights, avaliação crítica
4. 📊 DADOS ESTRUTURADOS: Tabelas, listas, estatísticas, referências
5. 🎯 RESPOSTA DIRETA: Resposta à pergunta do usuário, recomendações
6. 💡 INSIGHTS: Takeaways, implicações, próximos passos

⚠️ REGRAS:
- MANTENHA 70% do conteúdo (${targetPages} páginas)
- NÃO resuma excessivamente
- USE Markdown extensivamente
- PRESERVE fidelidade máxima

🎯 Target: ${targetOutputTokens} tokens (${targetPages} páginas)`;

  try {
    console.log('📡 Chamando OpenAI para consolidação final...');
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: Math.min(64000, targetOutputTokens),
        temperature: 0.2,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenAI retornou erro ${response.status}:`, errorText);
      throw new Error(`Document consolidation failed: ${response.status} - ${errorText}`);
    }
    
    if (!response.body) {
      throw new Error('OpenAI response body is null');
    }
    
    console.log('🔄 Transformando stream OpenAI → SSE');
    return transformOpenAIStreamToSSE(response.body);
    
  } catch (error) {
    console.error('❌ Erro na consolidação do documento:', error);
    throw error;
  }
};

// ============= PROCESSAMENTO PARALELO =============
const processChunksInParallel = async (
  chunks: string[],
  totalPages: number,
  openAIApiKey: string
): Promise<string[]> => {
  const batchSize = 5;
  const results: string[] = [];
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, Math.min(i + batchSize, chunks.length));
    console.log(`📦 Processando batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunks.length/batchSize)}`);
    
    const batchPromises = batch.map((chunk, idx) => 
      analyzeChunk(chunk, i + idx, chunks.length, totalPages, openAIApiKey)
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`❌ Chunk ${i + idx + 1} falhou:`, result.reason);
        throw new Error(`Chunk processing failed: ${result.reason}`);
      }
    });
    
    // Rate limiting
    if (i + batchSize < chunks.length) {
      await delay(2000);
    }
  }
  
  return results;
};

// ============= AGRUPAMENTO EM SEÇÕES =============
const groupIntoSections = (chunkAnalyses: string[], totalPages: number): string[][] => {
  let sectionsCount: number;
  if (totalPages <= 50) sectionsCount = 1;
  else if (totalPages <= 100) sectionsCount = 3;
  else if (totalPages <= 200) sectionsCount = 5;
  else if (totalPages <= 500) sectionsCount = 8;
  else sectionsCount = 12;
  
  const chunksPerSection = Math.ceil(chunkAnalyses.length / sectionsCount);
  const sections: string[][] = [];
  
  for (let i = 0; i < chunkAnalyses.length; i += chunksPerSection) {
    sections.push(chunkAnalyses.slice(i, i + chunksPerSection));
  }
  
  console.log(`📂 Agrupados ${chunkAnalyses.length} chunks em ${sections.length} seções`);
  return sections;
};

// ============= SERVIDOR PRINCIPAL =============
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, documentContent, pageCount, fileName } = await req.json();
    
    console.log(`🚀 Hierarchical RAG ativado: ${fileName} (${pageCount} páginas)`);
    console.log(`🎯 Target output: ${Math.floor(pageCount * TARGET_OUTPUT_RATIO)} páginas (70% do original)`);
    
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) throw new Error("OPENAI_API_KEY not configured");
    
    // NÍVEL 1: Chunk Analysis
    console.log("\n📊 NÍVEL 1: Chunk Analysis");
    const chunks = createAdaptiveChunks(documentContent, pageCount);
    const chunkAnalyses = await processChunksInParallel(chunks, pageCount, openAIApiKey);
    
    // NÍVEL 2: Section Synthesis
    console.log("\n🧩 NÍVEL 2: Section Synthesis");
    const sections = groupIntoSections(chunkAnalyses, pageCount);
    const sectionPromises = sections.map((section, idx) => 
      synthesizeSection(section, idx, sections.length, openAIApiKey)
    );
    const sectionSyntheses = await Promise.all(sectionPromises);
    
    // NÍVEL 3: Document Consolidation + Streaming
    console.log("\n🎯 NÍVEL 3: Document Consolidation (streaming)");
    const finalStream = await consolidateDocument(
      sectionSyntheses,
      message,
      fileName,
      pageCount,
      openAIApiKey
    );
    
    return new Response(finalStream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
    
  } catch (error: any) {
    console.error("❌ Hierarchical RAG error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Processing failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
