import { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Copy, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DeepSeekReasoningHistoryProps {
  reasoning: string;
  className?: string;
}

export const DeepSeekReasoningHistory = ({ reasoning, className }: DeepSeekReasoningHistoryProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!reasoning || reasoning.trim().length === 0) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reasoning);
      setCopied(true);
      toast.success('Raciocínio copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar');
    }
  };

  // Calculate stats
  const wordCount = reasoning.split(/\s+/).filter(Boolean).length;
  const lineCount = reasoning.split('\n').filter(Boolean).length;
  const previewLength = 300;
  const needsExpansion = reasoning.length > previewLength;

  return (
    <div className={cn(
      "mt-3 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-fuchsia-500/5 overflow-hidden",
      className
    )}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-violet-500/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
            <Brain className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                Processo de Raciocínio
              </span>
              <Sparkles className="w-3 h-3 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground">
              {wordCount} palavras • {lineCount} etapas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
          <div className="p-1 rounded-md hover:bg-violet-500/10">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out overflow-hidden",
        isExpanded ? "max-h-[600px]" : needsExpansion ? "max-h-32" : "max-h-full"
      )}>
        <div className="px-3 pb-3">
          <div className={cn(
            "relative p-3 rounded-lg bg-background/50 border border-violet-500/10",
            !isExpanded && needsExpansion && "overflow-hidden"
          )}>
            <div className="overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-violet-500/20 scrollbar-track-transparent">
              <pre className="text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap break-words">
                {isExpanded || !needsExpansion 
                  ? reasoning 
                  : reasoning.substring(0, previewLength) + '...'}
              </pre>
            </div>
            
            {/* Fade overlay when collapsed */}
            {!isExpanded && needsExpansion && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background/80 to-transparent pointer-events-none rounded-b-lg" />
            )}
          </div>

          {/* Expand/Collapse button */}
          {needsExpansion && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 w-full py-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center justify-center gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Ver raciocínio completo ({wordCount} palavras)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
