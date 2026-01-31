

# Plano: Persistir Imagens na Página Upscale

## Problema Identificado

Os estados `originalImage` e `upscaledImage` são inicializados como `null` (linha 36-38):

```tsx
const [originalImage, setOriginalImage] = useState<string | null>(null);
const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
```

Quando o usuário troca de aba, eventos do Supabase podem causar remontagem do componente, perdendo as imagens carregadas.

## Solução

Aplicar a mesma solução do Inpaint: usar IndexedDB via `src/utils/imageStorage.ts` para persistir as imagens.

---

## Alterações no Arquivo `src/pages/Upscale.tsx`

### 1. Adicionar imports do IndexedDB (linha 14)

```tsx
import { saveImageToStorage, loadImageFromStorage, clearImagesFromStorage } from "@/utils/imageStorage";
```

### 2. Adicionar keys de persistência (após linha 29)

```tsx
const ORIGINAL_IMAGE_KEY = 'upscale_original_image';
const UPSCALED_IMAGE_KEY = 'upscale_upscaled_image';
```

### 3. Adicionar estado para controlar carregamento inicial (após linha 40)

```tsx
const [isLoadingImages, setIsLoadingImages] = useState(true);
```

### 4. Adicionar useEffect para carregar imagens do IndexedDB (após linha 55)

```tsx
// Carregar imagens do IndexedDB ao montar
useEffect(() => {
  const loadImages = async () => {
    try {
      const [savedOriginal, savedUpscaled] = await Promise.all([
        loadImageFromStorage(ORIGINAL_IMAGE_KEY),
        loadImageFromStorage(UPSCALED_IMAGE_KEY)
      ]);
      if (savedOriginal) {
        setOriginalImage(savedOriginal);
        // Restaurar dimensões
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
        };
        img.src = savedOriginal;
      }
      if (savedUpscaled) setUpscaledImage(savedUpscaled);
    } catch (error) {
      console.warn('Failed to load images from storage:', error);
    } finally {
      setIsLoadingImages(false);
    }
  };
  loadImages();
}, []);
```

### 5. Adicionar useEffect para persistir imagens quando mudarem (após o anterior)

```tsx
// Persistir imagens no IndexedDB quando mudarem
useEffect(() => {
  if (isLoadingImages) return; // Não salvar durante carregamento inicial
  saveImageToStorage(ORIGINAL_IMAGE_KEY, originalImage);
}, [originalImage, isLoadingImages]);

useEffect(() => {
  if (isLoadingImages) return;
  saveImageToStorage(UPSCALED_IMAGE_KEY, upscaledImage);
}, [upscaledImage, isLoadingImages]);
```

### 6. Adicionar useEffect para restaurar ao voltar para aba (após os anteriores)

```tsx
// Restaurar estado ao voltar para a aba
useEffect(() => {
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      const [savedOriginal, savedUpscaled] = await Promise.all([
        loadImageFromStorage(ORIGINAL_IMAGE_KEY),
        loadImageFromStorage(UPSCALED_IMAGE_KEY)
      ]);
      
      if (savedOriginal && !originalImage) {
        setOriginalImage(savedOriginal);
        // Restaurar dimensões
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
        };
        img.src = savedOriginal;
      }
      if (savedUpscaled && !upscaledImage) {
        setUpscaledImage(savedUpscaled);
      }
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [originalImage, upscaledImage]);
```

### 7. Modificar handleReset para limpar IndexedDB (linhas 227-231)

```tsx
const handleReset = () => {
  setOriginalImage(null);
  setImageDimensions(null);
  setUpscaledImage(null);
  // Limpar do IndexedDB
  clearImagesFromStorage([ORIGINAL_IMAGE_KEY, UPSCALED_IMAGE_KEY]);
};
```

---

## Resumo das Mudanças

| Local | Alteração |
|-------|-----------|
| Linha 14 | Adicionar imports do imageStorage |
| Após linha 29 | Adicionar keys de persistência |
| Após linha 40 | Adicionar estado `isLoadingImages` |
| Após linha 55 | useEffect para carregar imagens do IndexedDB |
| Após anterior | useEffect para persistir imagens |
| Após anterior | useEffect para restaurar ao voltar para aba |
| Linhas 227-231 | Limpar IndexedDB no handleReset |

---

## Fluxo de Funcionamento

```text
[Usuário faz upload de imagem]
         │
         ▼
[setOriginalImage dispara]
         │
         ▼
[useEffect salva no IndexedDB]
         │
         ▼
[Usuário troca de aba]
         │
         ▼
[Componente remonta (Supabase auth)]
         │
         ▼
[useEffect inicial carrega do IndexedDB]
         │
         ▼
[Usuário vê imagem original restaurada]
```

---

## Resultado Esperado

1. Usuário faz upload de uma imagem
2. Opcionalmente faz upscale
3. Troca de aba do navegador
4. Ao voltar, tanto a imagem original quanto o resultado do upscale estarão preservados

