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
  onTranscript?: (text: string) => void;
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
  const { lang = 'pt-BR', continuous = true, onTranscript, onError } = options;
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef('');

  const isSupported = typeof window !== 'undefined' && 
    (typeof window.SpeechRecognition !== 'undefined' || typeof window.webkitSpeechRecognition !== 'undefined');

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
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }
      
      if (finalTranscript) {
        transcriptRef.current += (transcriptRef.current ? ' ' : '') + finalTranscript.trim();
        setTranscript(transcriptRef.current);
        onTranscript?.(transcriptRef.current);
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
          errorMessage = 'Nenhuma fala detectada';
          break;
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
      
      setError(errorMessage);
      setIsListening(false);
      onError?.(errorMessage);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSupported, lang, continuous, onTranscript, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    
    setError(null);
    transcriptRef.current = '';
    setTranscript('');
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // Pode falhar se já estiver escutando
      console.error('Erro ao iniciar reconhecimento:', e);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
    } catch (e) {
      // Pode falhar se já estiver parado
      console.error('Erro ao parar reconhecimento:', e);
    }
    setIsListening(false);
  }, []);

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
