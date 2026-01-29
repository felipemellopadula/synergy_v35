
# Plano: Corrigir Largura do Input de Prompt Quando Painel de Personagens é Colapsado

## Problema Identificado

Quando o CharacterPanel é colapsado (fechado), a barra inferior com o prompt permanece com uma margem esquerda fixa de 280px, causando o efeito "espremido" que você observou.

**Causa raiz:**

```tsx
// Linha 949 de Image2.tsx
<div className="fixed bottom-0 left-0 right-0 ... lg:ml-[280px]">
```

Esta margem é **estática** e não considera o estado do painel (`showCharacterPanel`).

---

## Solução

Tornar a margem esquerda dinâmica, condicionada ao estado `showCharacterPanel`:

```text
Quando showCharacterPanel = true  → lg:ml-[280px] (painel aberto)
Quando showCharacterPanel = false → lg:ml-0 (painel fechado)
```

---

## Arquivo a Modificar

### `src/pages/Image2.tsx`

**Linha 949** - Adicionar margem condicional:

De:
```tsx
<div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-white/10 shadow-2xl z-20 lg:ml-[280px]">
```

Para:
```tsx
<div className={cn(
  "fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-white/10 shadow-2xl z-20 transition-all duration-300",
  showCharacterPanel ? "lg:ml-[280px]" : "lg:ml-0"
)}>
```

---

## Benefícios da Correção

| Estado do Painel | Margem Esquerda | Resultado |
|------------------|-----------------|-----------|
| Aberto (280px) | `lg:ml-[280px]` | Prompt alinhado com o painel |
| Fechado (0px) | `lg:ml-0` | Prompt ocupa largura total |

---

## Resultado Esperado

- Quando você colapsar o painel de personagens, a barra de prompt se expandirá suavemente para ocupar toda a largura disponível
- A transição será animada (`transition-all duration-300`) para ser consistente com a animação do painel
- O input não ficará mais "espremido" quando o painel estiver fechado
