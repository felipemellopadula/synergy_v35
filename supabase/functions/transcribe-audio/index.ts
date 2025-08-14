import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audio, fileName } = await req.json()
    
    if (!audio) {
      throw new Error('No audio data provided')
    }

    console.log('Transcribing audio file:', fileName)
    
    const binaryAudio = processBase64Chunks(audio)
    
    // Primeiro, fazer a transcrição básica com timestamps
    const formData = new FormData()
    const blob = new Blob([binaryAudio], { type: 'audio/webm' })
    formData.append('file', blob, fileName || 'audio.webm')
    formData.append('model', 'whisper-1')
    formData.append('timestamp_granularities[]', 'segment')
    formData.append('response_format', 'verbose_json')

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    })

    if (!transcriptionResponse.ok) {
      throw new Error(`OpenAI Whisper API error: ${await transcriptionResponse.text()}`)
    }

    const transcriptionResult = await transcriptionResponse.json()
    console.log('Whisper transcription completed')

    // Agora usar GPT-4.1-mini para separar interlocutores e melhorar a formatação
    const segments = transcriptionResult.segments || []
    let rawText = transcriptionResult.text || ''

    if (segments.length > 0) {
      rawText = segments.map((segment: any) => 
        `[${Math.floor(segment.start)}s] ${segment.text}`
      ).join('\n')
    }

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em transcrição de áudio. Sua tarefa é analisar a transcrição bruta e:

1. Identificar diferentes interlocutores/falantes
2. Separar as falas por interlocutor (Interlocutor 1, Interlocutor 2, etc.)
3. Manter os timestamps quando possível
4. Formatar o texto de forma clara e legível
5. Usar formatação markdown com títulos em negrito para os interlocutores

Formato de saída:
**Interlocutor 1** (tempo)
Texto da fala...

**Interlocutor 2** (tempo)
Texto da fala...

Se não conseguir identificar múltiplos interlocutores claramente, mantenha como um único falante mas melhore a formatação.`
          },
          {
            role: 'user',
            content: `Por favor, analise esta transcrição e separe por interlocutores com formatação adequada:\n\n${rawText}`
          }
        ],
        max_completion_tokens: 2048,
      }),
    })

    if (!gptResponse.ok) {
      throw new Error(`OpenAI GPT API error: ${await gptResponse.text()}`)
    }

    const gptResult = await gptResponse.json()
    const formattedTranscription = gptResult.choices[0].message.content

    console.log('GPT formatting completed')

    return new Response(
      JSON.stringify({ transcription: formattedTranscription }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Transcription error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})