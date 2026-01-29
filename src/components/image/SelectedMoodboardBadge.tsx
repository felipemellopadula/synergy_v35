import { X, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Moodboard } from '@/hooks/useMoodboards';

interface SelectedMoodboardBadgeProps {
  moodboard: Moodboard;
  onClear: () => void;
  className?: string;
  maxRefsToShow?: number;
}

export const SelectedMoodboardBadge = ({
  moodboard,
  onClear,
  className,
  maxRefsToShow = 14,
}: SelectedMoodboardBadgeProps) => {
  const refsUsed = Math.min(moodboard.image_count, maxRefsToShow);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full",
              "bg-violet-500/10 border border-violet-500/30",
              "animate-in fade-in-0 slide-in-from-bottom-2 duration-200",
              className
            )}
          >
            {/* Ícone ou Preview */}
            <div className="w-5 h-5 rounded-full overflow-hidden bg-violet-500/20 shrink-0">
              {moodboard.preview_url ? (
                <img 
                  src={moodboard.preview_url} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Palette className="h-3 w-3 text-violet-500" />
                </div>
              )}
            </div>

            {/* Nome */}
            <span className="text-xs font-medium text-violet-600 dark:text-violet-400 truncate max-w-[80px]">
              {moodboard.name}
            </span>

            {/* Contador de refs */}
            <span className="text-[10px] text-muted-foreground">
              ({refsUsed} refs)
            </span>

            {/* Botão de remover */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear();
              }}
              className={cn(
                "p-0.5 rounded-full",
                "hover:bg-violet-500/20 transition-colors",
                "focus:outline-none focus:ring-1 focus:ring-violet-500"
              )}
            >
              <X className="h-3 w-3 text-violet-500/70 hover:text-violet-500" />
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="text-xs">
            <strong>{moodboard.name}</strong> está selecionado.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {refsUsed} imagens serão usadas como referência de estilo 
            para manter padrões de cor e estética.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
