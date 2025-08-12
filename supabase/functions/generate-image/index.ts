import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as b64encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const RUNWARE_API_KEY = Deno.env.get('RUNWARE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RUNWARE_API_KEY) throw new Error('RUNWARE_API_KEY não configurada');

    const body = await req.json().catch(() => ({}));

    const prompt: string | undefined = body.prompt ?? body.positivePrompt;
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros inválidos: prompt ausente' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resolver dimensões
    let width = 1024;
    let height = 1024;
    if (typeof body.size === 'string' && /^(\d+)x(\d+)$/.test(body.size)) {
      const [w, h] = body.size.split('x').map((v: string) => parseInt(v, 10));
      if (Number.isFinite(w) && Number.isFinite(h)) {
        width = w; height = h;
      }
    } else {
      if (Number.isFinite(body.width)) width = Math.max(64, Math.min(2048, Number(body.width)));
      if (Number.isFinite(body.height)) height = Math.max(64, Math.min(2048, Number(body.height)));
    }

    const model: string = (typeof body.model === 'string' && body.model.trim()) ? body.model : 'runware:100@1';
    const numberResults: number = Math.max(1, Math.min(4, Number(body.numberResults) || 1));
    // A Runware costuma retornar WEBP por padrão; manter WEBP para desempenho
    const outputFormat: string = (typeof body.outputFormat === 'string' && body.outputFormat) || 'WEBP';

    const taskUUID = crypto.randomUUID();

    const tasks: any[] = [
      { taskType: 'authentication', apiKey: RUNWARE_API_KEY },
      {
        taskType: 'imageInference',
        taskUUID,
        positivePrompt: prompt,
        width,
        height,
        model,
        numberResults,
        outputFormat,
        // Se veio imagem base64 para variação, repassar
        ...(body.inputImage ? { inputImage: body.inputImage, strength: typeof body.strength === 'number' ? body.strength : 0.8 } : {}),
      },
    ];

    const rwRes = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tasks),
    });

    if (!rwRes.ok) {
      const err = await rwRes.text();
      console.error('Runware error:', err);
      return new Response(
        JSON.stringify({ error: 'Falha ao gerar imagem (Runware)', details: err }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rwData = await rwRes.json();
    const dataArray = Array.isArray(rwData?.data) ? rwData.data : (Array.isArray(rwData) ? rwData : []);

    const item = dataArray.find((d: any) => d?.taskType === 'imageInference' && (d.imageURL || d.imageUrl || d.image_url));
    const imageURL: string | undefined = item?.imageURL || item?.imageUrl || item?.image_url;

    if (!imageURL) {
      console.error('Resposta Runware inesperada:', rwData);
      return new Response(
        JSON.stringify({ error: 'Resposta inválida da Runware' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Baixar imagem e retornar em base64 para compatibilidade com o front
    const imgRes = await fetch(imageURL);
    if (!imgRes.ok) {
      const t = await imgRes.text();
      console.error('Falha ao baixar imagem Runware:', t);
      return new Response(
        JSON.stringify({ error: 'Falha ao baixar a imagem gerada', details: t }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ab = await imgRes.arrayBuffer();
    const b64 = b64encode(new Uint8Array(ab));

    // Inferir formato a partir da URL
    let format: string | undefined = undefined;
    if (imageURL.endsWith('.webp')) format = 'webp';
    else if (imageURL.endsWith('.png')) format = 'png';
    else if (imageURL.endsWith('.jpg')) format = 'jpg';
    else if (imageURL.endsWith('.jpeg')) format = 'jpeg';

    return new Response(
      JSON.stringify({ image: b64, url: imageURL, width, height, format }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erro na função generate-image (Runware):', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Erro inesperado' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});