import React, { useRef, useCallback, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  placeholder?: string;
  className?: string;
  textareaClassName?: string;
  rows?: number;
  lang?: string; // Idioma para speech recognition (default: pt-BR)
}

export const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  isGenerating = false,
  placeholder = 'Descreva sua ideia...',
  className,
  textareaClassName,
  rows = 1,
  lang = 'pt-BR',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTranscriptRef = useRef('');
  
  const { 
    isListening, 
    isSupported, 
    startListening, 
    stopListening, 
    transcript,
    resetTranscript,
    error 
  } = useSpeechToText({ lang });

  // Quando a transcrição muda, adiciona ao prompt
  useEffect(() => {
    if (transcript && transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript;
      // Adiciona o texto transcrito ao valor atual
      const newValue = value.trim() ? `${value} ${transcript}` : transcript;
      onChange(newValue);
    }
  }, [transcript, value, onChange]);

  // Mostrar erro de microfone
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Handler de teclado: ENTER envia, SHIFT+ENTER quebra linha
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isGenerating && value.trim()) {
        onSubmit();
      }
    }
    // SHIFT+ENTER permite quebra de linha naturalmente (comportamento padrão)
  }, [disabled, isGenerating, value, onSubmit]);

  const toggleMicrophone = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      lastTranscriptRef.current = '';
      resetTranscript();
      startListening();
      toast.info('🎤 Gravando... Fale agora', { duration: 2000 });
    }
  }, [isListening, startListening, stopListening, resetTranscript]);

  const isDisabled = disabled || isGenerating;

  return (
    <div className={cn("relative w-full", className)}>
      <TooltipProvider>
        <Tooltip open={isGenerating ? undefined : false}>
          <TooltipTrigger asChild>
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isDisabled}
                rows={rows}
                className={cn(
                  "resize-none min-h-[44px] pr-16",
                  isGenerating && "cursor-not-allowed opacity-70 border-primary/50 animate-pulse",
                  isListening && "border-red-500 ring-2 ring-red-500/30",
                  textareaClassName
                )}
              />
              
              {/* Controles internos */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {/* Indicador de geração */}
                {isGenerating && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                
                {/* Botão de microfone */}
                {isSupported && !isGenerating && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-full",
                      isListening && "text-red-500 bg-red-500/10 animate-pulse"
                    )}
                    onClick={toggleMicrophone}
                    disabled={isDisabled}
                    title={isListening ? "Parar gravação" : "Gravar voz (ENTER para enviar)"}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-primary text-primary-foreground">
            <p>Gerando... Aguarde.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Indicador de gravação */}
      {isListening && (
        <div className="absolute -bottom-6 left-0 text-xs text-red-500 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Gravando... Fale agora
        </div>
      )}
    </div>
  );
};
