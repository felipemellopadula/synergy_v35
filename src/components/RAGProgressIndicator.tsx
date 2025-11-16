import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Scissors, 
  Search, 
  Sparkles, 
  Filter, 
  Check, 
  Loader2,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

export type RAGPhase = 'chunking' | 'analysis' | 'synthesis' | 'filtering' | 'consolidation';

export interface RAGProgress {
  phase: RAGPhase;
  progress: number; // 0-100
  currentStep?: string;
  estimatedTimeRemaining?: number; // em segundos
  totalSteps?: number;
  completedSteps?: number;
}

interface RAGProgressIndicatorProps {
  progress: RAGProgress;
  documentName?: string;
  totalPages?: number;
  className?: string;
}

const phaseConfig: Record<RAGPhase, {
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
}> = {
  chunking: {
    icon: Scissors,
    label: "Divisão em Blocos",
    description: "Dividindo documento em chunks processáveis",
    color: "text-blue-500"
  },
  analysis: {
    icon: Search,
    label: "Análise",
    description: "Analisando conteúdo de cada chunk",
    color: "text-purple-500"
  },
  synthesis: {
    icon: Sparkles,
    label: "Síntese",
    description: "Sintetizando seções lógicas",
    color: "text-pink-500"
  },
  filtering: {
    icon: Filter,
    label: "Filtragem",
    description: "Filtrando conteúdo relevante",
    color: "text-orange-500"
  },
  consolidation: {
    icon: FileText,
    label: "Consolidação",
    description: "Gerando resposta final",
    color: "text-green-500"
  }
};

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export const RAGProgressIndicator = ({ 
  progress, 
  documentName, 
  totalPages,
  className 
}: RAGProgressIndicatorProps) => {
  const phases: RAGPhase[] = ['chunking', 'analysis', 'synthesis', 'filtering', 'consolidation'];
  const currentPhaseIndex = phases.indexOf(progress.phase);
  const config = phaseConfig[progress.phase];
  const Icon = config.icon;

  const getPhaseStatus = (phase: RAGPhase): 'completed' | 'current' | 'pending' => {
    const phaseIndex = phases.indexOf(phase);
    if (phaseIndex < currentPhaseIndex) return 'completed';
    if (phaseIndex === currentPhaseIndex) return 'current';
    return 'pending';
  };

  return (
    <Card className={cn("w-full border-primary/20 shadow-lg", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Processamento RAG em Andamento
            </CardTitle>
            {documentName && (
              <CardDescription className="text-sm">
                {documentName} {totalPages && `(${totalPages} páginas)`}
              </CardDescription>
            )}
          </div>
          {progress.estimatedTimeRemaining !== undefined && (
            <Badge variant="outline" className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              ~{formatTime(progress.estimatedTimeRemaining)}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Fase Atual - Destaque */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-start gap-3 mb-3">
            <div className={cn("p-2 rounded-md bg-background", config.color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-sm">{config.label}</h4>
                <span className="text-xs text-muted-foreground font-medium">
                  {progress.progress}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {progress.currentStep || config.description}
              </p>
              <Progress value={progress.progress} className="h-2" />
              {progress.completedSteps !== undefined && progress.totalSteps && (
                <p className="text-xs text-muted-foreground mt-2">
                  {progress.completedSteps} de {progress.totalSteps} etapas concluídas
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Timeline de Todas as Fases */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-3">Pipeline de Processamento</p>
          <div className="space-y-2">
            {phases.map((phase, index) => {
              const phaseStatus = getPhaseStatus(phase);
              const phaseConf = phaseConfig[phase];
              const PhaseIcon = phaseConf.icon;
              
              return (
                <div 
                  key={phase}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md transition-all",
                    phaseStatus === 'current' && "bg-primary/5",
                    phaseStatus === 'completed' && "opacity-60"
                  )}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      phaseStatus === 'completed' 
                        ? "border-green-500 bg-green-500 text-white"
                        : phaseStatus === 'current'
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted bg-background text-muted-foreground"
                    )}>
                      {phaseStatus === 'completed' ? (
                        <Check className="h-3 w-3" />
                      ) : phaseStatus === 'current' ? (
                        <PhaseIcon className="h-3 w-3" />
                      ) : (
                        <span className="text-[10px] font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs font-medium truncate",
                      phaseStatus === 'current' && "text-foreground",
                      phaseStatus === 'completed' && "text-muted-foreground line-through",
                      phaseStatus === 'pending' && "text-muted-foreground"
                    )}>
                      {phaseConf.label}
                    </span>
                  </div>
                  {phaseStatus === 'current' && (
                    <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />
                  )}
                  {phaseStatus === 'completed' && (
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5 shrink-0">
                      Concluído
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Indicador de Progresso Global */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Progresso Global</span>
            <span className="text-xs font-semibold">
              {Math.round(((currentPhaseIndex * 100) + progress.progress) / phases.length)}%
            </span>
          </div>
          <Progress 
            value={((currentPhaseIndex * 100) + progress.progress) / phases.length} 
            className="h-1.5"
          />
        </div>
      </CardContent>
    </Card>
  );
};
