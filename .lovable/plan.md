

# Plano: Adicionar Funcionalidade para Fechar/Ocultar o Painel de Personagens

## Resumo do Objetivo

Adicionar um botão de fechar (X) no painel lateral de "Personagens" na página de Imagem, permitindo que o usuário oculte a sidebar e tenha mais espaço para visualizar as imagens geradas. Também será adicionado um botão para reabrir o painel quando estiver fechado.

---

## Análise do Estado Atual

### Painel de Personagens (`CharacterPanel`)
- **Desktop**: Renderizado como sidebar fixa de 280px sempre visível (linha 673-677)
- **Mobile**: Renderizado como Sheet (drawer) com botão trigger (já possui controle de abrir/fechar)
- **Problema**: No desktop, não existe forma de ocultar o painel

### Estrutura em `Image2.tsx`
- O `CharacterPanel` é renderizado diretamente no layout sem controle de visibilidade
- Mobile: linha 763-780 (dentro do header)
- Desktop: linha 789-806 (sidebar fixa)

---

## Solução Proposta

### Abordagem 1: Controle de visibilidade via prop

Modificar o componente `CharacterPanel` para aceitar props de controle externo:
- `isOpen` - controla se o painel está visível
- `onClose` - callback para fechar o painel
- Adicionar botão de fechar (X) no header do painel

Modificar `Image2.tsx` para:
- Adicionar estado `showCharacterPanel` 
- Adicionar botão para reabrir quando fechado

---

## Arquivos a Modificar

### 1. `src/components/image/CharacterPanel.tsx`

**Alterações na interface:**
```typescript
interface CharacterPanelProps {
  // ... props existentes
  isOpen?: boolean;        // NOVO: controle externo de visibilidade (desktop)
  onClose?: () => void;    // NOVO: callback para fechar
  onOpen?: () => void;     // NOVO: callback para abrir (botão externo)
}
```

**Alterações no componente desktop (linhas 672-677):**

Adicionar animação de slide e botão de fechar no header:

```typescript
// Desktop: Sidebar colapsável com controle
return (
  <>
    {/* Botão para reabrir quando fechado */}
    {!props.isOpen && (
      <Button
        variant="ghost"
        size="sm"
        className="hidden lg:flex fixed left-0 top-1/2 -translate-y-1/2 z-40 
                   bg-card border shadow-lg rounded-l-none rounded-r-lg h-auto py-3"
        onClick={props.onOpen}
      >
        <User className="h-4 w-4" />
        <ChevronRight className="h-4 w-4" />
      </Button>
    )}
    
    {/* Sidebar com animação */}
    <div className={cn(
      "hidden lg:flex flex-col border-r bg-card/50 shrink-0 transition-all duration-300",
      props.isOpen ? "w-[280px]" : "w-0 overflow-hidden"
    )}>
      <CharacterPanelContent {...props} />
    </div>
  </>
);
```

**Alterações no `CharacterPanelContent` (linha 516-524):**

Adicionar botão X no header:

```typescript
{/* Header */}
<div className="p-4 border-b">
  <div className="flex items-center justify-between">
    <h2 className="font-semibold text-lg flex items-center gap-2">
      <User className="h-5 w-5" />
      Personagens
    </h2>
    {/* Botão fechar - apenas desktop */}
    {props.onClose && (
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 -mr-2"
        onClick={props.onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    )}
  </div>
  <p className="text-xs text-muted-foreground mt-1">
    Mantenha consistência visual nas gerações
  </p>
</div>
```

### 2. `src/pages/Image2.tsx`

**Adicionar estado (após linha ~100):**
```typescript
const [showCharacterPanel, setShowCharacterPanel] = useState(true);
```

**Atualizar renderização do CharacterPanel desktop (linhas 789-806):**
```typescript
{/* Character Panel - Desktop Sidebar */}
<CharacterPanel
  characters={characters}
  selectedCharacter={selectedCharacter}
  characterImages={characterImages}
  isLoading={isLoadingCharacters}
  isUploadingImages={isUploadingImages}
  useMasterAvatar={useMasterAvatar}
  onUseMasterAvatarChange={setUseMasterAvatar}
  onSelectCharacter={selectCharacter}
  onCreateCharacter={createCharacter}
  onUpdateCharacter={updateCharacter}
  onDeleteCharacter={deleteCharacter}
  onAddImages={addCharacterImages}
  onRemoveImage={removeCharacterImage}
  onGenerateMasterAvatar={generateMasterAvatar}
  isOpen={showCharacterPanel}
  onClose={() => setShowCharacterPanel(false)}
  onOpen={() => setShowCharacterPanel(true)}
/>
```

---

## Comportamento Visual

| Estado | Desktop | Mobile |
|--------|---------|--------|
| Aberto | Sidebar 280px com botão X no canto | Sheet deslizante (já funciona) |
| Fechado | Botão flutuante na lateral esquerda para reabrir | Botão "Personagem" no header |

---

## Animações

- **Fechar**: Transição suave de `w-[280px]` para `w-0` com `transition-all duration-300`
- **Abrir**: Transição inversa
- **Botão reabrir**: Aparece na lateral esquerda com ícone de usuário + seta

---

## Ordem de Implementação

1. Modificar interface de `CharacterPanelProps` para aceitar novas props
2. Atualizar `CharacterPanelContent` para mostrar botão X no header
3. Atualizar renderização desktop do `CharacterPanel` com animação e botão de reabrir
4. Adicionar estado `showCharacterPanel` em `Image2.tsx`
5. Passar novas props para os componentes

---

## Resultado Esperado

- O usuário poderá clicar no **X** no canto do painel de Personagens para fechá-lo
- Quando fechado, aparecerá um **botão flutuante** na lateral esquerda da tela
- Ao clicar no botão flutuante, o painel reabre com animação suave
- No mobile, o comportamento permanece inalterado (já funciona como Sheet)

