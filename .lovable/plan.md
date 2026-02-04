
# Correção: Dimensões do MiniMax Hailuo 2.3

## Problema Identificado

O código está usando dimensões incorretas para a opção "4:3 - 768p":

| Opção | Código Atual (ERRADO) | API Runware (CORRETO) |
|-------|----------------------|----------------------|
| 4:3 - 768p | 1024×768 | **1366×768** |
| 16:9 - 1080p | 1920×1080 | 1920×1080 ✓ |

## Alteração Necessária

### Arquivo: `src/pages/Video.tsx` (linhas 152-155)

```typescript
// De (ERRADO):
"minimax:4@1": [
  { id: "4:3-768p", label: "4:3 (Standard / Landscape) - 768p", w: 1024, h: 768 },
  { id: "16:9-1080p", label: "16:9 (Standard / Landscape) - 1080p", w: 1920, h: 1080 },
],

// Para (CORRETO - conforme imagens da API):
"minimax:4@1": [
  { id: "4:3-768p", label: "4:3 (Standard / Landscape) - 768p", w: 1366, h: 768 },
  { id: "16:9-1080p", label: "16:9 (Standard / Landscape) - 1080p", w: 1920, h: 1080 },
],
```

## Resumo

A única mudança é: `w: 1024` → `w: 1366` na primeira opção de resolução.

O label continua "4:3 (Standard / Landscape) - 768p" conforme a interface da Runware, mas as dimensões reais são 1366×768.
