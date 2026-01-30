

# Plano: Corrigir Definitivamente a Borda da Sidebar

## Problema Raiz Identificado

O problema está na **linha 776** de `Image2.tsx`:

```tsx
<div className="min-h-screen flex flex-col bg-background">
```

**`min-h-screen` é o vilão!**

Quando você usa `min-height`, o elemento NÃO tem uma altura fixa definida. Isso significa que filhos com `flex-1` e `h-full` não conseguem calcular "100% de quê?" porque a altura do pai é "pelo menos 100vh" e não "exatamente 100vh".

```text
ESTRUTURA ATUAL (QUEBRADA):

┌─ div.min-h-screen ─────────────────────┐  ← min-height = NÃO é altura fixa!
│                                        │
│  ┌─ header ─────────────────────────┐  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌─ div.flex.flex-1 ────────────────┐  │  ← flex-1 = cresce, mas h-full dos 
│  │                                  │  │     filhos não sabe até onde crescer
│  │  ┌─ sidebar (h-full=???) ─────┐  │  │     
│  │  │  borda para no meio        │  │  │  
│  │  └────────────────────────────┘  │  │  
│  └──────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘
```

## Solução

Mudar de `min-h-screen` para `h-screen` E adicionar `overflow-hidden` no container raiz:

```tsx
<div className="h-screen flex flex-col bg-background overflow-hidden">
```

Isso força o container a ter EXATAMENTE 100vh, e toda a cadeia de alturas funciona corretamente.

---

## Arquivo a Modificar

### `src/pages/Image2.tsx`

**Alterar linha 776:**

De:
```tsx
<div className="min-h-screen flex flex-col bg-background">
```

Para:
```tsx
<div className="h-screen flex flex-col bg-background overflow-hidden">
```

---

## Por Que Isso Funciona

```text
ESTRUTURA CORRIGIDA:

┌─ div.h-screen ─────────────────────────┐  ← height: 100vh EXATO
│                                        │
│  ┌─ header (altura fixa) ───────────┐  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌─ div.flex.flex-1 ────────────────┐  │  ← flex-1 = pega o resto (100vh - header)
│  │  height calculada = ~90vh        │  │     
│  │                                  │  │
│  │  ┌─ sidebar (h-full) ─────────┐  │  │  ← h-full = 100% do pai = ~90vh
│  │  │  borda vai até o fim! ✓    │  │  │
│  │  └────────────────────────────┘  │  │
│  └──────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘
```

---

## Resumo das Alterações

| Arquivo | Linha | De | Para |
|---------|-------|----|----|
| `Image2.tsx` | 776 | `min-h-screen` | `h-screen overflow-hidden` |

---

## Resultado Esperado

A borda direita da sidebar irá do topo até o final da tela, sem cortar no meio.

