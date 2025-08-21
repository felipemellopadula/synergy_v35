// Caminho: src/utils/PdfProcessor.ts

import * as pdfjsLib from 'pdfjs-dist';

// Configurar o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PdfProcessResult {
  success: boolean;
  content?: string;
  error?: string;
  pageCount?: number;
  isPasswordProtected?: boolean;
  fileSize?: number;
}

export class PdfProcessor {
  static readonly MAX_FILE_SIZE_MB = 500;
  static readonly BATCH_SIZE = 50; 

  static async processPdf(file: File): Promise<PdfProcessResult> {
    try {
      if (file.size > this.MAX_FILE_SIZE_MB * 1024 * 1024) {
        return {
          success: false,
          error: `Arquivo muito grande. Tamanho máximo: ${this.MAX_FILE_SIZE_MB}MB`,
          fileSize: parseFloat((file.size / 1024 / 1024).toFixed(2)),
        };
      }
      const arrayBuffer = await file.arrayBuffer();
      const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdfDocument.numPages;
      let fullText = '';
      for (let i = 1; i <= numPages; i += this.BATCH_SIZE) {
        const pagePromises = [];
        const endPage = Math.min(i + this.BATCH_SIZE - 1, numPages);
        for (let j = i; j <= endPage; j++) {
          pagePromises.push(pdfDocument.getPage(j).then(page => page.getTextContent()));
        }
        const textContents = await Promise.all(pagePromises);
        textContents.forEach(textContent => {
          fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n\n';
        });
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      if (!fullText.trim()) {
        return { success: false, error: 'Não foi possível extrair texto do PDF.' };
      }
      return {
        success: true,
        content: fullText.trim(),
        pageCount: numPages,
        fileSize: parseFloat((file.size / 1024 / 1024).toFixed(2)),
      };
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      return { success: false, error: 'Erro interno ao processar o PDF.' };
    }
  }

  // --- **PROMPTS MAIS DIRETOS E CLAROS** ---
  static createSummaryPrompt(content: string, pages: number): string {
    return `### INSTRUÇÃO ###
Você deve criar um resumo executivo detalhado do texto fornecido.
Não use nenhum conhecimento externo. Sua resposta deve se basear 100% no texto abaixo.

### TEXTO DO DOCUMENTO PARA RESUMO (${pages} páginas) ###
"""
${content}
"""

### RESUMO EXECUTIVO: ###`;
  }

  static createAnalysisPrompt(content: string, pages: number, question: string): string {
    return `### INSTRUÇÃO ###
Você deve responder a pergunta do usuário usando APENAS o texto do documento fornecido abaixo como fonte.
Não use nenhum conhecimento externo.

### PERGUNTA DO USUÁRIO ###
"""
${question}
"""

### TEXTO DO DOCUMENTO PARA ANÁLISE (${pages} páginas) ###
"""
${content}
"""

### RESPOSTA DETALHADA: ###`;
  }
}