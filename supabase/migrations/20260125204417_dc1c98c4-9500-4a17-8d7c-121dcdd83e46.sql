-- Adicionar coluna master_avatar_url para armazenar o avatar consolidado
ALTER TABLE public.user_characters 
ADD COLUMN IF NOT EXISTS master_avatar_url TEXT DEFAULT NULL;

COMMENT ON COLUMN public.user_characters.master_avatar_url IS 
  'Avatar consolidado gerado a partir das imagens de referência do personagem';