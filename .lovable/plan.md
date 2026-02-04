
# Plano: Corrigir Resoluções do MiniMax Hailuo 2.3

## Problema

A alteração anterior estava incorreta. De acordo com a documentação da API (screenshot fornecido):
- **4:3 (Standard / Landscape) - 768p**
- **16:9 (Standard / Landscape) - 1080p**

## Correção Necessária

### Arquivo: `src/pages/Video.tsx` (linhas 152-156)

Reverter para as resoluções originais corretas:

```tsx
// De (ERRADO - alteração anterior):
"minimax:4@1": [
  { id: "16:9-768p", label: "16:9 (Landscape) - 768p", w: 1366, h: 768 },
  { id: "16:9-1080p", label: "16:9 (Landscape) - 1080p", w: 1920, h: 1080 },
],

// Para (CORRETO - conforme documentação):
"minimax:4@1": [
  { id: "4:3-768p", label: "4:3 (Standard / Landscape) - 768p", w: 1024, h: 768 },
  { id: "16:9-1080p", label: "16:9 (Standard / Landscape) - 1080p", w: 1920, h: 1080 },
],
```

## Diagnóstico Adicional

Se o MiniMax continuar não funcionando após esta correção, será necessário:
1. Testar a geração de vídeo para capturar logs da edge function
2. Verificar qual erro específico a API Runware está retornando
3. Verificar se há parâmetros adicionais que o MiniMax requer

## Resumo

| Resolução | Dimensões | Status |
|-----------|-----------|--------|
| 4:3 - 768p | 1024×768 | Corrigir (voltar ao original) |
| 16:9 - 1080p | 1920×1080 | OK (já estava correto) |

A correção reverte a alteração incorreta que fiz anteriormente.
