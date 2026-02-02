
# Plano: Corrigir Bug do Vídeo Não Aparecer no Preview (Problema Real Identificado)

## Diagnóstico do Problema Real

Analisando os console logs, o problema ficou claro:

```
[Video] Estados aplicados com sucesso. videoUrl: https://vm.runware.ai/video/...
[Video Render] Estados atuais: { "videoUrl": null, "savedVideosCount": 0 }
[Video] Componente montado. sessionStorage taskUUID: null
```

O vídeo é setado corretamente, mas em seguida o **componente remonta completamente** e todos os estados são perdidos.

### Causa Raiz

1. Quando o vídeo fica pronto, o código chama `refreshProfile()` (linha 1102)
2. `refreshProfile()` atualiza o estado `profile` no AuthContext
3. Isso causa re-renderização do ProtectedRoute
4. O componente Video (que é lazy-loaded) **remonta completamente**
5. Ao remontar, `useState<string | null>(null)` reinicializa o `videoUrl` para `null`

### Por Que Upscale/Inpaint/SkinEnhancer Funcionam

Essas páginas usam **IndexedDB** (via `imageStorage.ts`) para persistir as imagens. Quando o componente remonta, ele imediatamente carrega o resultado do IndexedDB.

A página Video **não implementa essa persistência** para o `videoUrl`.

---

## Solução

Implementar persistência do `videoUrl` usando a mesma estratégia das outras páginas.

### Alterações em `src/pages/Video.tsx`

#### 1. Adicionar import do imageStorage (linha 37)

```tsx
import { saveImageToStorage, loadImageFromStorage, removeImageFromStorage } from "@/utils/imageStorage";
```

#### 2. Adicionar constante para a key de persistência (após linha 68)

```tsx
// Chave para persistir videoUrl no IndexedDB (sobrevive remontagem)
const VIDEO_URL_STORAGE_KEY = 'video_generated_url';
```

#### 3. Adicionar estado de controle de hidratação (após linha 480)

```tsx
const [isHydratingVideoUrl, setIsHydratingVideoUrl] = useState(true);
```

#### 4. Carregar videoUrl do IndexedDB ao montar (após linha 555)

```tsx
// Carregar videoUrl do IndexedDB ao montar (para sobreviver remontagem)
useEffect(() => {
  const loadVideoUrl = async () => {
    try {
      const savedUrl = await loadImageFromStorage(VIDEO_URL_STORAGE_KEY);
      if (savedUrl) {
        console.log("[Video] Restaurando videoUrl do IndexedDB:", savedUrl.substring(0, 50));
        setVideoUrl(savedUrl);
        videoUrlRef.current = savedUrl;
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

#### 5. Persistir videoUrl no IndexedDB quando mudar (após o efeito anterior)

```tsx
// Persistir videoUrl no IndexedDB quando mudar
useEffect(() => {
  if (isHydratingVideoUrl) return; // Não salvar durante hidratação
  if (videoUrl) {
    console.log("[Video] Persistindo videoUrl no IndexedDB");
    saveImageToStorage(VIDEO_URL_STORAGE_KEY, videoUrl);
  } else {
    // Se videoUrl foi limpo intencionalmente, remover do storage
    removeImageFromStorage(VIDEO_URL_STORAGE_KEY);
  }
}, [videoUrl, isHydratingVideoUrl]);
```

#### 6. Restaurar ao voltar para a aba (modificar o visibilitychange handler)

Adicionar dentro do `handleVisibilityChange` existente, no bloco quando `document.visibilityState === 'visible'`:

```tsx
// Verificar se videoUrl foi perdido e restaurar do IndexedDB
if (!videoUrl && !currentTaskUUID) {
  const savedUrl = await loadImageFromStorage(VIDEO_URL_STORAGE_KEY);
  if (savedUrl) {
    console.log("[Video] Restaurando videoUrl do IndexedDB ao voltar para aba");
    setVideoUrl(savedUrl);
    videoUrlRef.current = savedUrl;
    return;
  }
}
```

#### 7. Limpar ao gerar novo vídeo (no handleSubmit)

Quando iniciar uma nova geração, limpar o storage:

```tsx
// No início do handleSubmit, limpar storage anterior
removeImageFromStorage(VIDEO_URL_STORAGE_KEY);
```

---

## Resumo das Alterações

| Arquivo | Local | Alteração |
|---------|-------|-----------|
| Video.tsx | Linha 37 | Import do imageStorage |
| Video.tsx | Após linha 68 | Constante VIDEO_URL_STORAGE_KEY |
| Video.tsx | Após linha 480 | Estado isHydratingVideoUrl |
| Video.tsx | Após linha 555 | useEffect para carregar do IndexedDB |
| Video.tsx | Após anterior | useEffect para persistir no IndexedDB |
| Video.tsx | visibilitychange handler | Restaurar do IndexedDB |
| Video.tsx | handleSubmit | Limpar storage ao gerar novo |

---

## Fluxo Corrigido

```text
[Polling detecta videoURL pronto]
         |
         v
[setVideoUrl(videoURL)]
         |
         v
[useEffect detecta mudança → salva no IndexedDB]
         |
         v
[refreshProfile() é chamado]
         |
         v
[AuthContext atualiza profile]
         |
         v
[ProtectedRoute re-renderiza]
         |
         v
[Video.tsx REMONTA (lazy load)]
         |
         v
[useEffect de montagem carrega do IndexedDB]
         |
         v
[setVideoUrl(savedUrl) → VÍDEO APARECE!]
```

---

## Resultado Esperado

1. Quando o vídeo fica pronto, ele é salvo no IndexedDB
2. Se o componente remonta (por qualquer motivo), o vídeo é restaurado imediatamente
3. O vídeo aparece no quadrado maior sem precisar trocar de aba
4. O padrão fica consistente com Upscale, Inpaint e SkinEnhancer
