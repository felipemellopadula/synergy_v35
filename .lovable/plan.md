
# Plano: Corrigir Crash de Erro de Moderação no Image2

## Problema Identificado

Quando ocorre erro de moderação de conteúdo:
1. O toast é exibido corretamente
2. `throw apiError` propaga o erro
3. O `catch` captura mas não tem tratamento específico para moderação
4. O React interpreta como erro não tratado e mostra tela de crash

## Causa Raiz

O fluxo atual:
```
toast.error("Conteúdo viola políticas...")
throw apiError;  ← PROBLEMA: propaga erro para o catch que não sabe lidar
```

O catch só trata:
- `AbortError` (cancelamento)
- `insufficient_credits` (créditos)
- Todo o resto não tem tratamento específico

## Solução

Substituir `throw` por `return` após mostrar o toast de moderação. Isso encerra a função graciosamente sem propagar erro.

## Alterações em `src/pages/Image2.tsx`

### 1. Fluxo edit-image (linha ~502-503)
```tsx
// De:
toast.error("Conteúdo viola políticas de uso da IA. Mude o prompt e tente novamente.");
throw editError;

// Para:
toast.error("Conteúdo viola políticas de uso da IA. Mude o prompt e tente novamente.");
return; // Encerrar graciosamente sem propagar erro
```

### 2. Fluxo generate-image - apiError (linha ~585-586)
```tsx
// De:
toast.error("Conteúdo viola políticas de uso da IA. Mude o prompt e tente novamente.");
throw apiError;

// Para:
toast.error("Conteúdo viola políticas de uso da IA. Mude o prompt e tente novamente.");
return; // Encerrar graciosamente sem propagar erro
```

### 3. Fluxo generate-image - apiData.error (linha ~600-601)
```tsx
// De:
toast.error("Conteúdo viola políticas de uso da IA. Mude o prompt e tente novamente.");
throw new Error(apiData.error);

// Para:
toast.error("Conteúdo viola políticas de uso da IA. Mude o prompt e tente novamente.");
return; // Encerrar graciosamente sem propagar erro
```

## Resumo das Alterações

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| Image2.tsx | ~503 | `throw editError` → `return` |
| Image2.tsx | ~586 | `throw apiError` → `return` |
| Image2.tsx | ~601 | `throw new Error(...)` → `return` |

## Resultado Esperado

Quando usuário enviar prompt que viola políticas:
1. Edge function retorna erro de moderação
2. Frontend detecta o padrão no erro
3. Exibe toast: "Conteúdo viola políticas de uso da IA. Mude o prompt e tente novamente."
4. Função encerra com `return` (sem crash)
5. `finally` limpa os estados (`setIsGenerating(false)`, etc.)
6. Usuário pode reformular o prompt e tentar novamente

## Por que usar `return` em vez de `throw`?

- `throw` propaga o erro para o catch, que pode não tratá-lo adequadamente
- `return` encerra a função limpa e imediatamente
- O bloco `finally` ainda é executado com `return`, limpando estados
- Não há risco de crash ou tela de erro genérica
