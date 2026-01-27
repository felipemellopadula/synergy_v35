import { useState, useCallback, useRef, useEffect } from 'react';

// Tipos para Web Speech API (compatível com diferentes navegadores)
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEventCustom extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventCustom extends Event {
  readonly error: string;
  readonly message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventCustom) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventCustom) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInstance;
}

// Declaração global para TypeScript
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface UseSpeechToTextOptions {
  lang?: string;
  continuous?: boolean;
  autoStopOnSilence?: boolean; // Para automaticamente quando detecta silêncio
  silenceTimeout?: number; // Tempo em ms para considerar silêncio (default: 1500ms)
  onTranscript?: (text: string) => void;
  onSpeechEnd?: (finalText: string) => void; // Callback quando a fala termina
  onError?: (error: string) => void;
}

interface UseSpeechToTextReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  resetTranscript: () => void;
  error: string | null;
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const { 
    lang = 'pt-BR', 
    continuous = false, // Mudei para false por padrão (para auto-stop)
    autoStopOnSilence = true,
    silenceTimeout = 1500,
    onTranscript, 
    onSpeechEnd,
    onError 
  } = options;
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef('');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSpokenRef = useRef(false);

  const isSupported = typeof window !== 'undefined' && 
    (typeof window.SpeechRecognition !== 'undefined' || typeof window.webkitSpeechRecognition !== 'undefined');
  
  // Limpar timer de silêncio
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Parar reconhecimento e disparar callback
  const handleSpeechEnd = useCallback(() => {
    clearSilenceTimer();
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignorar erro se já estiver parado
      }
    }
    
    setIsListening(false);
    
    // Só dispara callback se tiver texto transcrito
    if (transcriptRef.current.trim()) {
      onSpeechEnd?.(transcriptRef.current.trim());
    }
  }, [clearSilenceTimer, onSpeechEnd]);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    
    const recognition = new SpeechRecognitionAPI();
    
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: SpeechRecognitionEventCustom) => {
      let finalTranscript = '';
      let hasInterim = false;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          hasInterim = true;
        }
      }
      
      if (finalTranscript) {
        hasSpokenRef.current = true;
        transcriptRef.current += (transcriptRef.current ? ' ' : '') + finalTranscript.trim();
        setTranscript(transcriptRef.current);
        onTranscript?.(transcriptRef.current);
        
        // Resetar timer de silêncio quando há resultado final
        if (autoStopOnSilence) {
          clearSilenceTimer();
          silenceTimerRef.current = setTimeout(() => {
            handleSpeechEnd();
          }, silenceTimeout);
        }
      }
      
      // Se está processando áudio (interim) mas ainda sem resultado final, resetar timer
      if (hasInterim && autoStopOnSilence) {
        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          handleSpeechEnd();
        }, silenceTimeout);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventCustom) => {
      let errorMessage = 'Erro de reconhecimento de voz';
      
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          errorMessage = 'Permissão de microfone negada';
          break;
        case 'no-speech':
          // Se não detectou fala, não mostrar erro - apenas parar silenciosamente
          clearSilenceTimer();
          setIsListening(false);
          return;
        case 'audio-capture':
          errorMessage = 'Microfone não encontrado';
          break;
        case 'network':
          errorMessage = 'Erro de conexão';
          break;
        case 'aborted':
          // Ignorar erro de abort (usuário parou)
          return;
      }
      
      clearSilenceTimer();
      setError(errorMessage);
      setIsListening(false);
      onError?.(errorMessage);
    };

    recognition.onend = () => {
      clearSilenceTimer();
      setIsListening(false);
      
      // Se tinha texto e parou naturalmente, dispara callback
      if (hasSpokenRef.current && transcriptRef.current.trim()) {
        onSpeechEnd?.(transcriptRef.current.trim());
      }
    };

    recognitionRef.current = recognition;

    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSupported, lang, continuous, autoStopOnSilence, silenceTimeout, onTranscript, onSpeechEnd, onError, clearSilenceTimer, handleSpeechEnd]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    
    setError(null);
    transcriptRef.current = '';
    setTranscript('');
    hasSpokenRef.current = false;
    clearSilenceTimer();
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // Pode falhar se já estiver escutando
      console.error('Erro ao iniciar reconhecimento:', e);
    }
  }, [isListening, clearSilenceTimer]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    clearSilenceTimer();
    
    try {
      recognitionRef.current.stop();
    } catch (e) {
      // Pode falhar se já estiver parado
      console.error('Erro ao parar reconhecimento:', e);
    }
    setIsListening(false);
  }, [clearSilenceTimer]);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = '';
    setTranscript('');
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    transcript,
    resetTranscript,
    error,
  };
}
