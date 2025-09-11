import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as b64encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RUNWARE_API_KEY = Deno.env.get('RUNWARE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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

    // Obter usuário autenticado a partir do JWT para vincular a imagem
    const authHeader = req.headers.get('Authorization') ?? '';
    let userId: string | null = null;
    if (SUPABASE_URL && SUPABASE_ANON_KEY && authHeader) {
      try {
        const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await supabaseAuth.auth.getUser();
        userId = user?.id ?? null;
      } catch (e) {
        console.warn('Não foi possível obter o usuário:', e);
      }
    }

    const model: string = (typeof body.model === 'string' && body.model.trim()) ? body.model : 'runware:100@1';
    
    // Resolver dimensões baseado no modelo
    let width = 1024;
    let height = 1024;
    
    // Modelos Google (como google:4@1 - Gemini Flash) não suportam width/height
    const isGoogleModel = model.startsWith('google:');
    // Modelos que suportam dimensões altas
    const isHighResModel = model === 'bytedance:5@0' || model === 'ideogram:4@1' || model === 'bfl:3@1';
    
    if (!isGoogleModel) {
      // Apenas definir dimensões para modelos que suportam
      if (typeof body.size === 'string' && /^(\d+)x(\d+)$/.test(body.size)) {
        const [w, h] = body.size.split('x').map((v: string) => parseInt(v, 10));
        if (Number.isFinite(w) && Number.isFinite(h)) {
          width = w; height = h;
        }
      } else {
        // Definir limites baseados no modelo
        const maxDimension = isHighResModel ? 8192 : 2048;
        if (Number.isFinite(body.width)) width = Math.max(64, Math.min(maxDimension, Number(body.width)));
        if (Number.isFinite(body.height)) height = Math.max(64, Math.min(maxDimension, Number(body.height)));
      }
    }

    const numberResults: number = Math.max(1, Math.min(4, Number(body.numberResults) || 1));
    // A Runware costuma retornar WEBP por padrão; manter WEBP para desempenho
    const outputFormat: string = (typeof body.outputFormat === 'string' && body.outputFormat) || 'WEBP';

    const taskUUID = crypto.randomUUID();

    // Montar payload para Runware, evitando "strength" em GPT-Image-1
    const attach: any = {};
    if (body.inputImage) {
      attach.inputImage = body.inputImage;
      // "strength" NÃO é suportado na arquitetura gpt_image_1 (GPT-Image-1)
      if (model !== 'openai:1@1' && typeof body.strength === 'number') {
        attach.strength = body.strength;
      }
    }

    // Preparar o objeto de inferência baseado no modelo
    const inferenceObject: any = {
      taskType: 'imageInference',
      taskUUID,
      positivePrompt: prompt,
      model,
      numberResults,
      outputFormat,
      ...attach,
    };

    // Apenas adicionar width/height para modelos que suportam
    if (!isGoogleModel) {
      inferenceObject.width = width;
      inferenceObject.height = height;
    }

    const tasks: any[] = [
      { taskType: 'authentication', apiKey: RUNWARE_API_KEY },
      inferenceObject,
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

    // Salvar no Storage e registrar no banco se o usuário estiver autenticado
    if (userId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const ext = (format || 'webp').toLowerCase();
        const path = `user-images/${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        const upload = await supabaseAdmin.storage.from('images').upload(path, new Uint8Array(ab), { contentType });
        if (upload.error) {
          console.error('Erro upload Storage:', upload.error);
        } else {
          const { error: insertErr } = await supabaseAdmin
            .from('user_images')
            .insert({ user_id: userId, image_path: path, prompt, width, height, format: ext });
          if (insertErr) console.error('Erro ao inserir user_images:', insertErr);
        }
      } catch (e) {
        console.error('Falha ao salvar imagem do usuário:', e);
      }
    }

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