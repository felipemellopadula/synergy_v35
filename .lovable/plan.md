
# Correção: Redimensionar Imagem de Referência para Sora 2

## Problema Identificado

Quando você anexa uma imagem de referência (frame) no Sora 2, a API Runware valida as dimensões da imagem:

```
The dimensions derived from your frame image (1024x724) are not supported. 
Supported dimensions are: '720x1280', '1280x720'.
```

A imagem anexada tem **1024x724**, mas o Sora 2 só aceita **exatamente**:
- 1280x720 (landscape 16:9)
- 720x1280 (portrait 9:16)

Sem anexo funciona porque a API gera do zero na resolução correta.

## Solução

Redimensionar a imagem de referência no frontend antes do upload para o storage, garantindo que corresponda à resolução selecionada pelo usuário.

## Arquivos a Modificar

### 1. `src/pages/Video.tsx` - Função de upload de imagem

Atualizar a lógica de upload para redimensionar a imagem para a resolução selecionada:

```typescript
// Antes de fazer upload, redimensionar para a resolução selecionada
const resizeImageToResolution = async (
  file: File, 
  targetWidth: number, 
  targetHeight: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context failed'));
        return;
      }
      
      // Desenha a imagem redimensionada (crop center para manter proporção)
      const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
      const x = (targetWidth - img.width * scale) / 2;
      const y = (targetHeight - img.height * scale) / 2;
      
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Blob creation failed'));
      }, 'image/webp', 0.92);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
```

### 2. Modificar `handleFrameUpload` para usar redimensionamento

Na função que faz upload do frame inicial/final, adicionar chamada ao resize antes do upload:

```typescript
// No handleFrameUpload, antes de fazer upload para o Supabase storage:
const currentResolution = RESOLUTIONS_BY_MODEL[selectedModel]?.find(r => r.id === selectedResolution);
if (currentResolution) {
  // Redimensionar para a resolução alvo
  const resizedBlob = await resizeImageToResolution(file, currentResolution.w, currentResolution.h);
  // Fazer upload do blob redimensionado ao invés do arquivo original
}
```

## Fluxo Corrigido

```text
1. Usuário seleciona resolução (ex: 16:9 - 720p = 1280x720)
2. Usuário anexa imagem de referência (qualquer tamanho)
3. Frontend redimensiona imagem para 1280x720
4. Upload da imagem redimensionada para Supabase storage
5. URL enviada para edge function → API Runware aceita
```

## Benefícios

- Funciona para qualquer imagem anexada, independente do tamanho original
- Aplica a todos os modelos que têm restrição de resolução de frames
- Sem mudanças na edge function (problema é resolvido no frontend)
