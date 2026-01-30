

# Plano: Fazer a Borda da Sidebar de Personagens ir até o Final da Página

## Problema Identificado

A linha vertical (border-r) do painel de personagens não vai até o final da página porque:

1. **`src/pages/Image2.tsx` linha 809**: O `<div className="hidden lg:block">` que envolve o `CharacterPanel` não tem altura definida
2. **`CharacterPanel.tsx` linha 752**: A sidebar tem a classe correta `flex-col border-r` mas precisa que o container pai tenha altura completa

## Solução

Adicionar `h-full` ao wrapper div que envolve o `CharacterPanel` na página Image2.tsx, para que ele ocupe toda a altura disponível do flex container pai.

---

## Arquivo a Modificar

### `src/pages/Image2.tsx`

**Alterar linha 809:**

De:
```tsx
<div className="hidden lg:block">
```

Para:
```tsx
<div className="hidden lg:block h-full">
```

---

## Fluxo de Altura

```text
┌─ div.flex.flex-1.overflow-hidden (linha 807)     ← flex container, height: 100%
│
├─── div.hidden.lg:block.h-full                     ← ADICIONAR h-full aqui
│    └─── CharacterPanel
│         └─── div.flex.flex-col.border-r           ← sidebar com borda direita
│              ▼ agora herdará altura completa ▼
│
└─── main.flex-1.overflow-auto                      ← grid de imagens
```

---

## Resultado

| Antes | Depois |
|-------|--------|
| Borda termina junto com o conteúdo | Borda vai até o final da página |
| Sidebar não ocupa altura completa | Sidebar ocupa 100% da altura disponível |

