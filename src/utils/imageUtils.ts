/**
 * /utils/imageUtils.ts
 *
 * Funções de utilidade para manipular imagens geradas (Download, Compartilhar, Recriar).
 */

// Interface que define a estrutura de um objeto de imagem gerada.
export interface GeneratedImage {
  id: string;
  prompt: string;
  originalPrompt: string;
  // O campo detailedPrompt não estava sendo usado, removido para simplificar
  url: string;
  timestamp: string;
  quality: string;
  width: number;
  height: number;
  model: string;
}

// Definição de tipo para uma função de notificação (toast).
export type ToastFunction = (options: {
  title: string;
  description?: string;
  variant: "default" | "destructive";
}) => void;

/**
 * Converte uma string data URI para um objeto Blob.
 * Essencial para as funções de download e compartilhamento.
 */
const dataURIToBlob = (dataURI: string): Blob => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};


/**
 * Inicia o download de uma imagem gerada para o dispositivo do usuário.
 * Cria um nome de arquivo a partir do prompt e usa a API Fetch para obter a imagem como um blob.
 *
 * @param image O objeto da imagem a ser baixada.
 * @param toast A função para exibir notificações de sucesso ou erro.
 */
export const downloadImage = (image: GeneratedImage, toast: ToastFunction): void => {
  try {
    const fileName = `${image.prompt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .substring(0, 30)}_${Date.now()}.png`;

    const blob = dataURIToBlob(image.url);
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({ title: "Download iniciado", description: `A imagem "${fileName}" está a ser baixada.`, variant: "default" });
  } catch (error) {
      console.error("Erro no download da imagem:", error);
      toast({ title: "Erro de Download", description: "Não foi possível baixar a imagem.", variant: "destructive" });
  }
};

/**
 * Compartilha uma imagem usando a API Web Share nativa do navegador, se disponível.
 * Converte o data URI para um arquivo para uma melhor experiência de compartilhamento.
 *
 * @param image O objeto da imagem a ser compartilhada.
 * @param toast A função para exibir notificações.
 */
export const shareImage = async (image: GeneratedImage, toast: ToastFunction): Promise<void> => {
  try {
    const blob = dataURIToBlob(image.url);
    const file = new File([blob], `synergy-image-${Date.now()}.png`, { type: blob.type });

    const shareData = {
      title: "Imagem Gerada por IA",
      text: image.prompt,
      files: [file],
    };

    // Verifica se o navegador suporta o compartilhamento de arquivos
    if (navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
    } else {
      // Fallback: Tenta compartilhar apenas a URL (não vai funcionar para data: URI em todos os apps)
      // Um fallback melhor é copiar para a área de transferência, mas a API de Share é o foco.
      // A lógica original de copiar a URL não é útil para data: URI, então focamos no share do arquivo.
      throw new Error("O compartilhamento de arquivos não é suportado neste navegador.");
    }
  } catch (error: any) {
    // Ignora o erro "AbortError" que acontece quando o usuário fecha a janela de compartilhamento
    if (error.name === 'AbortError') {
        return;
    }
    
    console.error("Erro ao compartilhar:", error);
    toast({ title: "Erro ao Partilhar", description: "Não foi possível partilhar a imagem.", variant: "destructive" });
  }
};

/**
 * Extrai os dados essenciais de um objeto de imagem para preparar uma nova geração.
 *
 * @param image O objeto de imagem existente.
 * @returns Um objeto contendo os dados para recriação.
 */
export const getRecreationImageData = (image: GeneratedImage): { prompt: string; model: string; quality: string } => {
  return {
    prompt: image.prompt,
    model: image.model,
    quality: image.quality,
  };
};