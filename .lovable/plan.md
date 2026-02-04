
# Plano: Diagnosticar e Corrigir Tela Preta no Mobile (Image2)

## Análise do Problema

A página `/image2` mostra uma **tela preta** no mobile, mas funciona corretamente no desktop. O dashboard (`/dashboard-novo`) funciona em ambos.

### Estrutura Identificada

O layout do Image2 é:

```text
┌─────────────────────────────────────────┐
│ Header (border-b, bg-background/95)     │
├─────────────────────────────────────────┤
│ Flex container (flex-1, overflow-hidden)│
│  ├─ CharacterPanel (hidden lg:block)    │ ← Oculto no mobile via CSS
│  └─ Main (flex-1, overflow-auto, pb-48) │ ← Conteúdo principal
├─────────────────────────────────────────┤
│ Fixed Bottom Bar (bg-black/95, z-20)    │ ← POSSÍVEL CAUSA
└─────────────────────────────────────────┘
```

### Possíveis Causas da Tela Preta

1. **Barra inferior `bg-black/95` cobrindo todo o conteúdo**: No mobile, a barra inferior fixa pode estar com altura 100% ou posicionamento incorreto

2. **Erro de JavaScript durante carregamento de hooks**: Os hooks `useCharacters` e `useMoodboards` podem lançar erros silenciosos que impedem a renderização

3. **`pb-48` insuficiente**: O padding-bottom pode não ser suficiente para compensar a barra fixa no mobile

4. **Componente `CharacterPanel` no mobile (linha 974)**: Mesmo renderizando apenas um botão, pode estar com CSS que expande para 100% da tela

5. **Problema com `overflow-hidden` no container principal**: Pode estar cortando o conteúdo visível

---

## Solução: Adicionar Console Logs de Diagnóstico

### Logs a adicionar em `src/pages/Image2.tsx`

**1. No início do componente (após hooks):**
```tsx
console.log("[Image2] Componente renderizando...");
console.log("[Image2] user:", !!user);
console.log("[Image2] isLoadingCharacters:", isLoadingCharacters);
console.log("[Image2] isLoadingMoodboards:", isLoadingMoodboards);
console.log("[Image2] isLoadingHistory:", isLoadingHistory);
console.log("[Image2] images.length:", images.length);
console.log("[Image2] window.innerWidth:", typeof window !== 'undefined' ? window.innerWidth : 'SSR');
```

**2. Antes do return (para confirmar que chega até lá):**
```tsx
console.log("[Image2] Chegou ao return - vai renderizar UI");
```

**3. Verificar erros dos hooks no catch do loadSavedImages:**
```tsx
console.error("[Image2] Erro ao carregar imagens:", error);
console.error("[Image2] Erro completo:", JSON.stringify(error, null, 2));
```

### Logs a adicionar em `src/components/image/CharacterPanel.tsx`

**No início do componente principal:**
```tsx
console.log("[CharacterPanel] Renderizando...");
console.log("[CharacterPanel] isMobile:", isMobile);
console.log("[CharacterPanel] window.innerWidth:", typeof window !== 'undefined' ? window.innerWidth : 'SSR');
```

**Se for mobile (dentro do bloco if isMobile):**
```tsx
console.log("[CharacterPanel] Modo mobile - renderizando botão trigger");
```

### Correção Preventiva: Garantir Visibilidade no Mobile

Adicionar classes de segurança para garantir que o container principal não fique invisível:

**No main container:**
```tsx
<main className="flex-1 overflow-auto p-4 pb-48 min-h-[200px]">
```

**No container flexível:**
```tsx
<div className="flex flex-1 overflow-hidden min-h-0">
```

---

## Alterações em `src/pages/Image2.tsx`

| Linha | Alteração |
|-------|-----------|
| Após linha 118 (após hooks) | Adicionar console.logs de diagnóstico |
| Linha 274 (catch loadSavedImages) | Expandir log de erro |
| Antes da linha 775 (antes do return) | Adicionar log "chegou ao return" |
| Linha 776 | Adicionar fallback de emergência para erro |
| Linha 807 | Adicionar `min-h-0` ao flex container |
| Linha 844 | Adicionar `min-h-[200px]` ao main |

---

## Alterações em `src/components/image/CharacterPanel.tsx`

| Linha | Alteração |
|-------|-----------|
| Após linha 699 (após isMobile) | Adicionar console.log de diagnóstico |
| Linha 702 (if isMobile) | Adicionar log "modo mobile" |

---

## Código Final das Alterações

### Image2.tsx - Após hooks (linha ~118)

```tsx
// ✅ DEBUG: Logs de diagnóstico para mobile
console.log("[Image2] Componente renderizando...");
console.log("[Image2] Estados:", {
  user: !!user,
  isLoadingCharacters,
  isLoadingMoodboards,
  isLoadingHistory,
  imagesCount: images.length,
  windowWidth: typeof window !== 'undefined' ? window.innerWidth : 'SSR',
  isMobileViewport: typeof window !== 'undefined' ? window.innerWidth < 768 : 'SSR',
});
```

### Image2.tsx - Antes do return (linha ~775)

```tsx
console.log("[Image2] Chegou ao return - renderizando UI");
```

### Image2.tsx - Container principal (linha ~807)

```tsx
<div className="flex flex-1 overflow-hidden min-h-0">
```

### Image2.tsx - Main container (linha ~844)

```tsx
<main className="flex-1 overflow-auto p-4 pb-48 min-h-[200px]">
```

### CharacterPanel.tsx - Após isMobile (linha ~700)

```tsx
console.log("[CharacterPanel] Renderizando - isMobile:", isMobile);
console.log("[CharacterPanel] windowWidth:", typeof window !== 'undefined' ? window.innerWidth : 'SSR');
```

---

## Fluxo de Diagnóstico

```text
[Navega para /image2 no mobile]
         |
         v
[Console: "[Image2] Componente renderizando..."]
         |
         v
[Console: "[Image2] Estados: {...}"]
         |
         v
[Console: "[CharacterPanel] Renderizando - isMobile: true"]
         |
         v
[Console: "[Image2] Chegou ao return"]
         |
         v
[Se tela preta → verificar se logs apareceram]
   - Se NÃO apareceram → Erro antes do render
   - Se apareceram → Problema é CSS, não JavaScript
```

---

## Resultado Esperado

1. Console logs revelarão exatamente onde o fluxo para ou qual valor está incorreto
2. Identificar se é problema de **JavaScript** (erro) ou **CSS** (elemento invisível)
3. Correções de `min-h-0` e `min-h-[200px]` previnem alguns problemas de layout flex
4. Se os logs indicarem que tudo está correto, o problema é puramente visual (CSS)
