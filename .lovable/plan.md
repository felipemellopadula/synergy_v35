
# Plano: Corrigir Detecção de Erro de Moderação

## Diagnóstico

Identifiquei a causa raiz do problema analisando a resposta de rede:

```json
{
  "error": "Falha ao gerar imagem (Runware)",
  "details": "{\n    \"errors\": [\n        {\n            \"code\": \"invalidProviderContent\",\n            \"message\": \"Invalid content detected...\"
}
```

### O que está acontecendo:

1. Quando a edge function retorna status 500, o Supabase client cria um objeto `FunctionsHttpError`
2. O `apiError.message` **NÃO contém** os detalhes do erro - apenas a mensagem genérica do Supabase
3. O corpo da resposta (com `invalidProviderContent`) fica em `apiError.context` e precisa ser parseado
4. Atualmente o código verifica `apiError.message` que não tem a string `invalidProviderContent`
5. A verificação falha → mostra "IA sobrecarregada" → depois faz `throw` → crash

### Solução:

Extrair o corpo do erro usando `await apiError.context.json()` antes de verificar os padrões de moderação.

## Alterações em `src/pages/Image2.tsx`

### 1. Fluxo generate-image (linha ~579-591)

```tsx
// De:
if (apiError) {
  console.error("Erro ao gerar imagem:", apiError);
  
  const errorMessage = apiError.message || JSON.stringify(apiError);
  if (isContentModerationError(errorMessage)) {
    toast.error("Conteúdo viola políticas de uso da IA. Mude o prompt e tente novamente.");
    return;
  }
  
  toast.error("IA sobrecarregada. Tente novamente mais tarde.");
  throw apiError;
}

// Para:
if (apiError) {
  console.error("Erro ao gerar imagem:", apiError);
  
  // Extrair corpo do erro HTTP (FunctionsHttpError contém context com o body)
  let errorDetails = apiError.message || '';
  try {
    if (apiError.context) {
      const errorBody = await apiError.context.json();
      errorDetails = JSON.stringify(errorBody);
    }
  } catch (e) {
    console.log("Não foi possível parsear erro:", e);
  }
  
  if (isContentModerationError(errorDetails)) {
    toast.error("Conteúdo viola políticas de uso da IA. Mude o prompt e tente novamente.");
    return;
  }
  
  toast.error("IA sobrecarregada. Tente novamente mais tarde.");
  throw apiError;
}
```

### 2. Fluxo edit-image (linha ~493-516)

```tsx
// De:
if (editError) {
  console.error("Erro detalhado ao editar imagem:", editError);
  
  const errorMessage = editError.message || JSON.stringify(editError);
  if (errorMessage.includes('Invalid content detected') ||
      // ...
  
// Para:
if (editError) {
  console.error("Erro detalhado ao editar imagem:", editError);
  
  // Extrair corpo do erro HTTP (FunctionsHttpError contém context com o body)
  let errorMessage = editError.message || '';
  try {
    if (editError.context) {
      const errorBody = await editError.context.json();
      errorMessage = JSON.stringify(errorBody);
    }
  } catch (e) {
    console.log("Não foi possível parsear erro:", e);
  }
  
  if (errorMessage.includes('Invalid content detected') ||
      // ...
```

## Resumo Técnico

| Problema | Solução |
|----------|---------|
| `apiError.message` não contém `invalidProviderContent` | Usar `apiError.context.json()` para obter o body |
| Body é string JSON aninhada | `JSON.stringify()` achata para busca com `includes()` |
| Verificação falha → throw → crash | Com extração correta, `return` é executado antes do throw |

## Por que isso funciona?

Quando a edge function retorna:
```typescript
return new Response(JSON.stringify({ 
  error: "Falha ao gerar imagem (Runware)", 
  details: "{...invalidProviderContent...}" 
}), { status: 500 });
```

O Supabase client:
1. Cria `FunctionsHttpError` 
2. Armazena a `Response` em `error.context`
3. O body fica disponível via `error.context.json()`

Com a correção:
1. Parseamos o body com `await apiError.context.json()`
2. Convertemos para string com `JSON.stringify()` 
3. `includes('invalidProviderContent')` agora encontra o padrão
4. Toast correto é exibido
5. `return` encerra sem crash
