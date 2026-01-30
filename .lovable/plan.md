

# Plano: Corrigir Altura da Sidebar de Personagens

## Problema Real

A correção anterior adicionou `h-full` no wrapper em `Image2.tsx`, mas o próprio componente `CharacterPanel.tsx` não está propagando a altura corretamente.

Na **linha 751-754** do `CharacterPanel.tsx`:
```tsx
<div className={cn(
  "hidden lg:flex flex-col border-r bg-card/50 shrink-0 transition-all duration-300 overflow-hidden",
  isPanelOpen ? "w-[280px]" : "w-0"
)}>
```

O `div` da sidebar não tem `h-full`, então a altura colapsa para o tamanho do conteúdo.

## Solução

Adicionar `h-full` à classe do `div` da sidebar dentro do `CharacterPanel.tsx`.

---

## Arquivo a Modificar

### `src/components/image/CharacterPanel.tsx`

**Alterar linha 752:**

De:
```tsx
"hidden lg:flex flex-col border-r bg-card/50 shrink-0 transition-all duration-300 overflow-hidden",
```

Para:
```tsx
"hidden lg:flex flex-col h-full border-r bg-card/50 shrink-0 transition-all duration-300 overflow-hidden",
```

---

## Fluxo de Altura Corrigido

```text
┌─ div.flex.flex-1.overflow-hidden (Image2.tsx)
│
├─── div.hidden.lg:block.h-full (wrapper - já corrigido)
│    │
│    └─── CharacterPanel
│         │
│         └─── div.hidden.lg:flex.flex-col.h-full.border-r  ← ADICIONAR h-full
│              │
│              └─── CharacterPanelContent
│                   ▼ borda vai até o final ▼
```

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| Borda termina no fim do conteúdo | Borda vai até o final da página |

