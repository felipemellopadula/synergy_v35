import React, { useState, useRef } from 'react';
import { Upload, Sparkles, FileText, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PromptInput } from '@/components/PromptInput';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GeneratedScene {
  sceneNumber: number;
  visualDescription: string;
  motionPrompt: string;
  duration: number;
}

interface StoryBuilderInputProps {
  onScenesGenerated: (scenes: GeneratedScene[]) => void;
  onCancel: () => void;
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
}

export const StoryBuilderInput: React.FC<StoryBuilderInputProps> = ({
  onScenesGenerated,
  onCancel,
  isGenerating,
  setIsGenerating,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [storyText, setStoryText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Use arquivos .txt ou .docx',
        variant: 'destructive',
      });
      return;
    }

    setUploadedFile(file);

    // Read text content
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text();
      setStoryText(text);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For .docx, we'll send directly and let the edge function handle it
      toast({
        title: 'Arquivo carregado',
        description: 'O conteúdo do documento será processado.',
      });
    }
  };

  const handleGenerate = async () => {
    const content = storyText.trim();
    
    if (!content && !uploadedFile) {
      toast({
        title: 'Descreva sua história',
        description: 'Digite uma descrição ou faça upload de um roteiro.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      // For .docx files, read as base64
      let fileContent: string | undefined;
      if (uploadedFile && uploadedFile.type.includes('wordprocessingml')) {
        const buffer = await uploadedFile.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        fileContent = base64;
      }

      const { data, error } = await supabase.functions.invoke('generate-storyboard-scenes', {
        body: {
          storyText: content || undefined,
          fileContent,
          fileName: uploadedFile?.name,
        },
      });

      if (error) throw error;

      if (!data?.scenes || data.scenes.length === 0) {
        throw new Error('Nenhuma cena gerada');
      }

      toast({
        title: `${data.scenes.length} cenas criadas!`,
        description: 'Revise as cenas e gere as imagens.',
      });

      onScenesGenerated(data.scenes);

    } catch (error: any) {
      console.error('Story builder error:', error);
      toast({
        title: 'Erro ao gerar cenas',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Descreva sua história ou cole um roteiro. A IA dividirá automaticamente em cenas.
        </p>
        
        <PromptInput
          value={storyText}
          onChange={setStoryText}
          onSubmit={handleGenerate}
          disabled={isGenerating}
          isGenerating={isGenerating}
          placeholder="Ex: Um homem caminha sozinho por uma floresta nebulosa ao amanhecer. Ele para e observa um cervo distante. O cervo foge e o homem continua sua jornada até encontrar uma cabana antiga..."
          rows={5}
          lang="pt-BR"
        />
      </div>

      {/* File upload area */}
      <div className="border-2 border-dashed rounded-lg p-4 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.docx"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isGenerating}
        />
        
        {uploadedFile ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{uploadedFile.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={removeFile}
              disabled={isGenerating}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating}
          >
            <Upload className="h-4 w-4" />
            Carregar roteiro (.txt, .docx)
          </Button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isGenerating}
        >
          Cancelar
        </Button>
        <Button
          className="flex-1 gap-2"
          onClick={handleGenerate}
          disabled={isGenerating || (!storyText.trim() && !uploadedFile)}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Gerar Cenas
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Custo: 0.1 créditos
      </p>
    </div>
  );
};
