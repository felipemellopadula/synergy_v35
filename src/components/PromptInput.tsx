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
  lang?: string;
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
  const pendingSubmitRef = useRef(false);
  const baseValueRef = useRef(''); // Valor base antes de começar a gravar
  
  // Callback quando a fala termina - dispara geração automaticamente
  const handleSpeechEnd = useCallback((finalText: string) => {
    if (finalText && !disabled && !isGenerating) {
      // Atualizar o valor com o texto final (usando valor base)
      const newValue = baseValueRef.current.trim() 
        ? `${baseValueRef.current} ${finalText}` 
        : finalText;
      onChange(newValue);
      
      // Marcar para submeter no próximo ciclo
      pendingSubmitRef.current = true;
      
      toast.success('🎤 Voz capturada! Gerando...', { duration: 1500 });
    }
  }, [onChange, disabled, isGenerating]);
  
  const { 
    isListening, 
    isSupported, 
    startListening, 
    stopListening, 
    transcript,
    resetTranscript,
    error 
  } = useSpeechToText({ 
    lang,
    autoStopOnSilence: true,
    silenceTimeout: 1500,
    onSpeechEnd: handleSpeechEnd,
  });

  // Efeito para submeter após o valor ser atualizado pela voz
  useEffect(() => {
    if (pendingSubmitRef.current && value.trim() && !disabled && !isGenerating) {
      pendingSubmitRef.current = false;
      setTimeout(() => {
        onSubmit();
      }, 100);
    }
  }, [value, onSubmit, disabled, isGenerating]);

  // Quando a transcrição muda durante a fala, atualiza o preview em tempo real
  useEffect(() => {
    if (transcript && transcript !== lastTranscriptRef.current && isListening) {
      lastTranscriptRef.current = transcript;
      // Atualiza preview em tempo real usando valor base
      const newValue = baseValueRef.current.trim() 
        ? `${baseValueRef.current} ${transcript}` 
        : transcript;
      onChange(newValue);
    }
  }, [transcript, onChange, isListening]);

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
  }, [disabled, isGenerating, value, onSubmit]);

  const toggleMicrophone = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      // Salvar valor atual como base
      baseValueRef.current = value;
      lastTranscriptRef.current = '';
      pendingSubmitRef.current = false;
      resetTranscript();
      startListening();
      toast.info('🎤 Gravando... Pare de falar para gerar', { duration: 2500 });
    }
  }, [isListening, startListening, stopListening, resetTranscript, value]);

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
                    title={isListening ? "Parar gravação" : "Gravar voz (para de falar para gerar)"}
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
          Gravando... Pare de falar para gerar
        </div>
      )}
    </div>
  );
};
