import { useEffect, useState } from 'react';
import { Brain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeepSeekThinkingIndicatorProps {
  isVisible: boolean;
  thinkingContent?: string;
}

const thinkingPhrases = [
  "Analisando a pergunta...",
  "Processando informações...",
  "Elaborando raciocínio...",
  "Conectando conceitos...",
  "Estruturando resposta...",
  "Refinando análise...",
];

export const DeepSeekThinkingIndicator = ({ isVisible, thinkingContent }: DeepSeekThinkingIndicatorProps) => {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isVisible) return;

    // Rotate thinking phrases
    const phraseInterval = setInterval(() => {
      setCurrentPhrase(prev => (prev + 1) % thinkingPhrases.length);
    }, 3000);

    // Animate dots
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => {
      clearInterval(phraseInterval);
      clearInterval(dotsInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const hasThinkingContent = thinkingContent && thinkingContent.length > 0;
  const previewContent = hasThinkingContent 
    ? thinkingContent.slice(-200).split('\n').slice(-3).join('\n') 
    : '';

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border border-violet-500/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
            <Brain className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-3 h-3 text-yellow-400 animate-bounce" />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              DeepSeek Thinking
            </span>
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full bg-violet-400 transition-all duration-300",
                    i < dots.length ? "opacity-100 scale-100" : "opacity-30 scale-75"
                  )}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {thinkingPhrases[currentPhrase]}{dots}
          </p>
        </div>
      </div>

      {/* Thinking preview */}
      {hasThinkingContent && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-violet-500/5 pointer-events-none rounded-lg" />
          <div className="p-3 rounded-lg bg-background/50 border border-violet-500/10 max-h-24 overflow-hidden">
            <p className="text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap opacity-70">
              {previewContent}
              <span className="animate-pulse">▊</span>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/80 to-transparent pointer-events-none rounded-b-lg" />
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-violet-500/20 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-full animate-pulse"
          style={{
            width: hasThinkingContent ? `${Math.min(100, (thinkingContent.length / 50))}%` : '30%',
            transition: 'width 0.5s ease-out'
          }}
        />
      </div>
    </div>
  );
};
