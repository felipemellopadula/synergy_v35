
# Plano: Tornar os Botões do Modal Responsivos

## Diagnóstico

Na imagem do modal de visualização (linhas 1171-1206 de `Image2.tsx`), os botões de ação estão em um `div` com `flex gap-2`, porém:

1. **Não há `flex-wrap`** - Os botões não quebram linha quando o espaço é reduzido
2. **Os botões têm texto fixo** - "Usar Prompt", "Download", "Compartilhar" ocupam muito espaço horizontal
3. **Não há responsividade** - Quando o menu de personagens abre, o modal fica mais estreito mas os botões mantêm o mesmo tamanho

```text
SITUAÇÃO ATUAL:
┌─────────────────────────────────────────────┐
│                  IMAGEM                     │
├─────────────────────────────────────────────┤
│ faça um gato de bigode                      │
│ [🔒] [📋 Usar Prompt] [⬇️ Download] [↗ Comp]│  ← Botões saem do container!
└─────────────────────────────────────────────┘
```

## Solução

Aplicar três correções para tornar os botões responsivos:

### 1. Adicionar `flex-wrap` para os botões quebrarem linha se necessário

### 2. Esconder texto dos botões em telas menores, mostrando apenas ícones

### 3. Reduzir tamanho dos botões em viewports estreitos

---

## Arquivo a Modificar

### `src/pages/Image2.tsx`

**Alterar linhas 1181-1201:**

De:
```tsx
<div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4 text-white">
  <p className="text-sm">{selectedImageForModal.prompt}</p>
  <div className="flex gap-2 mt-2">
    <Button 
      size="sm" 
      variant="secondary" 
      onClick={() => copyAndUsePrompt(selectedImageForModal)}
      disabled={!selectedImageForModal.prompt}
    >
      <Copy className="h-4 w-4 mr-2" />
      Usar Prompt
    </Button>
    <Button size="sm" variant="secondary" onClick={() => downloadImage(selectedImageForModal)}>
      <Download className="h-4 w-4 mr-2" />
      Download
    </Button>
    <Button size="sm" variant="secondary" onClick={() => shareImage(selectedImageForModal)}>
      <Share2 className="h-4 w-4 mr-2" />
      Compartilhar
    </Button>
  </div>
</div>
```

Para:
```tsx
<div className="absolute bottom-0 left-0 right-0 bg-black/80 p-3 sm:p-4 text-white">
  <p className="text-xs sm:text-sm line-clamp-2">{selectedImageForModal.prompt}</p>
  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
    <Button 
      size="sm" 
      variant="secondary" 
      onClick={() => copyAndUsePrompt(selectedImageForModal)}
      disabled={!selectedImageForModal.prompt}
      className="h-8 px-2 sm:px-3"
    >
      <Copy className="h-4 w-4 sm:mr-2 shrink-0" />
      <span className="hidden sm:inline">Usar Prompt</span>
    </Button>
    <Button 
      size="sm" 
      variant="secondary" 
      onClick={() => downloadImage(selectedImageForModal)}
      className="h-8 px-2 sm:px-3"
    >
      <Download className="h-4 w-4 sm:mr-2 shrink-0" />
      <span className="hidden sm:inline">Download</span>
    </Button>
    <Button 
      size="sm" 
      variant="secondary" 
      onClick={() => shareImage(selectedImageForModal)}
      className="h-8 px-2 sm:px-3"
    >
      <Share2 className="h-4 w-4 sm:mr-2 shrink-0" />
      <span className="hidden sm:inline">Compartilhar</span>
    </Button>
  </div>
</div>
```

---

## Mudanças Aplicadas

| Elemento | Antes | Depois |
|----------|-------|--------|
| Container | `p-4` | `p-3 sm:p-4` (menor padding em mobile) |
| Prompt | `text-sm` | `text-xs sm:text-sm line-clamp-2` |
| Flex de botões | `flex gap-2` | `flex flex-wrap gap-1.5 sm:gap-2` |
| Botões | Tamanho fixo | `h-8 px-2 sm:px-3` (compactos) |
| Ícones | `mr-2` | `sm:mr-2 shrink-0` (sem margem em mobile) |
| Texto | Sempre visível | `hidden sm:inline` (esconde em mobile) |

---

## Resultado Esperado

```text
TELA LARGA (menu fechado):
┌─────────────────────────────────────────────────┐
│                    IMAGEM                       │
├─────────────────────────────────────────────────┤
│ faça um gato de bigode                          │
│ [📋 Usar Prompt] [⬇️ Download] [↗ Compartilhar] │
└─────────────────────────────────────────────────┘

TELA ESTREITA (menu aberto):
┌──────────────────────────────┐
│            IMAGEM            │
├──────────────────────────────┤
│ faça um gato de bigode       │
│ [📋] [⬇️] [↗]                │  ← Só ícones, cabem!
└──────────────────────────────┘
```

Os botões agora:
- Mostram apenas ícones quando o espaço é limitado
- Podem quebrar linha se ainda assim não couberem
- Têm tamanho menor em telas estreitas
- Sempre ficam dentro dos limites da imagem
