
# Plano: Adicionar Console Logs para Diagnosticar Erro de Edge Function ao Anexar Imagem

## Análise do Fluxo

Quando o usuário anexa uma imagem (frame inicial) e solicita um vídeo, o fluxo é:

1. **Frontend (Video.tsx)**: `uploadImage` comprime e faz upload para bucket `video-refs`
2. **Frontend (Video.tsx)**: `startGeneration` envia payload com `frameStartUrl` para edge function
3. **Edge Function (runware-video)**: Recebe payload e monta `frameImages` array
4. **Edge Function (runware-video)**: Envia para API Runware

## Possíveis Causas do Erro

1. **URL da imagem inválida ou inacessível** - A URL do Supabase Storage pode não estar acessível pela Runware
2. **Formato de frameImages incorreto** - A API Runware pode estar rejeitando o formato
3. **Modelo não suporta frame de referência** - Alguns modelos podem não aceitar `frameImages`
4. **Erro no upload da imagem** - A imagem pode não ter sido carregada corretamente

## Console Logs a Adicionar

### 1. Frontend - `src/pages/Video.tsx`

#### No `uploadImage` (após linha 909):
```tsx
console.log("[Video] Upload da imagem concluído. URL:", publicData.publicUrl);
console.log("[Video] isStart:", isStart, "tipo:", isStart ? "frameStartUrl" : "frameEndUrl");
```

#### No `startGeneration` (antes da linha 1345):
```tsx
console.log("[Video] startGeneration payload:", JSON.stringify({
  action: "start",
  modelId,
  positivePrompt: prompt?.substring(0, 50),
  width: res.w,
  height: res.h,
  duration,
  frameStartUrl: frameStartUrl || "(vazio)",
  frameEndUrl: frameEndUrl || "(vazio)",
  hasMotionTransfer: supportsMotionTransfer && !!referenceVideoUrl,
}, null, 2));
```

#### No catch do `startGeneration` (linha 1378):
```tsx
console.error("[Video] startGeneration ERRO COMPLETO:", {
  message: e?.message,
  name: e?.name,
  stack: e?.stack,
  fullError: e,
});
```

### 2. Edge Function - `supabase/functions/runware-video/index.ts`

#### Após receber o body (após linha 37):
```tsx
console.log("[runware-video] Body completo recebido:", JSON.stringify({
  action: body.action,
  modelId: body.modelId,
  hasFrameStartUrl: !!body.frameStartUrl,
  frameStartUrl: body.frameStartUrl?.substring(0, 100),
  hasFrameEndUrl: !!body.frameEndUrl,
  promptPreview: body.positivePrompt?.substring(0, 50),
}, null, 2));
```

#### Após montar frameImages (após linha 201):
```tsx
console.log("[runware-video] frameImages montado:", JSON.stringify(frameImages, null, 2));
```

#### No catch do makeRequest (linha 240-248):
```tsx
console.error("[runware-video] makeRequest ERRO DETALHADO:", {
  errorMessage: makeRequestError instanceof Error ? makeRequestError.message : String(makeRequestError),
  errorName: makeRequestError instanceof Error ? makeRequestError.name : "Unknown",
  errorStack: makeRequestError instanceof Error ? makeRequestError.stack : undefined,
});
```

#### Após resposta da Runware (linha 251):
```tsx
console.log("[runware-video] Resposta Runware STATUS:", res.status);
console.log("[runware-video] Resposta Runware JSON:", JSON.stringify(json, null, 2));
```

## Resumo das Alterações

| Arquivo | Localização | Alteração |
|---------|-------------|-----------|
| Video.tsx | `uploadImage` (após linha 909) | Log da URL e tipo de upload |
| Video.tsx | `startGeneration` (antes linha 1345) | Log do payload completo |
| Video.tsx | catch `startGeneration` (linha 1378) | Log detalhado do erro |
| runware-video/index.ts | Após linha 37 | Log do body recebido |
| runware-video/index.ts | Após linha 201 | Log do frameImages |
| runware-video/index.ts | Linhas 240-248 | Log detalhado do erro |
| runware-video/index.ts | Após linha 251 | Log completo da resposta |

## Fluxo de Diagnóstico Esperado

```text
[Frontend] Upload da imagem → Log URL
         |
         v
[Frontend] startGeneration → Log payload com frameStartUrl
         |
         v
[Edge Function] Recebe body → Log body completo
         |
         v
[Edge Function] Monta frameImages → Log frameImages array
         |
         v
[Edge Function] Chama Runware → Log resposta/erro
         |
         v
[Frontend] Recebe resposta/erro → Log detalhado
```

## Resultado Esperado

Com esses logs, será possível identificar exatamente onde o erro ocorre:
1. Se a URL da imagem está correta
2. Se o payload está sendo enviado corretamente
3. Se a edge function está recebendo os dados
4. Se a API Runware está retornando erro e qual erro específico
5. Se o frontend está tratando o erro corretamente
