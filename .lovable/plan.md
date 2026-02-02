

# Plano: Corrigir Bug do Vídeo Não Aparecer no Preview Quando Fica Pronto

## Diagnóstico do Problema

Após análise detalhada do código em `src/pages/Video.tsx`, identifiquei o seguinte fluxo problemático:

### Fluxo Atual (Problemático)

1. **Polling detecta vídeo pronto** (linha 1053-1054):
   - `videoURL` é encontrado no resultado

2. **Estados são atualizados com flushSync** (linhas 1061-1066):
```tsx
flushSync(() => {
  setVideoUrl(videoURL);     // Seta o novo vídeo
  setIsSubmitting(false);    
  setTaskUUID(null);
  setElapsedTime(0);
});
```

3. **Refs são sincronizadas via useEffect** (linhas 516-524):
```tsx
useEffect(() => {
  taskUUIDRef.current = taskUUID;  // Atualiza DEPOIS do render
  setGenerationTaskUUID(taskUUID);
}, [taskUUID]);

useEffect(() => {
  videoUrlRef.current = videoUrl;  // Atualiza DEPOIS do render
}, [videoUrl]);
```

4. **O problema**: Se o usuário trocar de aba durante processamento e voltar APÓS o vídeo ficar pronto, o `visibilitychange` handler pode ver `taskUUIDRef.current` ainda com valor antigo (antes do useEffect sincronizar) e executar:
```tsx
flushSync(() => {
  setIsSubmitting(true);
  setVideoUrl(null);  // ⚠️ APAGA O VÍDEO RECÉM-GERADO!
});
```

### Hipótese Adicional

Também pode haver uma **race condition** onde:
- O `flushSync` atualiza o state
- Mas antes do React re-renderizar, algo mais dispara outro batch de updates
- O componente acaba mostrando estado antigo

---

## Solução Proposta

### Parte 1: Sincronização Imediata das Refs (Crítico)

No `beginPolling`, **atualizar as refs SINCRONAMENTE antes do flushSync**, não depois via useEffect:

```tsx
// Linha ~1053-1068 (dentro do beginPolling, quando videoURL é encontrado)
if (videoURL) {
  console.log("[Video] ✅ Vídeo pronto! URL:", videoURL);
  if (elapsedRef.current) window.clearInterval(elapsedRef.current);
  if (pollRef.current) window.clearTimeout(pollRef.current);
  
  // ✅ NOVO: Atualizar refs SINCRONAMENTE ANTES do flushSync
  // Isso evita race condition com visibilitychange
  videoUrlRef.current = videoURL;
  taskUUIDRef.current = null;
  processingRef.current = false;
  
  console.log("[Video] Aplicando estados atomicamente com flushSync...");
  flushSync(() => {
    setVideoUrl(videoURL);
    setIsSubmitting(false);
    setTaskUUID(null);
    setElapsedTime(0);
  });
  // ... resto do código
}
```

### Parte 2: Adicionar Console Logs para Diagnóstico

Adicionar logs estratégicos para entender exatamente o que está acontecendo:

```tsx
// Na renderização do player (antes da linha 1877)
console.log("[Video Render] Estados atuais:", {
  isSubmitting,
  taskUUID,
  videoUrl: videoUrl ? videoUrl.substring(0, 50) + "..." : null,
  savedVideosCount: savedVideos.length,
  savedVideos0: savedVideos[0]?.id
});
```

### Parte 3: Proteção no visibilitychange

Adicionar verificação extra para não limpar `videoUrl` se já existe um vídeo:

```tsx
// Linha ~1155 (dentro do handleVisibilityChange)
if (currentTaskUUID) {
  // ✅ NOVO: Não limpar se já temos um vídeo pronto
  if (videoUrlRef.current) {
    console.log("[Video] Tab voltou mas já temos vídeo pronto, ignorando");
    return;
  }
  
  // ... resto do código existente
}
```

### Parte 4: Garantir Re-render Forçado

Adicionar uma key dinâmica no Card de resultado para garantir re-render:

```tsx
// Linha ~1874
<Card className="order-1 lg:col-span-2" key={`player-${videoUrl || 'empty'}`}>
```

---

## Resumo das Alterações em `src/pages/Video.tsx`

| Linha | Alteração |
|-------|-----------|
| ~1053-1068 | Atualizar refs SINCRONAMENTE antes do flushSync |
| ~1155 | Adicionar verificação `videoUrlRef.current` no visibilitychange |
| ~1876 | Adicionar console.log de debug no render do player |
| ~1874 | Adicionar key dinâmica no Card para forçar re-render |

---

## Fluxo Corrigido

```text
[Polling detecta videoURL]
         |
         v
[Atualiza REFS sincronamente]  ← NOVO (evita race condition)
  - videoUrlRef.current = videoURL
  - taskUUIDRef.current = null
  - processingRef.current = false
         |
         v
[flushSync atualiza STATES]
  - setVideoUrl(videoURL)
  - setIsSubmitting(false)
  - setTaskUUID(null)
         |
         v
[React re-renderiza IMEDIATAMENTE]
         |
         v
[Player mostra o novo vídeo]
```

---

## Resultado Esperado

1. Quando o vídeo fica pronto, ele aparece **imediatamente** no quadrado maior
2. Não é mais necessário trocar de aba e voltar para ver o vídeo
3. Os console.logs ajudarão a diagnosticar se houver problemas residuais

