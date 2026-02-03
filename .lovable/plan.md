
# Plano: Corrigir Persistência do Vídeo no IndexedDB

## Problema Identificado nos Logs

```text
[Video] Estados aplicados com sucesso. videoUrl: https://vm.runware.ai/video/...
[Video Render] Estados atuais: {"videoUrl": null, "savedVideosCount": 0}  ← VÍDEO PERDIDO!
[Video] Componente montado. sessionStorage taskUUID: null  ← REMONTOU!
```

O vídeo foi setado corretamente, mas **o componente remontou antes do useEffect ter chance de executar**:

1. `flushSync` seta `videoUrl` com a URL
2. `refreshProfile()` é chamado imediatamente na linha 1152
3. O AuthContext atualiza e o componente Video **desmonta**
4. O `useEffect` que salvaria no IndexedDB **nunca roda** (componente já desmontou)
5. Componente remonta, tenta carregar do IndexedDB, mas está **vazio**

## Solução

Salvar no IndexedDB **SINCRONAMENTE** dentro do `beginPolling`, **antes** de chamar `refreshProfile()`, não em um `useEffect`.

### Alteração no `beginPolling` (linhas 1106-1153)

```tsx
if (videoURL) {
  console.log("[Video] ✅ Vídeo pronto! URL:", videoURL);
  if (elapsedRef.current) window.clearInterval(elapsedRef.current);
  if (pollRef.current) window.clearTimeout(pollRef.current);
  
  // ✅ CRÍTICO: Atualizar refs SINCRONAMENTE
  videoUrlRef.current = videoURL;
  taskUUIDRef.current = null;
  processingRef.current = false;
  setGenerationTaskUUID(null);
  
  // ✅ NOVO: Salvar no IndexedDB SINCRONAMENTE antes do refreshProfile
  // Isso garante que o vídeo sobrevive à remontagem causada pelo refreshProfile
  console.log("[Video] Salvando videoUrl no IndexedDB ANTES do refreshProfile");
  saveImageToStorage(VIDEO_URL_STORAGE_KEY, videoURL);
  
  console.log("[Video] Refs atualizadas sincronamente. Aplicando estados com flushSync...");
  flushSync(() => {
    setVideoUrl(videoURL);
    setIsSubmitting(false);
    setTaskUUID(null);
    setElapsedTime(0);
  });
  
  // ... toast ...
  
  // ✅ Atualizar saldo de créditos (isso causa remontagem, mas o vídeo já está no IndexedDB)
  refreshProfile();
  return;
}
```

### Manter o useEffect como Fallback

O `useEffect` existente (linhas 585-595) continua funcionando como fallback para outros casos, mas a persistência principal agora é síncrona no `beginPolling`.

### Adicionar Console Log na Restauração

Para confirmar que está funcionando:

```tsx
// Linha 566
const savedUrl = await loadImageFromStorage(VIDEO_URL_STORAGE_KEY);
console.log("[Video] IndexedDB retornou:", savedUrl ? savedUrl.substring(0, 50) : "VAZIO");
```

## Resumo das Alterações em `src/pages/Video.tsx`

| Local | Alteração |
|-------|-----------|
| Linha ~1116 (após atualizar refs) | Adicionar `saveImageToStorage(VIDEO_URL_STORAGE_KEY, videoURL)` |
| Linha ~566 | Adicionar console.log para ver o que o IndexedDB retorna |

## Fluxo Corrigido

```text
[Polling detecta videoURL pronto]
         |
         v
[Atualiza refs sincronamente]
         |
         v
[saveImageToStorage(videoURL)]  ← NOVO: Salva ANTES do refreshProfile
         |
         v
[flushSync atualiza states]
         |
         v
[refreshProfile() causa remontagem]
         |
         v
[Componente remonta]
         |
         v
[loadImageFromStorage retorna a URL]  ← IndexedDB tem o vídeo!
         |
         v
[setVideoUrl(savedUrl) → VÍDEO APARECE!]
```

## Resultado Esperado

1. O vídeo será salvo no IndexedDB **antes** do `refreshProfile()` causar a remontagem
2. Quando o componente remontar, o IndexedDB terá a URL disponível
3. O vídeo aparecerá imediatamente no quadrado grande
4. Console logs confirmarão o fluxo
