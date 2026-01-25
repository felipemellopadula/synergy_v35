import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

export interface Character {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  master_avatar_url: string | null;
  image_count: number;
  created_at: string;
  updated_at: string;
}

export interface CharacterImage {
  id: string;
  character_id: string;
  image_url: string;
  storage_path: string | null;
  order_index: number;
  created_at: string;
}

const SELECTED_CHARACTER_KEY = 'selected_character_id';

export const useCharacters = () => {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacterState] = useState<Character | null>(null);
  const [characterImages, setCharacterImages] = useState<CharacterImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Carregar personagens do usuário
  const loadCharacters = useCallback(async () => {
    if (!user) {
      setCharacters([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_characters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion para garantir compatibilidade
      setCharacters((data || []) as Character[]);

      // Restaurar personagem selecionado do localStorage
      const savedCharacterId = localStorage.getItem(SELECTED_CHARACTER_KEY);
      if (savedCharacterId && data) {
        const savedChar = data.find(c => c.id === savedCharacterId);
        if (savedChar) {
          setSelectedCharacterState(savedChar as Character);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar personagens:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Carregar imagens do personagem selecionado
  const loadCharacterImages = useCallback(async (characterId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_character_images')
        .select('*')
        .eq('character_id', characterId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCharacterImages((data || []) as CharacterImage[]);
    } catch (error) {
      console.error('Erro ao carregar imagens do personagem:', error);
      setCharacterImages([]);
    }
  }, []);

  // Efeito para carregar personagens na montagem
  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  // Efeito para carregar imagens quando personagem é selecionado
  useEffect(() => {
    if (selectedCharacter) {
      loadCharacterImages(selectedCharacter.id);
    } else {
      setCharacterImages([]);
    }
  }, [selectedCharacter, loadCharacterImages]);

  // Selecionar personagem
  const selectCharacter = useCallback((character: Character | null) => {
    setSelectedCharacterState(character);
    if (character) {
      localStorage.setItem(SELECTED_CHARACTER_KEY, character.id);
    } else {
      localStorage.removeItem(SELECTED_CHARACTER_KEY);
    }
  }, []);

  // Criar novo personagem
  const createCharacter = useCallback(async (name: string, description?: string): Promise<Character | null> => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('user_characters')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newCharacter = data as Character;
      setCharacters(prev => [newCharacter, ...prev]);
      toast.success(`Personagem "${name}" criado!`);
      return newCharacter;
    } catch (error) {
      console.error('Erro ao criar personagem:', error);
      toast.error('Erro ao criar personagem');
      return null;
    }
  }, [user]);

  // Atualizar personagem
  const updateCharacter = useCallback(async (
    characterId: string, 
    updates: Partial<Pick<Character, 'name' | 'description'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_characters')
        .update(updates)
        .eq('id', characterId);

      if (error) throw error;

      setCharacters(prev => 
        prev.map(c => c.id === characterId ? { ...c, ...updates } as Character : c)
      );
      
      if (selectedCharacter?.id === characterId) {
        setSelectedCharacterState(prev => prev ? { ...prev, ...updates } as Character : null);
      }

      toast.success('Personagem atualizado!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar personagem:', error);
      toast.error('Erro ao atualizar personagem');
      return false;
    }
  }, [selectedCharacter?.id]);

  // Deletar personagem
  const deleteCharacter = useCallback(async (characterId: string): Promise<boolean> => {
    try {
      // Primeiro, buscar as imagens para deletar do storage
      const { data: images } = await supabase
        .from('user_character_images')
        .select('storage_path')
        .eq('character_id', characterId);

      // Deletar arquivos do storage
      if (images && images.length > 0) {
        const paths = images
          .map(img => img.storage_path)
          .filter((p): p is string => p !== null);
        
        if (paths.length > 0) {
          await supabase.storage.from('images').remove(paths);
        }
      }

      // Deletar personagem (cascade deleta as imagens do banco)
      const { error } = await supabase
        .from('user_characters')
        .delete()
        .eq('id', characterId);

      if (error) throw error;

      setCharacters(prev => prev.filter(c => c.id !== characterId));
      
      if (selectedCharacter?.id === characterId) {
        selectCharacter(null);
      }

      toast.success('Personagem excluído!');
      return true;
    } catch (error) {
      console.error('Erro ao deletar personagem:', error);
      toast.error('Erro ao excluir personagem');
      return false;
    }
  }, [selectedCharacter?.id, selectCharacter]);

  // Adicionar imagens ao personagem
  const addImages = useCallback(async (characterId: string, files: File[]): Promise<number> => {
    if (!user) return 0;

    setIsUploadingImages(true);
    let uploadedCount = 0;

    try {
      // Verificar quantas imagens já existem
      const { count } = await supabase
        .from('user_character_images')
        .select('*', { count: 'exact', head: true })
        .eq('character_id', characterId);

      const existingCount = count || 0;
      const availableSlots = 70 - existingCount;
      
      if (availableSlots <= 0) {
        toast.error('Limite de 70 imagens atingido');
        return 0;
      }

      const filesToUpload = files.slice(0, availableSlots);
      const startIndex = existingCount;

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        
        try {
          // Comprimir imagem
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1024,
            useWebWorker: true,
          });

          // Gerar nome único
          const fileName = `characters/${user.id}/${characterId}/${Date.now()}-${crypto.randomUUID()}.jpg`;

          // Upload para storage
          const { data: storageData, error: storageError } = await supabase.storage
            .from('images')
            .upload(fileName, compressedFile, { cacheControl: '31536000' });

          if (storageError) throw storageError;

          // Obter URL pública
          const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(storageData.path);

          // Inserir no banco
          const { error: insertError } = await supabase
            .from('user_character_images')
            .insert({
              character_id: characterId,
              image_url: publicUrl,
              storage_path: storageData.path,
              order_index: startIndex + i,
            });

          if (insertError) throw insertError;

          uploadedCount++;
        } catch (fileError) {
          console.error(`Erro ao processar arquivo ${file.name}:`, fileError);
        }
      }

      // Recarregar imagens e personagens
      if (uploadedCount > 0) {
        await loadCharacterImages(characterId);
        await loadCharacters();
        toast.success(`${uploadedCount} ${uploadedCount === 1 ? 'imagem adicionada' : 'imagens adicionadas'}!`);
      }

      return uploadedCount;
    } catch (error) {
      console.error('Erro ao adicionar imagens:', error);
      toast.error('Erro ao adicionar imagens');
      return uploadedCount;
    } finally {
      setIsUploadingImages(false);
    }
  }, [user, loadCharacterImages, loadCharacters]);

  // Remover imagem
  const removeImage = useCallback(async (imageId: string): Promise<boolean> => {
    try {
      // Buscar storage_path antes de deletar
      const { data: imageData } = await supabase
        .from('user_character_images')
        .select('storage_path, character_id')
        .eq('id', imageId)
        .single();

      if (imageData?.storage_path) {
        await supabase.storage.from('images').remove([imageData.storage_path]);
      }

      const { error } = await supabase
        .from('user_character_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      setCharacterImages(prev => prev.filter(img => img.id !== imageId));
      
      // Atualizar contagem no personagem local
      if (imageData?.character_id) {
        setCharacters(prev => 
          prev.map(c => 
            c.id === imageData.character_id 
              ? { ...c, image_count: Math.max(0, c.image_count - 1) } 
              : c
          )
        );
      }

      return true;
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      toast.error('Erro ao remover imagem');
      return false;
    }
  }, []);

  // Reordenar imagens (drag & drop)
  const reorderImages = useCallback(async (characterId: string, orderedIds: string[]): Promise<boolean> => {
    try {
      // Atualização otimista local
      const reorderedImages = orderedIds
        .map((id, index) => {
          const img = characterImages.find(i => i.id === id);
          return img ? { ...img, order_index: index } : null;
        })
        .filter((img): img is CharacterImage => img !== null);
      
      setCharacterImages(reorderedImages);

      // Atualizar no banco em batch
      for (let i = 0; i < orderedIds.length; i++) {
        await supabase
          .from('user_character_images')
          .update({ order_index: i })
          .eq('id', orderedIds[i]);
      }

      return true;
    } catch (error) {
      console.error('Erro ao reordenar imagens:', error);
      toast.error('Erro ao reordenar imagens');
      // Recarregar para reverter
      await loadCharacterImages(characterId);
      return false;
    }
  }, [characterImages, loadCharacterImages]);

  // Converter URL para base64
  const getImageAsBase64 = useCallback(async (imageUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(imageUrl);
      
      // ✅ Validar se a resposta foi bem-sucedida
      if (!response.ok) {
        console.error(`[Character] Falha ao buscar imagem: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const blob = await response.blob();
      
      // Verificar se o blob é válido
      if (!blob || blob.size === 0) {
        console.error('[Character] Blob vazio ou inválido');
        return null;
      }
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remover prefixo data:image/...;base64,
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => {
          console.error('[Character] Erro no FileReader:', reader.error);
          reject(reader.error);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('[Character] Erro ao converter imagem para base64:', error);
      return null;
    }
  }, []);

  // Obter imagens do personagem como base64 (para geração)
  const getCharacterImagesAsBase64 = useCallback(async (maxImages: number = 10): Promise<string[]> => {
    if (!selectedCharacter || characterImages.length === 0) return [];

    const imagesToUse = characterImages.slice(0, maxImages);
    const base64Images: string[] = [];

    for (const img of imagesToUse) {
      const base64 = await getImageAsBase64(img.image_url);
      if (base64) {
        base64Images.push(base64);
      }
    }

    return base64Images;
  }, [selectedCharacter, characterImages, getImageAsBase64]);

  // Gerar Avatar Master consolidado
  const generateMasterAvatar = useCallback(async (characterId: string): Promise<string | null> => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return null;
    }

    const character = characters.find(c => c.id === characterId);
    if (!character) {
      toast.error('Personagem não encontrado');
      return null;
    }

    try {
      // Buscar imagens do personagem
      const { data: images } = await supabase
        .from('user_character_images')
        .select('image_url')
        .eq('character_id', characterId)
        .order('order_index', { ascending: true })
        .limit(14); // Máximo do Google Nano Banana 2 Pro

      if (!images || images.length === 0) {
        toast.error('Adicione pelo menos uma imagem ao personagem');
        return null;
      }

      console.log(`[Character] Gerando Master Avatar com ${images.length} imagens...`);

      // Converter para base64
      const base64Images: string[] = [];
      for (const img of images) {
        const b64 = await getImageAsBase64(img.image_url);
        if (b64) base64Images.push(b64);
      }

      if (base64Images.length === 0) {
        toast.error('Erro ao processar imagens do personagem');
        return null;
      }

      // Gerar avatar master usando o modelo com mais capacidade de referência
      const { data, error } = await supabase.functions.invoke('edit-image', {
        body: {
          model: 'google:4@2', // Nano Banana 2 Pro (até 14 refs)
          positivePrompt: `Create a high-quality portrait reference image of this person. 
            Maintain exact facial features, face shape, skin tone, hair color and style. 
            Professional lighting, neutral expression, front-facing view.
            This will be used as a master reference for consistent character generation.`,
          inputImages: base64Images,
          width: 1024,
          height: 1024,
        }
      });

      if (error) {
        console.error('[Character] Erro ao gerar Master Avatar:', error);
        toast.error('Erro ao gerar Avatar Master');
        return null;
      }

      if (!data?.image) {
        toast.error('Erro ao gerar Avatar Master');
        return null;
      }

      // Converter base64 para Blob
      const base64Data = data.image.startsWith('data:') 
        ? data.image.split(',')[1] 
        : data.image;
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/png' });

      // Salvar no storage
      const fileName = `characters/${user.id}/${characterId}/master-avatar.png`;
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from('images')
        .upload(fileName, blob, { 
          upsert: true,
          contentType: 'image/png',
          cacheControl: '31536000'
        });

      if (storageError) {
        console.error('[Character] Erro ao salvar Master Avatar:', storageError);
        toast.error('Erro ao salvar Avatar Master');
        return null;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(storageData.path);

      // Atualizar no banco
      const { error: updateError } = await supabase
        .from('user_characters')
        .update({ master_avatar_url: publicUrl })
        .eq('id', characterId);

      if (updateError) {
        console.error('[Character] Erro ao atualizar personagem:', updateError);
        toast.error('Erro ao atualizar personagem');
        return null;
      }

      // Atualizar estado local
      setCharacters(prev => 
        prev.map(c => c.id === characterId ? { ...c, master_avatar_url: publicUrl } as Character : c)
      );
      
      if (selectedCharacter?.id === characterId) {
        setSelectedCharacterState(prev => prev ? { ...prev, master_avatar_url: publicUrl } as Character : null);
      }

      console.log('[Character] ✅ Master Avatar gerado com sucesso:', publicUrl);
      toast.success('Avatar Master gerado com sucesso!');
      return publicUrl;
    } catch (error) {
      console.error('[Character] Erro inesperado ao gerar Master Avatar:', error);
      toast.error('Erro ao gerar Avatar Master');
      return null;
    }
  }, [user, characters, selectedCharacter?.id, getImageAsBase64]);

  return {
    // Estado
    characters,
    selectedCharacter,
    characterImages,
    isLoading,
    isUploadingImages,
    
    // Ações
    selectCharacter,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    addImages,
    removeImage,
    reorderImages,
    generateMasterAvatar,
    
    // Helpers
    getCharacterImagesAsBase64,
    getImageAsBase64,
    loadCharacters,
  };
};
