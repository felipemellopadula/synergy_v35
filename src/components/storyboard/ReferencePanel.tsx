import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Image as ImageIcon, Loader2, Edit2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { StoryboardReference } from '@/hooks/useStoryboard';

interface ReferencePanelProps {
  references: StoryboardReference[];
  onAddReference: () => void;
  onUpdateReference: (referenceId: string, updates: Partial<StoryboardReference>) => Promise<StoryboardReference | null>;
  onDeleteReference: (referenceId: string) => Promise<boolean>;
  isLoading?: boolean;
}

export const ReferencePanel: React.FC<ReferencePanelProps> = ({
  references,
  onAddReference,
  onUpdateReference,
  onDeleteReference,
  isLoading,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartEdit = (ref: StoryboardReference) => {
    setEditingId(ref.id);
    setEditName(ref.name);
  };

  const handleSaveEdit = async (refId: string) => {
    if (editName.trim()) {
      await onUpdateReference(refId, { name: editName.trim() });
    }
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className="w-72 bg-card/50 border-l flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Referências</h3>
          <span className="text-xs text-muted-foreground">{references.length} imagens</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Adicione pessoas, produtos ou cenários que serão combinados nas suas cenas.
        </p>
      </div>

      {/* References List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {references.map((ref, index) => (
              <motion.div
                key={ref.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative"
              >
                <div className="aspect-square rounded-lg overflow-hidden border bg-muted relative">
                  <img
                    src={ref.image_url}
                    alt={ref.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Delete Button */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onDeleteReference(ref.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {/* Name Badge */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    {editingId === ref.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-6 text-xs bg-background/80"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(ref.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-white hover:text-white hover:bg-white/20"
                          onClick={() => handleSaveEdit(ref.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center justify-between cursor-pointer group/name"
                        onClick={() => handleStartEdit(ref)}
                      >
                        <span className="text-xs font-medium text-white">{ref.name}</span>
                        <Edit2 className="h-3 w-3 text-white/60 opacity-0 group-hover/name:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Helper text for prompts */}
                <p className="text-[10px] text-muted-foreground mt-1 text-center">
                  Use "{ref.name}" no prompt
                </p>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty State */}
          {references.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <ImageIcon className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-xs text-muted-foreground mb-3">
                Nenhuma referência ainda
              </p>
              <Button onClick={onAddReference} variant="outline" size="sm" className="gap-1">
                <Plus className="h-3 w-3" />
                Adicionar
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add Button */}
      {references.length > 0 && (
        <div className="p-4 border-t">
          <Button onClick={onAddReference} variant="outline" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Referência
          </Button>
        </div>
      )}
    </div>
  );
};
