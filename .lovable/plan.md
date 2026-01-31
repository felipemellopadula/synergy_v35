

# Plano: Adicionar Persistência de Imagem e Drag and Drop na Página AI Avatar

## Problema Identificado

1. **Sem persistência**: Os estados `uploadedImage` e `generatedAvatar` são inicializados como `null` (linhas 47-48). Quando o usuário troca de aba, eventos do Supabase podem causar remontagem do componente, perdendo as imagens carregadas.

2. **Sem drag and drop**: A página atual só aceita upload via clique no botão. Não há suporte para arrastar e soltar imagens, diferente de outras páginas como Inpaint, Upscale e SkinEnhancer.

## Solução

Aplicar o mesmo padrão das outras páginas:
- Usar IndexedDB via `src/utils/imageStorage.ts` para persistir as imagens
- Adicionar handlers de drag and drop com feedback visual

---

## Alterações no Arquivo `src/pages/AIAvatar.tsx`

### 1. Adicionar imports do IndexedDB (linha 1)

Adicionar import junto com os outros:

```tsx
import { saveImageToStorage, loadImageFromStorage, clearImagesFromStorage } from "@/utils/imageStorage";
```

### 2. Adicionar keys de persistência (após linha 40)

```tsx
// IndexedDB keys for image persistence
const UPLOADED_IMAGE_KEY = 'aiavatar_uploaded_image';
const GENERATED_AVATAR_KEY = 'aiavatar_generated_avatar';
```

### 3. Adicionar estado para controlar carregamento e arrastar (após linha 54)

```tsx
const [isLoadingImages, setIsLoadingImages] = useState(true);
const [isDragging, setIsDragging] = useState(false);
```

### 4. Adicionar useEffect para carregar imagens do IndexedDB (após linha 70)

```tsx
// Carregar imagens do IndexedDB ao montar
useEffect(() => {
  const loadImages = async () => {
    try {
      const [savedUploaded, savedGenerated] = await Promise.all([
        loadImageFromStorage(UPLOADED_IMAGE_KEY),
        loadImageFromStorage(GENERATED_AVATAR_KEY)
      ]);
      if (savedUploaded) setUploadedImage(savedUploaded);
      if (savedGenerated) setGeneratedAvatar(savedGenerated);
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
  saveImageToStorage(UPLOADED_IMAGE_KEY, uploadedImage);
}, [uploadedImage, isLoadingImages]);

useEffect(() => {
  if (isLoadingImages) return;
  saveImageToStorage(GENERATED_AVATAR_KEY, generatedAvatar);
}, [generatedAvatar, isLoadingImages]);
```

### 6. Adicionar useEffect para restaurar ao voltar para aba (após os anteriores)

```tsx
// Restaurar estado ao voltar para a aba
useEffect(() => {
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      const [savedUploaded, savedGenerated] = await Promise.all([
        loadImageFromStorage(UPLOADED_IMAGE_KEY),
        loadImageFromStorage(GENERATED_AVATAR_KEY)
      ]);
      
      if (savedUploaded && !uploadedImage) {
        setUploadedImage(savedUploaded);
      }
      if (savedGenerated && !generatedAvatar) {
        setGeneratedAvatar(savedGenerated);
      }
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [uploadedImage, generatedAvatar]);
```

### 7. Adicionar handlers de drag and drop (após handleSelectSavedAvatar, ~linha 283)

```tsx
// Drag and drop handlers
const handleDragOver = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(true);
}, []);

const handleDragLeave = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(false);
}, []);

const handleDrop = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(false);

  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith("image/")) {
    toast.error("Por favor, arraste uma imagem válida");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    toast.error("A imagem deve ter no máximo 10MB");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    setUploadedImage(event.target?.result as string);
    setGeneratedAvatar(null);
  };
  reader.readAsDataURL(file);
}, []);
```

### 8. Modificar handleRemoveImage para limpar IndexedDB (linhas 114-121)

```tsx
const handleRemoveImage = useCallback(() => {
  setUploadedImage(null);
  setGeneratedAvatar(null);
  setCustomPrompt("");
  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
  // Limpar do IndexedDB
  clearImagesFromStorage([UPLOADED_IMAGE_KEY, GENERATED_AVATAR_KEY]);
}, []);
```

### 9. Adicionar eventos de drag and drop na área de upload (linhas 365-377)

Modificar a div de upload para incluir os eventos:

```tsx
<div
  className={`w-full max-w-md aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors bg-muted/30 ${
    isDragging 
      ? "border-primary bg-primary/10" 
      : "border-border hover:border-primary/50"
  }`}
  onClick={() => fileInputRef.current?.click()}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
>
  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
    isDragging 
      ? "bg-primary" 
      : "bg-gradient-to-br from-purple-500 to-pink-500"
  }`}>
    <Upload className="h-8 w-8 text-white" />
  </div>
  <div className="text-center">
    <p className="text-foreground font-medium">
      {isDragging ? "Solte a imagem aqui" : "Faça upload de uma foto"}
    </p>
    <p className="text-sm text-muted-foreground mt-1">
      {isDragging ? "" : "Arraste ou clique para selecionar"}
    </p>
    <p className="text-sm text-muted-foreground">PNG, JPG até 10MB</p>
  </div>
</div>
```

---

## Resumo das Mudanças

| Local | Alteração |
|-------|-----------|
| Linha 1 | Adicionar imports do imageStorage |
| Após linha 40 | Adicionar keys de persistência |
| Após linha 54 | Adicionar estados `isLoadingImages` e `isDragging` |
| Após linha 70 | useEffect para carregar imagens do IndexedDB |
| Após anterior | useEffects para persistir imagens |
| Após anterior | useEffect para restaurar ao voltar para aba |
| Após linha 283 | Handlers de drag and drop |
| Linhas 114-121 | Limpar IndexedDB no handleRemoveImage |
| Linhas 365-377 | Eventos e feedback visual de drag and drop |

---

## Detalhes Técnicos

### Fluxo de Persistência

```text
[Usuário faz upload/gera avatar]
         |
         v
[setUploadedImage/setGeneratedAvatar dispara]
         |
         v
[useEffect salva no IndexedDB]
         |
         v
[Usuário troca de aba]
         |
         v
[Componente remonta (Supabase auth)]
         |
         v
[useEffect inicial carrega do IndexedDB]
         |
         v
[Usuário ve imagens restauradas]
```

### Fluxo de Drag and Drop

```text
[Usuário arrasta imagem sobre a area]
         |
         v
[handleDragOver: isDragging = true]
         |
         v
[Feedback visual: borda e fundo mudam]
         |
         v
[Usuário solta imagem]
         |
         v
[handleDrop: valida e carrega imagem]
         |
         v
[setUploadedImage com base64]
```

---

## Resultado Esperado

1. Usuário pode arrastar e soltar uma imagem na area de upload
2. Feedback visual aparece quando arrasta sobre a area (borda e fundo mudam de cor)
3. Ao fazer upload, a imagem persiste no IndexedDB
4. Ao gerar avatar, o resultado também persiste
5. Ao trocar de aba e voltar, tanto a imagem original quanto o avatar gerado permanecem
6. Ao clicar em remover, ambas as imagens são limpas do IndexedDB

