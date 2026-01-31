
# Plano: Persistir Pinturas do Canvas no Inpaint

## Problema Identificado

A imagem de fundo persiste corretamente via IndexedDB, mas os **desenhos/máscaras** feitos sobre ela são perdidos ao trocar de aba. Isso acontece porque:

1. O canvas Fabric.js armazena os desenhos no estado `history` (React state)
2. Esse estado é **perdido** quando o componente remonta (troca de aba, eventos do Supabase)
3. Ao remontar, a imagem é restaurada do IndexedDB, mas o canvas é recriado **limpo**

## Solução

Persistir o estado do canvas (JSON serializado pelo Fabric.js) no IndexedDB, similar ao que já fazemos com as imagens.

---

## Alterações no Arquivo `src/pages/Inpaint.tsx`

### 1. Adicionar nova key para o estado do canvas (linha 42)

```tsx
const CANVAS_STATE_KEY = 'inpaint_canvas_state';
```

### 2. Criar referência para evitar loops de salvamento (após linha 71)

```tsx
const isRestoringCanvas = useRef(false);
```

### 3. Modificar o useEffect de carregamento inicial para incluir o canvas (linhas 73-90)

Carregar também o estado do canvas junto com as imagens:

```tsx
useEffect(() => {
  const loadImages = async () => {
    try {
      const [uploaded, generated, canvasState] = await Promise.all([
        loadImageFromStorage(UPLOADED_IMAGE_KEY),
        loadImageFromStorage(GENERATED_IMAGE_KEY),
        loadImageFromStorage(CANVAS_STATE_KEY)
      ]);
      if (uploaded) setUploadedImage(uploaded);
      if (generated) setGeneratedImage(generated);
      // Canvas state will be restored after canvas is ready
      if (canvasState) {
        sessionStorage.setItem('temp_canvas_state', canvasState);
      }
    } catch (error) {
      console.warn('Failed to load images from storage:', error);
    } finally {
      setIsLoadingImages(false);
    }
  };
  loadImages();
}, []);
```

### 4. Adicionar useEffect para restaurar o canvas quando estiver pronto (após linha 253)

```tsx
// Restore canvas state from storage after canvas is ready
useEffect(() => {
  const canvas = fabricCanvasRef.current;
  if (!canvas || !canvasReady || !uploadedImage) return;
  
  const savedCanvasState = sessionStorage.getItem('temp_canvas_state');
  if (!savedCanvasState) return;
  
  // Remove temp state to avoid re-applying
  sessionStorage.removeItem('temp_canvas_state');
  
  // Wait a bit for the image to load first
  const timer = setTimeout(() => {
    isRestoringCanvas.current = true;
    canvas.loadFromJSON(JSON.parse(savedCanvasState)).then(() => {
      canvas.renderAll();
      isRestoringCanvas.current = false;
      console.log("🎨 Canvas state restored from storage");
    }).catch(err => {
      console.warn("Failed to restore canvas state:", err);
      isRestoringCanvas.current = false;
    });
  }, 500);
  
  return () => clearTimeout(timer);
}, [canvasReady, uploadedImage]);
```

### 5. Adicionar listener para salvar o canvas após cada desenho (dentro do useEffect de inicialização, após linha 212)

Adicionar event listener `path:created` no canvas:

```tsx
// Save canvas state when user draws
canvas.on('path:created', () => {
  if (isRestoringCanvas.current) return;
  const canvasJson = JSON.stringify(canvas.toJSON());
  saveImageToStorage(CANVAS_STATE_KEY, canvasJson);
  console.log("🎨 Canvas state saved");
});
```

### 6. Modificar handleVisibilityChange para restaurar o canvas (linhas 134-157)

```tsx
useEffect(() => {
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      const [savedUploaded, savedGenerated, savedCanvasState] = await Promise.all([
        loadImageFromStorage(UPLOADED_IMAGE_KEY),
        loadImageFromStorage(GENERATED_IMAGE_KEY),
        loadImageFromStorage(CANVAS_STATE_KEY)
      ]);
      const savedPrompt = sessionStorage.getItem(PROMPT_KEY) || '';
      
      if (savedUploaded && !uploadedImage) {
        setUploadedImage(savedUploaded);
      }
      if (savedGenerated && !generatedImage) {
        setGeneratedImage(savedGenerated);
      }
      if (savedPrompt && !prompt) {
        setPrompt(savedPrompt);
      }
      
      // Restore canvas drawings if available
      const canvas = fabricCanvasRef.current;
      if (canvas && savedCanvasState && canvasReady) {
        isRestoringCanvas.current = true;
        canvas.loadFromJSON(JSON.parse(savedCanvasState)).then(() => {
          canvas.renderAll();
          isRestoringCanvas.current = false;
          console.log("🎨 Canvas restored on visibility change");
        }).catch(() => {
          isRestoringCanvas.current = false;
        });
      }
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [uploadedImage, generatedImage, prompt, canvasReady]);
```

### 7. Limpar estado do canvas no handleDeleteImage (linhas 462-477)

```tsx
const handleDeleteImage = () => {
  setUploadedImage(null);
  setGeneratedImage(null);
  const canvas = fabricCanvasRef.current;
  if (canvas) {
    canvas.clear();
    canvas.backgroundColor = "#1a1a1a";
    canvas.renderAll();
  }
  setHistory([]);
  setHistoryIndex(-1);
  setPrompt("");
  // Clear from IndexedDB - including canvas state
  clearImagesFromStorage([UPLOADED_IMAGE_KEY, GENERATED_IMAGE_KEY, CANVAS_STATE_KEY]);
  sessionStorage.removeItem(PROMPT_KEY);
  sessionStorage.removeItem('temp_canvas_state');
};
```

### 8. Limpar estado do canvas ao carregar nova imagem (handleImageUpload, linhas 418-435)

```tsx
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const result = event.target?.result as string;
    setUploadedImage(result);
    setGeneratedImage(null);
    // Clear saved canvas state when uploading new image
    saveImageToStorage(CANVAS_STATE_KEY, null);
    sessionStorage.removeItem('temp_canvas_state');
  };
  reader.readAsDataURL(file);
};
```

---

## Resumo das Mudanças

| Local | Alteração |
|-------|-----------|
| Linha 42 | Adicionar `CANVAS_STATE_KEY` |
| Após linha 71 | Adicionar `isRestoringCanvas` ref |
| Linhas 73-90 | Carregar estado do canvas do IndexedDB |
| Após linha 212 | Adicionar listener `path:created` para salvar canvas |
| Após linha 253 | Adicionar useEffect para restaurar canvas quando pronto |
| Linhas 134-157 | Restaurar canvas no visibilitychange |
| Linhas 418-435 | Limpar estado do canvas ao fazer novo upload |
| Linhas 462-477 | Limpar estado do canvas no delete |

---

## Fluxo de Funcionamento

```text
[Usuário desenha no canvas]
         │
         ▼
[Evento path:created dispara]
         │
         ▼
[canvas.toJSON() serializa tudo]
         │
         ▼
[Salva no IndexedDB (CANVAS_STATE_KEY)]
         │
         ▼
[Usuário troca de aba]
         │
         ▼
[Componente remonta (Supabase auth)]
         │
         ▼
[useEffect carrega do IndexedDB]
         │
         ▼
[Espera canvas ficar pronto]
         │
         ▼
[loadFromJSON restaura desenhos]
         │
         ▼
[Usuário vê imagem + pinturas]
```

---

## Resultado Esperado

1. Usuário faz upload de uma imagem
2. Pinta a máscara sobre a imagem
3. Troca de aba do navegador
4. Ao voltar, tanto a imagem quanto as pinturas estarão preservadas
