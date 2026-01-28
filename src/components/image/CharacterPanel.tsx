import { useState, useRef, useCallback } from 'react';
import { 
  Plus, 
  User, 
  ChevronRight, 
  Trash2, 
  Upload, 
  X, 
  ImagePlus,
  Loader2,
  Check,
  PencilLine,
  Sparkles,
  Wand2,
  Crown,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
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
import { useIsMobile } from '@/hooks/use-mobile';
import type { Character, CharacterImage } from '@/hooks/useCharacters';

interface CharacterPanelProps {
  characters: Character[];
  selectedCharacter: Character | null;
  characterImages: CharacterImage[];
  isLoading: boolean;
  isUploadingImages: boolean;
  useMasterAvatar: boolean;
  onUseMasterAvatarChange: (value: boolean) => void;
  onSelectCharacter: (character: Character | null) => void;
  onCreateCharacter: (name: string, description?: string) => Promise<Character | null>;
  onUpdateCharacter: (id: string, updates: Partial<Pick<Character, 'name' | 'description'>>) => Promise<boolean>;
  onDeleteCharacter: (id: string) => Promise<boolean>;
  onAddImages: (characterId: string, files: File[]) => Promise<number>;
  onRemoveImage: (imageId: string) => Promise<boolean>;
  onGenerateMasterAvatar: (characterId: string) => Promise<string | null>;
  // Controle de visibilidade do painel (desktop)
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
}

// Componente de card do personagem
const CharacterCard = ({
  character,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: {
  character: Character;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
        "hover:bg-accent/50",
        isSelected && "bg-primary/10 ring-1 ring-primary/30"
      )}
      onClick={onSelect}
    >
      {/* Avatar */}
      <div className={cn(
        "relative shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-muted",
        "ring-2 ring-offset-2 ring-offset-background transition-all",
        isSelected ? "ring-primary" : "ring-transparent"
      )}>
        {/* Priorizar master_avatar_url se existir */}
        {character.master_avatar_url ? (
          <img 
            src={character.master_avatar_url} 
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : character.avatar_url ? (
          <img 
            src={character.avatar_url} 
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        {/* Badge de Master Avatar */}
        {character.master_avatar_url && (
          <div className="absolute -top-1 -right-1 bg-violet-500 rounded-full p-0.5">
            <Crown className="h-2.5 w-2.5 text-white" />
          </div>
        )}
        {isSelected && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <Check className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{character.name}</p>
        <p className="text-xs text-muted-foreground">
          {character.image_count} {character.image_count === 1 ? 'imagem' : 'imagens'}
        </p>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <PencilLine className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Editar</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Excluir</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  );
};

// Componente de detalhe do personagem (galeria de imagens + Master Avatar)
const CharacterDetail = ({
  character,
  images,
  isUploading,
  isGeneratingMaster,
  useMasterAvatar,
  onUseMasterAvatarChange,
  onAddImages,
  onRemoveImage,
  onGenerateMasterAvatar,
  onBack,
}: {
  character: Character;
  images: CharacterImage[];
  isUploading: boolean;
  isGeneratingMaster: boolean;
  useMasterAvatar: boolean;
  onUseMasterAvatarChange: (value: boolean) => void;
  onAddImages: (files: File[]) => void;
  onRemoveImage: (imageId: string) => void;
  onGenerateMasterAvatar: () => void;
  onBack: () => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      onAddImages(files);
    }
  }, [onAddImages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onAddImages(Array.from(e.target.files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ChevronRight className="h-4 w-4 rotate-180" />
        </Button>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{character.name}</h3>
          <p className="text-xs text-muted-foreground">
            {images.length}/70 imagens
          </p>
        </div>
      </div>

      {/* Master Avatar Section */}
      <div className="p-4 border-b space-y-3">
        {/* Preview do Master Avatar */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted",
            "ring-2 ring-offset-2 ring-offset-background",
            character.master_avatar_url ? "ring-violet-500" : "ring-transparent"
          )}>
            {character.master_avatar_url ? (
              <img 
                src={character.master_avatar_url} 
                className="w-full h-full object-cover"
                alt="Master Avatar"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground/50" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-1.5">
              <Crown className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-medium">Avatar Master</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {character.master_avatar_url 
                ? 'Referência consolidada para consistência' 
                : 'Gere um retrato único do personagem'}
            </p>
          </div>
        </div>

        {/* Botão gerar/regenerar */}
        <Button 
          onClick={onGenerateMasterAvatar}
          disabled={isGeneratingMaster || images.length === 0}
          variant={character.master_avatar_url ? "outline" : "default"}
          className="w-full"
          size="sm"
        >
          {isGeneratingMaster ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando Avatar...
            </>
          ) : character.master_avatar_url ? (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Regenerar Avatar
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar Avatar Master
            </>
          )}
        </Button>

        {/* Toggle usar Master Avatar */}
        {character.master_avatar_url && (
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <Switch 
                id="use-master"
                checked={useMasterAvatar}
                onCheckedChange={onUseMasterAvatarChange}
              />
              <Label htmlFor="use-master" className="text-xs cursor-pointer">
                Usar Avatar Master
              </Label>
            </div>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px]">
                  <p className="text-xs">
                    <strong>Ligado:</strong> Usa apenas o Avatar Master (melhor para modelos com poucas referências)
                  </p>
                  <p className="text-xs mt-1">
                    <strong>Desligado:</strong> Usa múltiplas imagens de referência
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* Upload zone */}
      <div
        className={cn(
          "m-4 p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer",
          "flex flex-col items-center justify-center gap-2 text-center",
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50",
          isUploading && "pointer-events-none opacity-50"
        )}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Enviando imagens...</p>
          </>
        ) : (
          <>
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Arraste imagens ou clique</p>
            <p className="text-xs text-muted-foreground">
              Adicione até 70 fotos do personagem
            </p>
          </>
        )}
      </div>

      {/* Grid de imagens */}
      <ScrollArea className="flex-1 px-4">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <User className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Nenhuma imagem ainda</p>
            <p className="text-xs">Adicione fotos para manter consistência</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 pb-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square rounded-lg overflow-hidden bg-muted"
              >
                <img
                  src={image.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <button
                  className={cn(
                    "absolute top-1 right-1 p-1.5 rounded-full",
                    "bg-black/60 text-white opacity-0 group-hover:opacity-100",
                    "hover:bg-destructive transition-all"
                  )}
                  onClick={() => setDeletingImageId(image.id)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Confirmação de exclusão de imagem */}
      <AlertDialog open={!!deletingImageId} onOpenChange={() => setDeletingImageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover imagem?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingImageId) {
                  onRemoveImage(deletingImageId);
                  setDeletingImageId(null);
                }
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Conteúdo principal do painel
const CharacterPanelContent = ({
  characters,
  selectedCharacter,
  characterImages,
  isLoading,
  isUploadingImages,
  useMasterAvatar,
  onUseMasterAvatarChange,
  onSelectCharacter,
  onCreateCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onAddImages,
  onRemoveImage,
  onGenerateMasterAvatar,
  onClose,
}: CharacterPanelProps) => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingMaster, setIsGeneratingMaster] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreateCharacter = async () => {
    if (!newCharacterName.trim()) return;
    
    setIsCreating(true);
    const character = await onCreateCharacter(newCharacterName.trim());
    setIsCreating(false);
    
    if (character) {
      setNewCharacterName('');
      onSelectCharacter(character);
      setView('detail');
    }
  };

  const handleEditSave = async () => {
    if (!editingCharacter || !editName.trim()) return;
    
    await onUpdateCharacter(editingCharacter.id, { name: editName.trim() });
    setEditingCharacter(null);
    setEditName('');
  };

  const handleDelete = async () => {
    if (!characterToDelete) return;
    await onDeleteCharacter(characterToDelete.id);
    setCharacterToDelete(null);
  };

  const handleGenerateMasterAvatar = async () => {
    if (!selectedCharacter) return;
    setIsGeneratingMaster(true);
    await onGenerateMasterAvatar(selectedCharacter.id);
    setIsGeneratingMaster(false);
  };

  // View de detalhes do personagem
  if (view === 'detail' && selectedCharacter) {
    return (
      <CharacterDetail
        character={selectedCharacter}
        images={characterImages}
        isUploading={isUploadingImages}
        isGeneratingMaster={isGeneratingMaster}
        useMasterAvatar={useMasterAvatar}
        onUseMasterAvatarChange={onUseMasterAvatarChange}
        onAddImages={(files) => onAddImages(selectedCharacter.id, files)}
        onRemoveImage={onRemoveImage}
        onGenerateMasterAvatar={handleGenerateMasterAvatar}
        onBack={() => setView('list')}
      />
    );
  }

  // View de lista de personagens
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Personagens
          </h2>
          {/* Botão fechar - apenas desktop */}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 -mr-2"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Mantenha consistência visual nas gerações
        </p>
      </div>

      {/* Criar novo personagem */}
      <div className="p-4 border-b">
        <div className="flex gap-2">
          <Input
            placeholder="Nome do personagem..."
            value={newCharacterName}
            onChange={(e) => setNewCharacterName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateCharacter();
            }}
            disabled={isCreating}
          />
          <Button 
            size="icon" 
            onClick={handleCreateCharacter}
            disabled={!newCharacterName.trim() || isCreating}
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Lista de personagens */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <User className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium">Nenhum personagem</p>
            <p className="text-xs text-muted-foreground mt-1">
              Crie um personagem e adicione fotos para manter consistência nas gerações
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                isSelected={selectedCharacter?.id === character.id}
                onSelect={() => {
                  onSelectCharacter(
                    selectedCharacter?.id === character.id ? null : character
                  );
                  if (selectedCharacter?.id !== character.id) {
                    setView('detail');
                  }
                }}
                onEdit={() => {
                  setEditingCharacter(character);
                  setEditName(character.name);
                }}
                onDelete={() => setCharacterToDelete(character)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Modal de edição */}
      <AlertDialog open={!!editingCharacter} onOpenChange={() => setEditingCharacter(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Editar personagem</AlertDialogTitle>
          </AlertDialogHeader>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Nome do personagem"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEditSave();
            }}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEditSave}>Salvar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={!!characterToDelete} onOpenChange={() => setCharacterToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir personagem?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá "{characterToDelete?.name}" e todas as suas imagens. 
              Isso não pode ser desfeito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Componente principal que alterna entre sidebar (desktop) e sheet (mobile)
export const CharacterPanel = (props: CharacterPanelProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2",
              props.selectedCharacter && "border-primary/50 bg-primary/5"
            )}
          >
            <User className="h-4 w-4" />
            {props.selectedCharacter ? (
              <span className="truncate max-w-[100px]">
                {props.selectedCharacter.name}
              </span>
            ) : (
              "Personagem"
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[320px] p-0">
          <CharacterPanelContent {...props} />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Sidebar colapsável com controle de visibilidade
  const isPanelOpen = props.isOpen ?? true;

  return (
    <>
      {/* Botão para reabrir quando fechado */}
      {!isPanelOpen && props.onOpen && (
        <Button
          variant="ghost"
          size="sm"
          className="hidden lg:flex fixed left-0 top-1/2 -translate-y-1/2 z-40 
                     bg-card border shadow-lg rounded-l-none rounded-r-lg h-auto py-3 px-2 flex-col gap-1"
          onClick={props.onOpen}
        >
          <User className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
      
      {/* Sidebar com animação */}
      <div className={cn(
        "hidden lg:flex flex-col border-r bg-card/50 shrink-0 transition-all duration-300 overflow-hidden",
        isPanelOpen ? "w-[280px]" : "w-0"
      )}>
        <CharacterPanelContent {...props} />
      </div>
    </>
  );
};
