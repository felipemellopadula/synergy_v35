
# Plano: Remover Botão de Personagem do Lado das Fotos no Mobile

## Problema

Há dois botões "Personagem" no mobile:
1. Um ao lado das fotos (vindo do CharacterPanel da sidebar - linha 809)
2. Um acima do input (adicionado recentemente - linha 965)

O `CharacterPanel` da sidebar (linha 809) detecta que está no mobile via `useIsMobile()` e renderiza automaticamente um botão + Sheet, causando a duplicação.

## Solução

Envolver o `CharacterPanel` da sidebar (linha 809) em um `div` com `hidden lg:block` para que ele seja completamente oculto no mobile.

---

## Arquivo a Modificar

### `src/pages/Image2.tsx`

**Alterar linhas 808-839:**

De:
```tsx
{/* Character Panel - Desktop Sidebar */}
<CharacterPanel
  characters={characters}
  ...
/>
```

Para:
```tsx
{/* Character Panel - Desktop Sidebar */}
<div className="hidden lg:block">
  <CharacterPanel
    characters={characters}
    ...
  />
</div>
```

---

## Resultado

| Dispositivo | Comportamento |
|-------------|---------------|
| Desktop | Sidebar visível normalmente (lg:block) |
| Mobile | Sidebar oculta (hidden), apenas o botão acima do input é visível |

---

## Visual

```text
ANTES (Mobile):
┌─────────────────────────────────────────┐
│ [Personagem]  [Foto1] [Foto2] [Foto3]   │  ← REMOVER este botão
│                                         │
│ [Personagem]                            │  ← Manter apenas este
│ [Input: Descreva a cena...]             │
│ [Modelo] [Qualidade] [Qtd] [Gerar]      │
└─────────────────────────────────────────┘

DEPOIS (Mobile):
┌─────────────────────────────────────────┐
│ [Foto1] [Foto2] [Foto3] [Foto4]         │
│                                         │
│ [Personagem]                            │  ← Único botão
│ [Input: Descreva a cena...]             │
│ [Modelo] [Qualidade] [Qtd] [Gerar]      │
└─────────────────────────────────────────┘
```
