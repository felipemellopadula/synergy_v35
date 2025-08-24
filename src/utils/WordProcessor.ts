import * as mammoth from 'mammoth';

export interface WordProcessingResult {
  success: boolean;
  content?: string;
  error?: string;
}

export class WordProcessor {
  static async processWord(file: File): Promise<WordProcessingResult> {
    try {
      console.log('Processing Word file:', file.name, 'Size:', file.size);

      // Verificar se é um arquivo Word válido
      const isDocx = file.type.includes('word') || file.name.toLowerCase().endsWith('.docx');
      const isDoc = file.name.toLowerCase().endsWith('.doc');
      
      if (!isDocx && !isDoc) {
        return {
          success: false,
          error: 'Arquivo deve ser um documento Word (.docx ou .doc)'
        };
      }

      // Arquivos .doc (formato antigo) não são suportados pela biblioteca mammoth
      if (isDoc && !isDocx) {
        return {
          success: false,
          error: 'Arquivos .doc (formato antigo) não são suportados. Por favor, converta para .docx ou use um arquivo .docx.'
        };
      }

      console.log('Convertendo Word para texto...');

      const arrayBuffer = await file.arrayBuffer();
      
      // Usar mammoth para converter o arquivo Word para texto
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      if (!result.value || result.value.trim().length === 0) {
        return {
          success: false,
          error: 'Documento Word parece estar vazio ou não foi possível extrair texto'
        };
      }

      // Log das mensagens de warning, se houver
      if (result.messages && result.messages.length > 0) {
        const warnings = result.messages.filter(m => m.type === 'warning');
        if (warnings.length > 0) {
          console.warn('Warnings during Word processing:', warnings);
        }
      }

      const content = result.value.trim();
      
      console.log('Word processed successfully:', {
        fileName: file.name,
        contentLength: content.length,
        contentPreview: content.substring(0, 200) + '...'
      });

      return {
        success: true,
        content: content
      };

    } catch (error: any) {
      console.error('Erro ao processar Word:', error);
      
      // Verificar se o erro é devido ao formato .doc
      if (error.message && error.message.includes('Could not find the body element')) {
        return {
          success: false,
          error: 'Este arquivo parece ser um .doc (formato antigo). Por favor, use arquivos .docx (formato moderno) ou converta o arquivo.'
        };
      }
      
      return {
        success: false,
        error: `Falha ao processar documento Word: ${error.message || 'Erro desconhecido'}`
      };
    }
  }
}