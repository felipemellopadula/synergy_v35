
# Plano: Remover Botão Duplicado de Personagem no Mobile

## Problema Identificado

Na versão mobile existem dois botões "Personagem" porque:

1. **Linha 800-828**: Um `CharacterPanel` está dentro de um `div` com `lg:hidden` (aparece só no mobile)
2. **Linha 840-870**: Outro `CharacterPanel` é renderizado como sidebar, mas sem restrição de visibilidade

O segundo `CharacterPanel` detecta que está no mobile (via `useIsMobile()`) e renderiza seu próprio botão `SheetTrigger`, causando a duplicação.

---

## Análise do Fluxo

```text
Mobile View:
├─ Header
│   └─ div.lg:hidden
│       └─ CharacterPanel → detecta mobile → renderiza botão "Personagem"  ← BOTÃO 1
│
└─ Layout Principal
    └─ CharacterPanel → detecta mobile → renderiza botão "Personagem"  ← BOTÃO 2 (DUPLICADO)
```

---

## Solução

Remover o `CharacterPanel` duplicado do header mobile. O `CharacterPanel` da sidebar (linha 840) já lida corretamente com ambos os casos (desktop=sidebar, mobile=botão sheet).

### Arquivo: `src/pages/Image2.tsx`

**Remover linhas 799-829** (o bloco completo do CharacterPanel no header mobile):

```tsx
// REMOVER este bloco inteiro:
{/* Botão de personagem no mobile */}
<div className="lg:hidden">
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

## Resultado

| Antes | Depois |
|-------|--------|
| 2 botões "Personagem" no mobile | 1 botão "Personagem" no mobile |
| CharacterPanel duplicado no header | CharacterPanel apenas na sidebar |
| Confuso para o usuário | Interface limpa e consistente |

O `CharacterPanel` da sidebar continuará funcionando corretamente:
- **Desktop**: Mostra como sidebar colapsável
- **Mobile**: Mostra como botão que abre um Sheet

---

## Arquivo Modificado

- `src/pages/Image2.tsx` - Remover o CharacterPanel duplicado do header
