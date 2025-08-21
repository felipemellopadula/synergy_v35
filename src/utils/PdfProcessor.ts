// Caminho: src/utils/PdfProcessor.ts

import * as pdfjsLib from 'pdfjs-dist';

// Configurar o worker do PDF.js - link CDN é uma boa prática
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

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
  static readonly BATCH_SIZE = 50; // Processar em lotes para evitar congelamento da UI

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
      let pdfDocument;

      try {
        pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      } catch (error: any) {
        if (error.name === 'PasswordException') {
          return {
            success: false,
            error: 'PDF protegido por senha. Não é possível processar.',
            isPasswordProtected: true,
            fileSize: parseFloat((file.size / 1024 / 1024).toFixed(2)),
          };
        }
        console.error("Erro ao carregar PDF:", error);
        throw new Error("Não foi possível carregar o documento PDF.");
      }

      const numPages = pdfDocument.numPages;
      console.log(`Iniciando processamento de PDF com ${numPages} páginas...`);

      let fullText = '';
      for (let i = 1; i <= numPages; i += this.BATCH_SIZE) {
        const pagePromises = [];
        const endPage = Math.min(i + this.BATCH_SIZE - 1, numPages);
        for (let j = i; j <= endPage; j++) {
          pagePromises.push(pdfDocument.getPage(j));
        }
        
        const pages = await Promise.all(pagePromises);
        const textContentPromises = pages.map(page => page.getTextContent());
        const textContents = await Promise.all(textContentPromises);

        textContents.forEach(textContent => {
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n\n';
        });

        console.log(`Processou até a página ${endPage}`);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      if (!fullText.trim()) {
        return {
          success: false,
          error: 'Não foi possível extrair texto do PDF. O arquivo pode conter apenas imagens.',
          pageCount: numPages,
          fileSize: parseFloat((file.size / 1024 / 1024).toFixed(2)),
        };
      }

      return {
        success: true,
        content: fullText.trim(),
        pageCount: numPages,
        fileSize: parseFloat((file.size / 1024 / 1024).toFixed(2)),
      };
    } catch (error) {
      console.error('Erro crítico ao processar PDF:', error);
      return {
        success: false,
        error: 'Erro interno ao processar o PDF. Verifique o console para detalhes.',
        fileSize: file ? parseFloat((file.size / 1024 / 1024).toFixed(2)) : 0,
      };
    }
  }

  static createSummaryPrompt(content: string, pages: number): string {
    return `Com base no conteúdo de um documento de ${pages} páginas, crie um resumo executivo abrangente. Destaque os pontos principais, as conclusões mais importantes e quaisquer dados ou estatísticas cruciais.\n\nCONTEÚDO DO DOCUMENTO:\n"""\n${content}\n"""`;
  }

  static createAnalysisPrompt(content: string, pages: number, question: string): string {
    return `Use o conteúdo de um documento de ${pages} páginas como a única fonte de verdade para responder à seguinte pergunta. Seja detalhado e preciso na sua resposta.\n\nPERGUNTA: "${question}"\n\nCONTEÚDO DO DOCUMENTO:\n"""\n${content}\n"""`;
  }
}