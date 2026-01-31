

# Plano: Persistir Imagens na Página Skin Enhancer

## Problema Identificado

Os estados `originalImage` e `enhancedImage` são inicializados como `null` (linhas 31-32):

```tsx
const [originalImage, setOriginalImage] = useState<string | null>(null);
const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
```

Quando o usuário troca de aba, eventos do Supabase podem causar remontagem do componente, perdendo as imagens carregadas.

## Solução

Aplicar a mesma solução do Upscale/Inpaint: usar IndexedDB via `src/utils/imageStorage.ts` para persistir as imagens.

---

## Alterações no Arquivo `src/pages/SkinEnhancer.tsx`

### 1. Adicionar imports do IndexedDB (linha 15)

```tsx
import { saveImageToStorage, loadImageFromStorage, clearImagesFromStorage } from "@/utils/imageStorage";
```

### 2. Adicionar keys de persistência (após linha 24)

```tsx
// IndexedDB keys for image persistence
const ORIGINAL_IMAGE_KEY = 'skinenhancer_original_image';
const ENHANCED_IMAGE_KEY = 'skinenhancer_enhanced_image';
```

### 3. Adicionar estado para controlar carregamento inicial (após linha 34)

```tsx
const [isLoadingImages, setIsLoadingImages] = useState(true);
```

### 4. Adicionar useEffect para carregar imagens do IndexedDB (após linha 43)

```tsx
// Carregar imagens do IndexedDB ao montar
useEffect(() => {
  const loadImages = async () => {
    try {
      const [savedOriginal, savedEnhanced] = await Promise.all([
        loadImageFromStorage(ORIGINAL_IMAGE_KEY),
        loadImageFromStorage(ENHANCED_IMAGE_KEY)
      ]);
      if (savedOriginal) setOriginalImage(savedOriginal);
      if (savedEnhanced) setEnhancedImage(savedEnhanced);
    } catch (error) {
      console.warn('Failed to load images from storage:', error);
    } finally {
      setIsLoadingImages(false);
    }
  };
  loadImages();
}, []);
```

### 5. Adicionar useEffects para persistir imagens quando mudarem (após o anterior)

```tsx
// Persistir imagens no IndexedDB quando mudarem
useEffect(() => {
  if (isLoadingImages) return;
  saveImageToStorage(ORIGINAL_IMAGE_KEY, originalImage);
}, [originalImage, isLoadingImages]);

useEffect(() => {
  if (isLoadingImages) return;
  saveImageToStorage(ENHANCED_IMAGE_KEY, enhancedImage);
}, [enhancedImage, isLoadingImages]);
```

### 6. Adicionar useEffect para restaurar ao voltar para aba (após os anteriores)

```tsx
// Restaurar estado ao voltar para a aba
useEffect(() => {
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      const [savedOriginal, savedEnhanced] = await Promise.all([
        loadImageFromStorage(ORIGINAL_IMAGE_KEY),
        loadImageFromStorage(ENHANCED_IMAGE_KEY)
      ]);
      
      if (savedOriginal && !originalImage) {
        setOriginalImage(savedOriginal);
      }
      if (savedEnhanced && !enhancedImage) {
        setEnhancedImage(savedEnhanced);
      }
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [originalImage, enhancedImage]);
```

### 7. Modificar handleReset para limpar IndexedDB (linhas 157-160)

```tsx
const handleReset = () => {
  setOriginalImage(null);
  setEnhancedImage(null);
  // Limpar do IndexedDB
  clearImagesFromStorage([ORIGINAL_IMAGE_KEY, ENHANCED_IMAGE_KEY]);
};
```

---

## Resumo das Mudanças

| Local | Alteração |
|-------|-----------|
| Linha 15 | Adicionar imports do imageStorage |
| Após linha 24 | Adicionar keys de persistência |
| Após linha 34 | Adicionar estado `isLoadingImages` |
| Após linha 43 | useEffect para carregar imagens do IndexedDB |
| Após anterior | useEffects para persistir imagens |
| Após anterior | useEffect para restaurar ao voltar para aba |
| Linhas 157-160 | Limpar IndexedDB no handleReset |

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
2. Opcionalmente aplica o Skin Enhancer
3. Troca de aba do navegador
4. Ao voltar, tanto a imagem original quanto o resultado do Skin Enhancer estarão preservados

