
# Plano: Adicionar Botão de Personagem Acima do Input no Mobile

## Objetivo

Colocar o botão de acesso ao painel de personagens no espaço acima do campo de prompt, visível apenas no mobile.

## Estrutura Atual (Mobile)

```text
┌─────────────────────────────────────────┐
│ Chat Bar (bottom)                       │
│ ┌─────────────────────────────────────┐ │
│ │ [Badges de personagem/moodboard]    │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ [Input: Descreva a cena...]         │ │
│ └─────────────────────────────────────┘ │
│ [Modelo] [Qualidade] [Qtd] [Gerar]      │
└─────────────────────────────────────────┘
```

## Estrutura Proposta (Mobile)

```text
┌─────────────────────────────────────────┐
│ Chat Bar (bottom)                       │
│ ┌─────────────────────────────────────┐ │
│ │ [Badges de personagem/moodboard]    │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 👤 Personagem     (NOVO - mobile)   │ │  ← Botão adicionado
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ [Input: Descreva a cena...]         │ │
│ └─────────────────────────────────────┘ │
│ [Modelo] [Qualidade] [Qtd] [Gerar]      │
└─────────────────────────────────────────┘
```

---

## Arquivo a Modificar

### `src/pages/Image2.tsx`

**Adicionar após o bloco de badges (linha ~963) e antes do preview de arquivos:**

```tsx
{/* Botão de personagem para mobile - acima do input */}
<div className="lg:hidden mb-3">
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
    // Moodboard props
    moodboards={moodboards}
    selectedMoodboard={selectedMoodboard}
    moodboardImages={moodboardImages}
    isLoadingMoodboards={isLoadingMoodboards}
    isUploadingMoodboardImages={isUploadingMoodboardImages}
    onSelectMoodboard={selectMoodboard}
    onCreateMoodboard={createMoodboard}
    onUpdateMoodboard={updateMoodboardData}
    onDeleteMoodboard={deleteMoodboard}
    onAddMoodboardImages={addMoodboardImages}
    onRemoveMoodboardImage={removeMoodboardImage}
  />
</div>
```

---

## Posição Exata

O botão será inserido:
- **Após**: Badges de personagem/moodboard selecionados (linha 963)
- **Antes**: Preview de arquivos anexados (linha 965)

Isso coloca o botão exatamente acima do input de prompt, como mostrado na imagem de referência.

---

## Resultado Esperado

| Dispositivo | Comportamento |
|-------------|---------------|
| Desktop (lg+) | Botão oculto (`lg:hidden`), usa sidebar lateral |
| Mobile/Tablet | Botão visível acima do input, abre Sheet lateral |

---

## Observação

O `CharacterPanel` já detecta internamente se está no mobile e renderiza automaticamente como botão + Sheet. Apenas precisamos colocá-lo no lugar certo dentro da barra inferior.
