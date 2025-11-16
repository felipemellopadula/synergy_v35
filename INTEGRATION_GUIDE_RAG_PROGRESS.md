# Guia de Integração: RAG Progress Indicator

Este guia explica como integrar o indicador de progresso RAG no sistema de chat existente.

## Arquivos Criados

1. **src/components/RAGProgressIndicator.tsx** - Componente visual de progresso
2. **src/hooks/useRAGProgress.ts** - Hook para gerenciar estado do progresso
3. **src/components/RAGProgressDemo.tsx** - Demonstração funcional

## Como Usar no Chat Real

### 1. Importar o Hook

```typescript
import { useRAGProgress } from '@/hooks/useRAGProgress';
```

### 2. Inicializar o Hook

```typescript
const {
  progress,
  isProcessing,
  startRAG,
  startChunking,
  updateChunking,
  startAnalysis,
  updateAnalysis,
  startSynthesis,
  updateSynthesis,
  startFiltering,
  updateFiltering,
  startConsolidation,
  updateConsolidation,
  completeRAG,
  resetProgress
} = useRAGProgress({
  totalPages: documentPageCount,
  onComplete: () => {
    console.log('Processamento RAG concluído!');
  }
});
```

### 3. Renderizar o Indicador

```typescript
{progress && (
  <RAGProgressIndicator
    progress={progress}
    documentName={fileName}
    totalPages={totalPages}
  />
)}
```

## Exemplo de Integração no Chat.tsx

### Localização: Função `handleSendMessage` (aproximadamente linha 1600)

```typescript
// Onde está atualmente:
if (shouldUseHierarchicalRAG) {
  functionName = "hierarchical-rag-chat";
  
  // ADICIONAR AQUI:
  startRAG(documentPageCount);
  
  // ... código existente ...
}
```

### Durante o Chunking

```typescript
// No AgenticRAG.ts - função processChunks
async processChunks(chunks: string[], totalPages: number): Promise<string[]> {
  // ADICIONAR:
  startChunking(chunks.length);
  
  const results: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    // ADICIONAR:
    updateChunking(i + 1, chunks.length);
    
    const result = await this.analyzeChunk(chunks[i], i, chunks.length, totalPages);
    results.push(result);
  }
  
  return results;
}
```

### Durante a Análise

```typescript
// No AgenticRAG.ts - função analyzeChunk
async analyzeChunk(chunk: string, index: number, total: number, totalPages: number): Promise<string> {
  // ADICIONAR no início:
  if (index === 0) {
    startAnalysis(total);
  }
  
  // ... código de análise ...
  
  // ADICIONAR após sucesso:
  updateAnalysis(index + 1, total);
  
  return result;
}
```

### Durante a Síntese

```typescript
// No AgenticRAG.ts - função synthesizeSections
async synthesizeSections(sections: any[], userMessage: string): Promise<any[]> {
  // ADICIONAR:
  startSynthesis(sections.length);
  
  const synthesized = [];
  for (let i = 0; i < sections.length; i++) {
    // ADICIONAR:
    updateSynthesis(i + 1, sections.length);
    
    const result = await this.synthesizeSection(sections[i]);
    synthesized.push(result);
  }
  
  return synthesized;
}
```

### Durante a Filtragem

```typescript
// No AgenticRAG.ts - função filterRelevant
async filterRelevant(sections: any[], userMessage: string, totalPages: number): Promise<string[]> {
  // ADICIONAR:
  startFiltering(sections.length);
  
  updateFiltering(25, 'Analisando relevância das seções...');
  
  const { data, error } = await supabase.functions.invoke('rag-filter-relevant', {
    body: { sections, userMessage, maxSections }
  });
  
  updateFiltering(75, 'Ordenando seções por relevância...');
  
  // ... processamento ...
  
  updateFiltering(100, 'Filtragem concluída!');
  
  return filtered;
}
```

### Durante a Consolidação

```typescript
// No AgenticRAG.ts - função consolidate
async consolidate(sections: string[], userMessage: string): Promise<ReadableStream> {
  // ADICIONAR:
  startConsolidation();
  
  updateConsolidation(20, 'Preparando seções para consolidação...');
  
  // ... código de consolidação ...
  
  updateConsolidation(50, 'Gerando resposta consolidada...');
  
  // ... mais processamento ...
  
  updateConsolidation(80, 'Finalizando resposta...');
  
  // Ao finalizar:
  completeRAG();
  
  return stream;
}
```

## Posicionamento Visual no Chat

### Opção 1: Dentro da Mensagem do Bot

```typescript
{message.sender === 'bot' && ragProgress && (
  <RAGProgressIndicator
    progress={ragProgress}
    documentName={currentDocument?.name}
    totalPages={currentDocument?.pages}
    className="mb-4"
  />
)}
```

### Opção 2: Como Overlay Fixo

```typescript
{ragProgress && (
  <div className="fixed bottom-24 right-4 w-96 z-50 shadow-2xl">
    <RAGProgressIndicator
      progress={ragProgress}
      documentName={currentDocument?.name}
      totalPages={currentDocument?.pages}
    />
  </div>
)}
```

### Opção 3: No Header do Chat

```typescript
<header className="border-b p-4 sticky top-0 bg-background/95 backdrop-blur z-20">
  {/* ... conteúdo existente do header ... */}
  
  {ragProgress && (
    <div className="mt-2">
      <RAGProgressIndicator
        progress={ragProgress}
        documentName={currentDocument?.name}
        totalPages={currentDocument?.pages}
      />
    </div>
  )}
</header>
```

## Estimativas de Tempo

As estimativas são calculadas automaticamente baseadas em:

- **Chunking**: ~0.1s por página
- **Analysis**: ~2.0s por página
- **Synthesis**: ~1.5s por página
- **Filtering**: ~0.8s por página
- **Consolidation**: ~1.0s por página

Para ajustar as estimativas, modifique o objeto `timeEstimates` no hook `useRAGProgress.ts`.

## Tratamento de Erros

```typescript
try {
  startRAG(totalPages);
  // ... processamento RAG ...
  completeRAG();
} catch (error) {
  console.error('Erro no processamento RAG:', error);
  resetProgress(); // Limpar o indicador em caso de erro
  toast.error('Erro ao processar documento');
}
```

## Customização Visual

O componente usa tokens semânticos do sistema de design. Para customizar cores:

```typescript
// Em index.css ou tailwind.config.ts
--primary: /* Cor principal das fases ativas */
--success: /* Cor das fases concluídas */
--muted: /* Cor das fases pendentes */
```

## Demo Interativa

Uma demonstração completa está disponível em:
- Componente: `src/components/RAGProgressDemo.tsx`
- Visualização: Disponível na página `/image2`

## Notas Importantes

1. **Performance**: O hook é otimizado com callbacks memorizados
2. **Cancelamento**: Implemente lógica de cancelamento se necessário
3. **Persistência**: O progresso não é persistido - reinicia a cada processamento
4. **Mobile**: O componente é totalmente responsivo

## Próximos Passos

1. Integrar no `AgenticRAG.ts` em todas as fases
2. Adicionar lógica de cancelamento
3. Implementar toast notifications para fases importantes
4. Adicionar analytics para monitorar tempo real vs estimado
