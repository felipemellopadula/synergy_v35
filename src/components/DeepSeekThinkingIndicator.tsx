import { useEffect, useState } from 'react';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeepSeekThinkingIndicatorProps {
  isVisible: boolean;
  thinkingContent?: string;
}

export const DeepSeekThinkingIndicator = ({ isVisible, thinkingContent }: DeepSeekThinkingIndicatorProps) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isVisible) return;

    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);

    return () => clearInterval(dotsInterval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 backdrop-blur-sm">
      <div className="p-1.5 rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
        <Brain className="w-3.5 h-3.5 text-white animate-pulse" />
      </div>
      
      <span className="text-xs font-medium text-violet-400">
        Pensando{dots}
      </span>
      
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "w-1 h-1 rounded-full bg-violet-400 transition-all duration-300",
              i < dots.length ? "opacity-100" : "opacity-30"
            )}
          />
        ))}
      </div>
    </div>
  );
};
