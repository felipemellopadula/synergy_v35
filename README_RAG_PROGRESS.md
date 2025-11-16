# 📊 RAG Progress Indicator - Documentação

Sistema completo de visualização de progresso para processamento RAG (Retrieval Augmented Generation) com estimativas de tempo e progresso detalhado por fase.

## 🎯 Funcionalidades

### Indicador Visual Completo
- ✅ **5 Fases do RAG**: Chunking, Análise, Síntese, Filtragem, Consolidação
- ⏱️ **Estimativa de Tempo**: Cálculo automático baseado no número de páginas
- 📈 **Progresso Detalhado**: Barra de progresso para fase atual e progresso global
- 🎨 **Design Responsivo**: Interface adaptada para desktop e mobile
- 🔄 **Estado em Tempo Real**: Atualização instantânea do progresso

### Informações Exibidas
- Nome do documento sendo processado
- Total de páginas
- Fase atual com ícone e descrição
- Porcentagem de conclusão por fase
- Tempo estimado restante
- Etapas concluídas vs total de etapas
- Timeline visual com todas as fases

## 📁 Arquivos Criados

```
src/
├── components/
│   ├── RAGProgressIndicator.tsx    # Componente visual principal
│   └── RAGProgressDemo.tsx         # Demo interativa
├── hooks/
│   └── useRAGProgress.ts           # Hook de gerenciamento de estado
```

## 🚀 Como Usar

### 1. Importar o Hook

```typescript
import { useRAGProgress } from '@/hooks/useRAGProgress';
import { RAGProgressIndicator } from '@/components/RAGProgressIndicator';
```

### 2. Inicializar

```typescript
const {
  progress,
  isProcessing,
  startRAG,
  updateChunking,
  updateAnalysis,
  updateSynthesis,
  updateFiltering,
  updateConsolidation,
  completeRAG
} = useRAGProgress({
  totalPages: 150,
  onComplete: () => console.log('Concluído!')
});
```

### 3. Renderizar

```typescript
{progress && (
  <RAGProgressIndicator
    progress={progress}
    documentName="meu-documento.pdf"
    totalPages={150}
  />
)}
```

### 4. Atualizar Progresso

```typescript
// Iniciar processamento
startRAG(totalPages);

// Durante chunking
updateChunking(currentChunk, totalChunks);

// Durante análise
updateAnalysis(currentChunk, totalChunks);

// Durante síntese
updateSynthesis(currentSection, totalSections);

// Durante filtragem
updateFiltering(progressPercent, 'Filtrando seções relevantes...');

// Durante consolidação
updateConsolidation(progressPercent, 'Gerando resposta final...');

// Ao concluir
completeRAG();
```

## 🎨 Fases do RAG

### 1. 📄 Chunking (Divisão)
**Cor**: Azul  
**Descrição**: Dividindo documento em blocos processáveis  
**Tempo Base**: ~0.1s por página

### 2. 🔍 Analysis (Análise)
**Cor**: Roxo  
**Descrição**: Analisando conteúdo de cada chunk  
**Tempo Base**: ~2.0s por página

### 3. ✨ Synthesis (Síntese)
**Cor**: Rosa  
**Descrição**: Sintetizando seções lógicas  
**Tempo Base**: ~1.5s por página

### 4. 🎯 Filtering (Filtragem)
**Cor**: Laranja  
**Descrição**: Filtrando conteúdo relevante  
**Tempo Base**: ~0.8s por página

### 5. 📝 Consolidation (Consolidação)
**Cor**: Verde  
**Descrição**: Gerando resposta final  
**Tempo Base**: ~1.0s por página

## 🎬 Demo Interativa

Uma demonstração completa está disponível na página `/image2`:

```typescript
import { RAGProgressDemo } from '@/components/RAGProgressDemo';

// Em qualquer página
<RAGProgressDemo />
```

### Funcionalidades da Demo
- ✅ Simulação completa de todas as fases
- ✅ Estimativas de tempo realistas
- ✅ Botão de iniciar/resetar
- ✅ Informações do documento
- ✅ Auto-reset após conclusão

## 📊 API do Hook

### Propriedades

```typescript
interface UseRAGProgressOptions {
  totalPages?: number;      // Total de páginas do documento
  onComplete?: () => void;  // Callback ao concluir
}
```

### Retorno

```typescript
{
  progress: RAGProgress | null;      // Estado atual do progresso
  isProcessing: boolean;             // Se está processando
  
  // Funções de controle
  startRAG: (totalPages?: number) => void;
  startChunking: (totalChunks?: number) => void;
  updateChunking: (completed: number, total: number) => void;
  startAnalysis: (totalChunks?: number) => void;
  updateAnalysis: (completed: number, total: number) => void;
  startSynthesis: (totalSections?: number) => void;
  updateSynthesis: (completed: number, total: number) => void;
  startFiltering: (totalSections?: number) => void;
  updateFiltering: (progress: number, description?: string) => void;
  startConsolidation: () => void;
  updateConsolidation: (progress: number, description?: string) => void;
  completeRAG: () => void;
  resetProgress: () => void;
}
```

### Tipo RAGProgress

```typescript
interface RAGProgress {
  phase: 'chunking' | 'analysis' | 'synthesis' | 'filtering' | 'consolidation';
  progress: number;              // 0-100
  currentStep?: string;          // Descrição atual
  estimatedTimeRemaining?: number; // Segundos
  totalSteps?: number;           // Total de etapas
  completedSteps?: number;       // Etapas concluídas
}
```

## 🎨 Customização

### Cores

As cores são baseadas no sistema de design semântico. Para customizar:

```css
/* Em index.css */
:root {
  --primary: /* Cor das fases ativas */
  --success: /* Cor das fases concluídas */
  --muted: /* Cor das fases pendentes */
}
```

### Estimativas de Tempo

Para ajustar as estimativas por fase:

```typescript
// Em useRAGProgress.ts
const timeEstimates = {
  chunking: 0.1,      // segundos por página
  analysis: 2.0,
  synthesis: 1.5,
  filtering: 0.8,
  consolidation: 1.0
};
```

### Posicionamento

```typescript
// Como overlay fixo
<div className="fixed bottom-24 right-4 w-96 z-50">
  <RAGProgressIndicator {...props} />
</div>

// Inline no chat
<div className="my-4">
  <RAGProgressIndicator {...props} />
</div>

// No header
<header>
  {progress && <RAGProgressIndicator {...props} />}
</header>
```

## 📱 Responsividade

O componente é totalmente responsivo:
- **Desktop**: Largura máxima de 672px (max-w-2xl)
- **Mobile**: Largura 100% com padding ajustado
- **Texto**: Truncado automaticamente quando necessário
- **Ícones**: Dimensões adaptativas

## 🔧 Integração com Sistema Existente

### No Chat.tsx (aprox. linha 1600)

```typescript
// Adicionar estado
const ragProgress = useRAGProgress({ totalPages: documentPageCount });

// No início do processamento RAG
if (shouldUseHierarchicalRAG) {
  ragProgress.startRAG(documentPageCount);
  // ... código existente ...
}

// Renderizar na UI
{ragProgress.progress && (
  <RAGProgressIndicator
    progress={ragProgress.progress}
    documentName={fileName}
    totalPages={documentPageCount}
  />
)}
```

### No AgenticRAG.ts

Adicionar callbacks nas funções de processamento para atualizar o progresso em tempo real.

## ⚡ Performance

- **Memoização**: Todos os callbacks são memorizados
- **Cálculos**: Estimativas calculadas eficientemente
- **Re-renders**: Minimizados com uso correto de state
- **Bundle Size**: ~8KB minificado

## 🐛 Tratamento de Erros

```typescript
try {
  startRAG(totalPages);
  // ... processamento ...
  completeRAG();
} catch (error) {
  resetProgress(); // Limpar estado
  toast.error('Erro no processamento');
}
```

## 📖 Guia de Integração Completo

Consulte `INTEGRATION_GUIDE_RAG_PROGRESS.md` para instruções detalhadas de integração no código existente.

## 🎯 Próximos Passos Sugeridos

1. ✅ Integrar no `AgenticRAG.ts`
2. ✅ Adicionar no `Chat.tsx`
3. ✅ Implementar cancelamento de processamento
4. ✅ Adicionar toast notifications
5. ✅ Analytics de tempo real vs estimado
6. ✅ Persistência de estado (opcional)

## 🤝 Suporte

Para dúvidas ou problemas:
1. Consulte a demo em `/image2`
2. Verifique o guia de integração
3. Teste com dados reais no chat
