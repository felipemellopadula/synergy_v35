import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

export interface Moodboard {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  preview_url: string | null;
  image_count: number;
  created_at: string;
  updated_at: string;
}

export interface MoodboardImage {
  id: string;
  moodboard_id: string;
  image_url: string;
  storage_path: string | null;
  order_index: number;
  created_at: string;
}

const SELECTED_MOODBOARD_KEY = 'selected_moodboard_id';

export const useMoodboards = () => {
  const { user } = useAuth();
  const [moodboards, setMoodboards] = useState<Moodboard[]>([]);
  const [selectedMoodboard, setSelectedMoodboardState] = useState<Moodboard | null>(null);
  const [moodboardImages, setMoodboardImages] = useState<MoodboardImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Carregar moodboards do usuário
  const loadMoodboards = useCallback(async () => {
    if (!user) {
      setMoodboards([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_moodboards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setMoodboards((data || []) as Moodboard[]);

      // Restaurar moodboard selecionado do localStorage
      const savedMoodboardId = localStorage.getItem(SELECTED_MOODBOARD_KEY);
      if (savedMoodboardId && data) {
        const savedMoodboard = data.find(m => m.id === savedMoodboardId);
        if (savedMoodboard) {
          setSelectedMoodboardState(savedMoodboard as Moodboard);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar moodboards:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Carregar imagens do moodboard selecionado
  const loadMoodboardImages = useCallback(async (moodboardId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_moodboard_images')
        .select('*')
        .eq('moodboard_id', moodboardId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setMoodboardImages((data || []) as MoodboardImage[]);
    } catch (error) {
      console.error('Erro ao carregar imagens do moodboard:', error);
      setMoodboardImages([]);
    }
  }, []);

  // Efeito para carregar moodboards na montagem
  useEffect(() => {
    loadMoodboards();
  }, [loadMoodboards]);

  // Efeito para carregar imagens quando moodboard é selecionado
  useEffect(() => {
    if (selectedMoodboard) {
      loadMoodboardImages(selectedMoodboard.id);
    } else {
      setMoodboardImages([]);
    }
  }, [selectedMoodboard, loadMoodboardImages]);

  // Selecionar moodboard
  const selectMoodboard = useCallback((moodboard: Moodboard | null) => {
    setSelectedMoodboardState(moodboard);
    if (moodboard) {
      localStorage.setItem(SELECTED_MOODBOARD_KEY, moodboard.id);
    } else {
      localStorage.removeItem(SELECTED_MOODBOARD_KEY);
    }
  }, []);

  // Criar novo moodboard
  const createMoodboard = useCallback(async (name: string, description?: string): Promise<Moodboard | null> => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('user_moodboards')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newMoodboard = data as Moodboard;
      setMoodboards(prev => [newMoodboard, ...prev]);
      toast.success(`Moodboard "${name}" criado!`);
      return newMoodboard;
    } catch (error) {
      console.error('Erro ao criar moodboard:', error);
      toast.error('Erro ao criar moodboard');
      return null;
    }
  }, [user]);

  // Atualizar moodboard
  const updateMoodboard = useCallback(async (
    moodboardId: string, 
    updates: Partial<Pick<Moodboard, 'name' | 'description'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_moodboards')
        .update(updates)
        .eq('id', moodboardId);

      if (error) throw error;

      setMoodboards(prev => 
        prev.map(m => m.id === moodboardId ? { ...m, ...updates } as Moodboard : m)
      );
      
      if (selectedMoodboard?.id === moodboardId) {
        setSelectedMoodboardState(prev => prev ? { ...prev, ...updates } as Moodboard : null);
      }

      toast.success('Moodboard atualizado!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar moodboard:', error);
      toast.error('Erro ao atualizar moodboard');
      return false;
    }
  }, [selectedMoodboard?.id]);

  // Deletar moodboard
  const deleteMoodboard = useCallback(async (moodboardId: string): Promise<boolean> => {
    try {
      // Primeiro, buscar as imagens para deletar do storage
      const { data: images } = await supabase
        .from('user_moodboard_images')
        .select('storage_path')
        .eq('moodboard_id', moodboardId);

      // Deletar arquivos do storage
      if (images && images.length > 0) {
        const paths = images
          .map(img => img.storage_path)
          .filter((p): p is string => p !== null);
        
        if (paths.length > 0) {
          await supabase.storage.from('images').remove(paths);
        }
      }

      // Deletar moodboard (cascade deleta as imagens do banco)
      const { error } = await supabase
        .from('user_moodboards')
        .delete()
        .eq('id', moodboardId);

      if (error) throw error;

      setMoodboards(prev => prev.filter(m => m.id !== moodboardId));
      
      if (selectedMoodboard?.id === moodboardId) {
        selectMoodboard(null);
      }

      toast.success('Moodboard excluído!');
      return true;
    } catch (error) {
      console.error('Erro ao deletar moodboard:', error);
      toast.error('Erro ao excluir moodboard');
      return false;
    }
  }, [selectedMoodboard?.id, selectMoodboard]);

  // Adicionar imagens ao moodboard
  const addImages = useCallback(async (moodboardId: string, files: File[]): Promise<number> => {
    if (!user) return 0;

    setIsUploadingImages(true);
    let uploadedCount = 0;

    try {
      // Verificar quantas imagens já existem
      const { count } = await supabase
        .from('user_moodboard_images')
        .select('*', { count: 'exact', head: true })
        .eq('moodboard_id', moodboardId);

      const existingCount = count || 0;
      const availableSlots = 14 - existingCount;
      
      if (availableSlots <= 0) {
        toast.error('Limite de 14 imagens atingido');
        return 0;
      }

      const filesToUpload = files.slice(0, availableSlots);
      const startIndex = existingCount;

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        
        try {
          // Comprimir imagem
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 0.4,
            maxWidthOrHeight: 1536,
            useWebWorker: true,
          });

          // Gerar nome único
          const fileName = `moodboards/${user.id}/${moodboardId}/${Date.now()}-${crypto.randomUUID()}.jpg`;

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
            .from('user_moodboard_images')
            .insert({
              moodboard_id: moodboardId,
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

      // Recarregar imagens e moodboards
      if (uploadedCount > 0) {
        await loadMoodboardImages(moodboardId);
        await loadMoodboards();
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
  }, [user, loadMoodboardImages, loadMoodboards]);

  // Remover imagem
  const removeImage = useCallback(async (imageId: string): Promise<boolean> => {
    try {
      // Buscar storage_path antes de deletar
      const { data: imageData } = await supabase
        .from('user_moodboard_images')
        .select('storage_path, moodboard_id')
        .eq('id', imageId)
        .single();

      if (imageData?.storage_path) {
        await supabase.storage.from('images').remove([imageData.storage_path]);
      }

      const { error } = await supabase
        .from('user_moodboard_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      setMoodboardImages(prev => prev.filter(img => img.id !== imageId));
      
      // Atualizar contagem no moodboard local
      if (imageData?.moodboard_id) {
        setMoodboards(prev => 
          prev.map(m => 
            m.id === imageData.moodboard_id 
              ? { ...m, image_count: Math.max(0, m.image_count - 1) } 
              : m
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

  // Converter URL para base64
  const getImageAsBase64 = useCallback(async (imageUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        console.error(`[Moodboard] Falha ao buscar imagem: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const blob = await response.blob();
      
      if (!blob || blob.size === 0) {
        console.error('[Moodboard] Blob vazio ou inválido');
        return null;
      }
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => {
          console.error('[Moodboard] Erro no FileReader:', reader.error);
          reject(reader.error);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('[Moodboard] Erro ao converter imagem para base64:', error);
      return null;
    }
  }, []);

  // Obter imagens do moodboard como base64 (para geração)
  const getMoodboardImagesAsBase64 = useCallback(async (moodboardId: string, maxImages: number = 14): Promise<string[]> => {
    try {
      // Buscar imagens do moodboard específico
      const { data: images, error } = await supabase
        .from('user_moodboard_images')
        .select('image_url')
        .eq('moodboard_id', moodboardId)
        .order('order_index', { ascending: true })
        .limit(maxImages);

      if (error || !images || images.length === 0) return [];

      const base64Images: string[] = [];

      for (const img of images) {
        const base64 = await getImageAsBase64(img.image_url);
        if (base64) {
          base64Images.push(base64);
        }
      }

      return base64Images;
    } catch (error) {
      console.error('[Moodboard] Erro ao obter imagens como base64:', error);
      return [];
    }
  }, [getImageAsBase64]);

  return {
    moodboards,
    selectedMoodboard,
    moodboardImages,
    isLoading,
    isUploadingImages,
    loadMoodboards,
    loadMoodboardImages,
    selectMoodboard,
    createMoodboard,
    updateMoodboard,
    deleteMoodboard,
    addImages,
    removeImage,
    getMoodboardImagesAsBase64,
  };
};
