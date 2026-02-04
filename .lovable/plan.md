
# Plano: Corrigir FPS para MiniMax Hailuo 2.3

## Problema

O modelo MiniMax Hailuo 2.3 (`minimax:4@1`) não está gerando vídeos porque está recebendo FPS incorreto.

**Documentação Runware - MiniMax Hailuo 2.3:**
- Frame rate obrigatório: **25 FPS**
- Dimensões: 1366×768 ou 1920×1080
- Durações: 6s ou 10s (768p), apenas 6s (1080p)

**Código atual:**
- `Video.tsx`: envia `fps: isLtxModel ? fps : 24` → MiniMax recebe 24 FPS (incorreto)
- `runware-video`: `getFpsForModel()` retorna 24 como padrão → MiniMax recebe 24 FPS (incorreto)

## Solução

Atualizar a lógica de FPS em ambos os arquivos para retornar 25 FPS para modelos MiniMax.

## Alterações

### 1. Edge Function `supabase/functions/runware-video/index.ts`

**Linha 114-123** - Atualizar `getFpsForModel`:

```typescript
// De:
const getFpsForModel = (model: string, customFpsValue?: number): number => {
  if (model.startsWith('lightricks:') && customFpsValue) {
    return customFpsValue;
  }
  if (model.startsWith('openai:')) {
    return 30;
  }
  return 24;  // ← MiniMax recebe 24 (ERRADO)
};

// Para:
const getFpsForModel = (model: string, customFpsValue?: number): number => {
  // LTX models: usar FPS customizado se fornecido
  if (model.startsWith('lightricks:') && customFpsValue) {
    return customFpsValue;
  }
  // OpenAI Sora: 30 FPS
  if (model.startsWith('openai:')) {
    return 30;
  }
  // MiniMax: 25 FPS obrigatório
  if (model.startsWith('minimax:')) {
    return 25;
  }
  // ByteDance e outros: 24 FPS
  return 24;
};
```

### 2. Frontend `src/pages/Video.tsx`

**Linha 1323** - Atualizar cálculo de FPS no payload:

```typescript
// De:
fps: isLtxModel ? fps : 24,

// Para:
fps: isLtxModel ? fps : modelId.startsWith('minimax:') ? 25 : 24,
```

## Dimensões do MiniMax

Verificando as resoluções configuradas (linha 153-156):

```typescript
"minimax:4@1": [
  { id: "4:3-768p", label: "4:3 (Standard / Landscape) - 768p", w: 1024, h: 768 },  // ⚠️ INCORRETO
  { id: "16:9-1080p", label: "16:9 (Landscape) - 1080p", w: 1920, h: 1080 },        // ✅ OK
],
```

A resolução 4:3 (1024×768) não é suportada pelo MiniMax! O correto seria:
- 1366×768 (16:9) 
- 1920×1080 (16:9)

**Adicionar correção de resoluções também:**

```typescript
"minimax:4@1": [
  { id: "16:9-768p", label: "16:9 (Landscape) - 768p", w: 1366, h: 768 },
  { id: "16:9-1080p", label: "16:9 (Landscape) - 1080p", w: 1920, h: 1080 },
],
```

## Resumo das Correções

| Arquivo | Problema | Correção |
|---------|----------|----------|
| runware-video/index.ts | FPS padrão 24 | Adicionar `if (model.startsWith('minimax:')) return 25` |
| Video.tsx linha 1323 | FPS hardcoded 24 | Usar `modelId.startsWith('minimax:') ? 25 : 24` |
| Video.tsx linha 153-155 | Resolução 4:3 inválida | Mudar para 16:9 (1366×768) |

## Resultado Esperado

Após as correções, o MiniMax Hailuo 2.3 receberá:
- FPS: 25 (obrigatório)
- Resoluções: 1366×768 ou 1920×1080 (válidas)
- Duração: 6s ou 10s (dependendo da resolução)
