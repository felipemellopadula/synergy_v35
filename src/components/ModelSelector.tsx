import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Model {
  id: string;
  name: string;
  provider: string;
  category: 'premium' | 'standard' | 'fast';
}

const models: Model[] = [
  // OpenAI Models
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', category: 'premium' },
  { id: 'gpt-o3', name: 'GPT-o3', provider: 'OpenAI', category: 'premium' },
  { id: 'gpt-o4', name: 'GPT-o4', provider: 'OpenAI', category: 'premium' },
  { id: 'o4-mini', name: 'o4 Mini', provider: 'OpenAI', category: 'fast' },
  { id: '4o-mini', name: '4o Mini', provider: 'OpenAI', category: 'fast' },
  
  // Anthropic Models
  { id: 'claude-4-sonnet', name: 'Claude 4 Sonnet', provider: 'Anthropic', category: 'premium' },
  { id: 'claude-4-opus', name: 'Claude 4 Opus', provider: 'Anthropic', category: 'premium' },
  
  // xAI Models
  { id: 'grok-4', name: 'Grok 4', provider: 'xAI', category: 'standard' },
  { id: 'grok-3', name: 'Grok 3', provider: 'xAI', category: 'standard' },
  
  // Google Models
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', category: 'fast' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', category: 'premium' },
  
  // Meta Models
  { id: 'llama', name: 'Llama', provider: 'Meta', category: 'standard' },
];

interface ModelSelectorProps {
  onModelSelect: (modelId: string) => void;
  selectedModel?: string;
}

const getCategoryColor = (category: Model['category']) => {
  switch (category) {
    case 'premium': return 'bg-primary text-primary-foreground';
    case 'standard': return 'bg-secondary text-secondary-foreground';
    case 'fast': return 'bg-success text-success-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

export const ModelSelector = ({ onModelSelect, selectedModel }: ModelSelectorProps) => {
  return (
    <div className="w-full max-w-sm">
      <Select onValueChange={onModelSelect} value={selectedModel}>
        <SelectTrigger className="w-full bg-card border-border">
          <SelectValue placeholder="Selecione um modelo" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border max-h-60">
          {models.map((model) => (
            <SelectItem 
              key={model.id} 
              value={model.id}
              className="cursor-pointer hover:bg-accent"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col items-start">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">{model.provider}</span>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`ml-2 text-xs ${getCategoryColor(model.category)}`}
                >
                  {model.category}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};