
# Plano: Corrigir Duplicação de Vídeos no Histórico

## Problema Identificado

Existem **múltiplos pontos** que chamam `saveVideoToDatabase`:

1. **Linha 1131**: No `beginPolling` quando o vídeo fica pronto (chamada explícita)
2. **Linha 797-800**: No `useEffect` que observa mudanças em `videoUrl`
3. **Restauração do IndexedDB**: Ao restaurar `videoUrl`, dispara o `useEffect` da linha 797

### Causa Raiz da Duplicação

Quando o componente **remonta** (por causa do `refreshProfile()`):

```text
[Componente remonta]
         |
         v
[savedVideoUrls.current = new Set<string>() VAZIO]  ← Perdeu memória!
         |
         v
[IndexedDB restaura videoUrl]
         |
         v
[useEffect detecta videoUrl && !savedVideoUrls.has(url)]  ← Passa!
         |
         v
[saveVideoToDatabase() → DUPLICA O VÍDEO!]
```

Além disso, pode haver **triplicação** quando:
- O `beginPolling` chama `saveVideoToDatabase` explicitamente (1º save)
- O `useEffect` também detecta `videoUrl` (2º save)
- Após remontagem, o IndexedDB restaura e o useEffect dispara novamente (3º save)

---

## Solução

### Parte 1: Remover chamada duplicada no `beginPolling`

A linha 1131 chama `saveVideoToDatabase(videoURL)` explicitamente, MAS o `useEffect` na linha 797 já faz isso automaticamente quando `videoUrl` muda. Isso causa duplicação imediata.

**Ação**: Remover a chamada direta `saveVideoToDatabase(videoURL)` do `beginPolling` (linhas 1129-1134).

### Parte 2: Adicionar flag para indicar que URL veio do IndexedDB

Quando o `videoUrl` é restaurado do IndexedDB (após remontagem), ele JÁ FOI SALVO anteriormente. Precisamos distinguir entre:
- URL **nova** (recém-gerada, precisa salvar)
- URL **restaurada** (do IndexedDB, NÃO precisa salvar)

**Ação**: Adicionar uma flag `isRestoredFromStorage` que é `true` durante a restauração do IndexedDB.

### Parte 3: Modificar useEffect para não salvar URLs restauradas

**Ação**: O `useEffect` que chama `saveVideoToDatabase` deve verificar se a URL não é restaurada.

---

## Alterações em `src/pages/Video.tsx`

### 1. Adicionar estado `isRestoredFromStorage` (após linha 484)

```tsx
const [isRestoredFromStorage, setIsRestoredFromStorage] = useState(false);
```

### 2. Marcar URL como restaurada no useEffect do IndexedDB (linhas 562-578)

```tsx
useEffect(() => {
  const loadVideoUrl = async () => {
    try {
      const savedUrl = await loadImageFromStorage(VIDEO_URL_STORAGE_KEY);
      if (savedUrl && !taskUUIDRef.current) {
        console.log("[Video] Restaurando videoUrl do IndexedDB:", savedUrl.substring(0, 50));
        setIsRestoredFromStorage(true); // ✅ Marcar como restaurado
        setVideoUrl(savedUrl);
        videoUrlRef.current = savedUrl;
        // ✅ Adicionar à lista de URLs já salvas para prevenir duplicação
        savedVideoUrls.current.add(savedUrl);
      }
    } catch (error) {
      console.warn('[Video] Erro ao carregar videoUrl do IndexedDB:', error);
    } finally {
      setIsHydratingVideoUrl(false);
    }
  };
  loadVideoUrl();
}, []);
```

### 3. Modificar useEffect que salva para ignorar URLs restauradas (linhas 795-800)

```tsx
useEffect(() => {
  // ✅ Não salvar se URL foi restaurada do IndexedDB
  if (isRestoredFromStorage) {
    console.log("[Video] URL restaurada do IndexedDB, não salvar novamente");
    return;
  }
  if (videoUrl && !isSaving && !savedVideoUrls.current.has(videoUrl)) {
    console.log("[Video] Salvando videoUrl nova no banco:", videoUrl.substring(0, 50));
    saveVideoToDatabase(videoUrl);
  }
}, [videoUrl, isSaving, saveVideoToDatabase, isRestoredFromStorage]);
```

### 4. Remover chamada duplicada no beginPolling (linhas 1129-1134)

**Remover este bloco**:
```tsx
// ✅ Salvar o vídeo automaticamente no banco (em background, não bloqueia exibição)
try {
  saveVideoToDatabase(videoURL);
} catch (saveError) {
  console.error("[Video] Erro ao salvar vídeo (não afeta exibição):", saveError);
}
```

O `useEffect` já cuida de chamar `saveVideoToDatabase` quando `videoUrl` muda.

### 5. Resetar flag ao iniciar nova geração (no handleSubmit, após linha 1279)

```tsx
setIsRestoredFromStorage(false); // ✅ Resetar flag para nova geração
```

### 6. Adicionar console.logs para diagnóstico

Em `saveVideoToDatabase`:
```tsx
console.log("[Video] saveVideoToDatabase chamado para URL:", url.substring(0, 50));
console.log("[Video] isSaving:", isSaving, "savedVideoUrls.has:", savedVideoUrls.current.has(url));
```

---

## Resumo das Alterações

| Local | Alteração |
|-------|-----------|
| Após linha 484 | Adicionar estado `isRestoredFromStorage` |
| Linhas 562-578 | Adicionar `savedVideoUrls.current.add(savedUrl)` e `setIsRestoredFromStorage(true)` |
| Linhas 795-800 | Verificar `isRestoredFromStorage` antes de salvar |
| Linhas 1129-1134 | **REMOVER** chamada direta a `saveVideoToDatabase` |
| Após linha 1279 | Resetar `setIsRestoredFromStorage(false)` |

---

## Fluxo Corrigido

```text
[Vídeo fica pronto no polling]
         |
         v
[setVideoUrl(videoURL)] ← Apenas seta o state
         |
         v
[useEffect detecta videoUrl && !isRestoredFromStorage && !savedVideoUrls.has]
         |
         v
[saveVideoToDatabase() → SALVA 1 VEZ APENAS]
         |
         v
[savedVideoUrls.current.add(url)] ← Marca como salvo
         |
         v
[Componente remonta por refreshProfile()]
         |
         v
[savedVideoUrls.current = new Set() VAZIO]
         |
         v
[IndexedDB restaura videoUrl + adiciona em savedVideoUrls + seta isRestoredFromStorage=true]
         |
         v
[useEffect detecta videoUrl MAS isRestoredFromStorage=true]
         |
         v
[IGNORA SALVAMENTO → SEM DUPLICAÇÃO!]
```

---

## Resultado Esperado

1. Cada vídeo gerado será salvo **apenas uma vez** no banco
2. Não haverá mais duplicação ou triplicação no histórico
3. A restauração do IndexedDB funcionará sem disparar salvamento duplicado
4. Console logs ajudarão a diagnosticar qualquer problema residual
