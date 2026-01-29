import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Palette,
  Plus,
  Trash2,
  Upload,
  X,
  Loader2,
  Check,
  Image as ImageIcon,
  Edit2,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Moodboard, MoodboardImage } from '@/hooks/useMoodboards';

interface MoodboardPanelProps {
  moodboards: Moodboard[];
  selectedMoodboard: Moodboard | null;
  moodboardImages: MoodboardImage[];
  isLoading: boolean;
  isUploadingImages: boolean;
  onSelectMoodboard: (moodboard: Moodboard | null) => void;
  onCreateMoodboard: (name: string, description?: string) => Promise<Moodboard | null>;
  onUpdateMoodboard: (id: string, updates: Partial<Moodboard>) => Promise<boolean>;
  onDeleteMoodboard: (id: string) => Promise<boolean>;
  onAddImages: (moodboardId: string, files: File[]) => Promise<number>;
  onRemoveImage: (imageId: string) => Promise<boolean>;
}

export const MoodboardPanel = ({
  moodboards,
  selectedMoodboard,
  moodboardImages,
  isLoading,
  isUploadingImages,
  onSelectMoodboard,
  onCreateMoodboard,
  onUpdateMoodboard,
  onDeleteMoodboard,
  onAddImages,
  onRemoveImage,
}: MoodboardPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<Moodboard | null>(null);
  const [newMoodboardName, setNewMoodboardName] = useState('');
  const [editingMoodboard, setEditingMoodboard] = useState<Moodboard | null>(null);
  const [editName, setEditName] = useState('');
  const [viewingMoodboard, setViewingMoodboard] = useState<Moodboard | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (!newMoodboardName.trim()) return;
    const moodboard = await onCreateMoodboard(newMoodboardName.trim());
    if (moodboard) {
      setNewMoodboardName('');
      setShowCreateDialog(false);
      setViewingMoodboard(moodboard);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteDialog) return;
    await onDeleteMoodboard(showDeleteDialog.id);
    setShowDeleteDialog(null);
    if (viewingMoodboard?.id === showDeleteDialog.id) {
      setViewingMoodboard(null);
    }
  };

  const handleEdit = async () => {
    if (!editingMoodboard || !editName.trim()) return;
    await onUpdateMoodboard(editingMoodboard.id, { name: editName.trim() });
    setEditingMoodboard(null);
    setEditName('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !viewingMoodboard) return;
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      await onAddImages(viewingMoodboard.id, files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectMoodboard = (moodboard: Moodboard) => {
    if (selectedMoodboard?.id === moodboard.id) {
      onSelectMoodboard(null);
    } else {
      onSelectMoodboard(moodboard);
    }
  };

  // Conteúdo do painel
  const PanelContent = () => (
    <div className="flex flex-col h-full">
      {viewingMoodboard ? (
        // Visualização de um moodboard específico
        <>
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewingMoodboard(null)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{viewingMoodboard.name}</h3>
              <p className="text-xs text-muted-foreground">
                {viewingMoodboard.image_count}/14 imagens
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingMoodboard(viewingMoodboard);
                setEditName(viewingMoodboard.name);
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => setShowDeleteDialog(viewingMoodboard)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Grid de imagens */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-3 gap-2 pb-4">
              {/* Botão de adicionar */}
              <Button
                variant="outline"
                className="aspect-square h-auto flex flex-col items-center justify-center gap-1 border-dashed"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImages || viewingMoodboard.image_count >= 14}
              >
                {isUploadingImages ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    <span className="text-[10px]">Adicionar</span>
                  </>
                )}
              </Button>

              {/* Imagens existentes */}
              {moodboardImages.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square rounded-md overflow-hidden group"
                >
                  <img
                    src={img.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => onRemoveImage(img.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Botão de selecionar */}
          <div className="pt-4 border-t">
            <Button
              className="w-full"
              variant={selectedMoodboard?.id === viewingMoodboard.id ? "secondary" : "default"}
              onClick={() => handleSelectMoodboard(viewingMoodboard)}
              disabled={viewingMoodboard.image_count === 0}
            >
              {selectedMoodboard?.id === viewingMoodboard.id ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Selecionado
                </>
              ) : (
                'Usar este Moodboard'
              )}
            </Button>
            {viewingMoodboard.image_count === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Adicione pelo menos uma imagem
              </p>
            )}
          </div>
        </>
      ) : (
        // Lista de moodboards
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Meus Moodboards</h3>
              <p className="text-xs text-muted-foreground">
                {moodboards.length}/10 moodboards
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowCreateDialog(true)}
              disabled={moodboards.length >= 10}
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo
            </Button>
          </div>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : moodboards.length === 0 ? (
              <div className="text-center py-8">
                <Palette className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nenhum moodboard criado
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Crie um moodboard para definir estilos visuais
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {moodboards.map((moodboard) => (
                  <div
                    key={moodboard.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedMoodboard?.id === moodboard.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setViewingMoodboard(moodboard)}
                  >
                    {/* Preview */}
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                      {moodboard.preview_url ? (
                        <img
                          src={moodboard.preview_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{moodboard.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {moodboard.image_count} {moodboard.image_count === 1 ? 'imagem' : 'imagens'}
                      </p>
                    </div>

                    {/* Indicador de selecionado */}
                    {selectedMoodboard?.id === moodboard.id && (
                      <Badge variant="default" className="shrink-0">
                        <Check className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </>
      )}

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-2",
                    selectedMoodboard && "border-primary bg-primary/5"
                  )}
                >
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Moodboard</span>
                  {selectedMoodboard && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                      {selectedMoodboard.image_count}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Gerenciar moodboards de estilo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </SheetTrigger>
        <SheetContent side="right" className="w-[360px] sm:w-[400px]">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Moodboards
            </SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100vh-8rem)]">
            <PanelContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de criar */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Moodboard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Estilo Vintage"
                value={newMoodboardName}
                onChange={(e) => setNewMoodboardName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!newMoodboardName.trim()}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de editar */}
      <Dialog open={!!editingMoodboard} onOpenChange={() => setEditingMoodboard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Moodboard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMoodboard(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={!editName.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de excluir */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir moodboard?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as imagens deste moodboard serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
