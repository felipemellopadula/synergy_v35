
# Plano: Adicionar Toast de Política de Uso para Erros de Moderação

## Análise do Problema

Quando a API Runware (que usa Google, OpenAI, etc.) bloqueia um prompt por violar políticas de conteúdo, ela retorna um erro contendo:
- `"Invalid content detected"` 
- `"invalidProviderContent"`
- `"content moderation"`
- `"Explicit content blocked"`

Atualmente:
- **Image2.tsx**: Trata parcialmente o erro no fluxo `edit-image` (linhas 498-504), mas não no fluxo `generate-image`
- **Video.tsx**: Não tem nenhum tratamento específico para erros de moderação

## Solução

Adicionar verificação para erros de moderação em ambos os arquivos e exibir a mensagem amigável:
**"Conteúdo viola políticas de uso da IA. Mude o prompt e tente novamente."**

## Alterações Necessárias

### 1. `src/pages/Image2.tsx`

**Linha ~571-575** - Adicionar tratamento no fluxo `generate-image`:

```tsx
const { data: apiData, error: apiError } = await supabase.functions.invoke("generate-image", { body });
if (apiError) {
  console.error("Erro ao gerar imagem:", apiError);
  
  // ✅ Verificar se é erro de moderação de conteúdo
  const errorMessage = apiError.message || JSON.stringify(apiError);
  if (errorMessage.includes('Invalid content detected') || 
      errorMessage.includes('invalidProviderContent') || 
      errorMessage.includes('content moderation') || 
      errorMessage.includes('Explicit content blocked')) {
    toast.error("Conteúdo viola políticas de uso da IA. Mude o prompt e tente novamente.");
    throw apiError;
  }
  
  toast.error("IA sobrecarregada. Tente novamente mais tarde.");
  throw apiError;
}
```

**Linha ~501-503** - Atualizar mensagem no fluxo `edit-image`:

```tsx
// De:
toast.error("Conteúdo bloqueado", {
  description: "Seu prompt foi bloqueado pelo sistema de moderação. Por favor, reformule sua descrição.",
});

// Para:
toast.error("Conteúdo viola políticas de uso da IA. Mude o prompt e tente novamente.");
```

### 2. `src/pages/Video.tsx`

**Linha ~1376-1384** - Adicionar tratamento antes do throw genérico:

```tsx
if (error) {
  console.error("Edge function error:", error);
  
  // ✅ Verificar se é erro de moderação de conteúdo
  const errorMessage = error.message || JSON.stringify(error);
  if (errorMessage.includes('Invalid content detected') || 
      errorMessage.includes('invalidProviderContent') || 
      errorMessage.includes('content moderation') || 
      errorMessage.includes('Explicit content blocked')) {
    toast({ 
      title: "Conteúdo viola políticas de uso da IA", 
      description: "Mude o prompt e tente novamente.",
      variant: "destructive" 
    });
    setIsSubmitting(false);
    return;
  }
  
  throw new Error(error.message || "Erro ao chamar função de vídeo");
}

if (data?.error) {
  console.error("API error:", data.error, data.details);
  
  // ✅ Verificar se é erro de moderação de conteúdo no data.error
  const errorMessage = data.error + (data.details ? JSON.stringify(data.details) : '');
  if (errorMessage.includes('Invalid content detected') || 
      errorMessage.includes('invalidProviderContent') || 
      errorMessage.includes('content moderation') || 
      errorMessage.includes('Explicit content blocked')) {
    toast({ 
      title: "Conteúdo viola políticas de uso da IA", 
      description: "Mude o prompt e tente novamente.",
      variant: "destructive" 
    });
    setIsSubmitting(false);
    return;
  }
  
  throw new Error(data.error + (data.details ? `: ${data.details}` : ""));
}
```

## Resumo das Alterações

| Arquivo | Localização | Tipo |
|---------|-------------|------|
| Image2.tsx | Linha ~501 | Atualizar mensagem existente |
| Image2.tsx | Linha ~571 | Adicionar verificação de moderação |
| Video.tsx | Linha ~1376 | Adicionar verificação no `error` |
| Video.tsx | Linha ~1381 | Adicionar verificação no `data.error` |

## Padrões de Erro Detectados

A função de verificação procurará por:
- `"Invalid content detected"` - Mensagem geral da Runware
- `"invalidProviderContent"` - Código de erro específico
- `"content moderation"` - Referência a moderação
- `"Explicit content blocked"` - Mensagem de conteúdo explícito

## Resultado Esperado

Quando um usuário enviar um prompt que viole políticas de uso:
1. A edge function retorna erro com detalhes
2. O frontend detecta o padrão de erro de moderação
3. Exibe toast: **"Conteúdo viola políticas de uso da IA. Mude o prompt e tente novamente."**
4. O usuário entende que precisa reformular o prompt

## Considerações Técnicas

- A verificação usa `includes()` para cobrir variações de formato (maiúsculas/minúsculas, espaços, etc.)
- O erro é tratado antes do throw genérico para evitar mensagens confusas
- No Video.tsx, o `setIsSubmitting(false)` é chamado para liberar o botão
- No Video.tsx, usa `return` após o toast para não continuar o fluxo
