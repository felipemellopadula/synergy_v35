-- Tabela principal de moodboards
CREATE TABLE public.user_moodboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  image_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de imagens do moodboard
CREATE TABLE public.user_moodboard_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moodboard_id UUID NOT NULL REFERENCES public.user_moodboards(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_moodboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_moodboard_images ENABLE ROW LEVEL SECURITY;

-- Policies para moodboards
CREATE POLICY "Users can view own moodboards" ON public.user_moodboards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own moodboards" ON public.user_moodboards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own moodboards" ON public.user_moodboards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own moodboards" ON public.user_moodboards
  FOR DELETE USING (auth.uid() = user_id);

-- Policies para imagens de moodboard
CREATE POLICY "Users can view own moodboard images" ON public.user_moodboard_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_moodboards WHERE id = moodboard_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create own moodboard images" ON public.user_moodboard_images
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_moodboards WHERE id = moodboard_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update own moodboard images" ON public.user_moodboard_images
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_moodboards WHERE id = moodboard_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete own moodboard images" ON public.user_moodboard_images
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_moodboards WHERE id = moodboard_id AND user_id = auth.uid())
  );

-- Trigger para atualizar contador e preview
CREATE OR REPLACE FUNCTION public.update_moodboard_on_image_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.user_moodboards SET
      image_count = (SELECT COUNT(*) FROM public.user_moodboard_images WHERE moodboard_id = NEW.moodboard_id),
      preview_url = COALESCE(
        (SELECT image_url FROM public.user_moodboard_images WHERE moodboard_id = NEW.moodboard_id ORDER BY order_index ASC, created_at ASC LIMIT 1),
        NEW.image_url
      ),
      updated_at = NOW()
    WHERE id = NEW.moodboard_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_moodboards SET
      image_count = (SELECT COUNT(*) FROM public.user_moodboard_images WHERE moodboard_id = OLD.moodboard_id),
      preview_url = (SELECT image_url FROM public.user_moodboard_images WHERE moodboard_id = OLD.moodboard_id ORDER BY order_index ASC, created_at ASC LIMIT 1),
      updated_at = NOW()
    WHERE id = OLD.moodboard_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_moodboard_on_image_change
AFTER INSERT OR DELETE ON public.user_moodboard_images
FOR EACH ROW EXECUTE FUNCTION public.update_moodboard_on_image_change();

-- Limite de 10 moodboards por usuário
CREATE OR REPLACE FUNCTION public.enforce_user_moodboards_limit()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.user_moodboards
  WHERE id IN (
    SELECT id FROM public.user_moodboards
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_enforce_user_moodboards_limit
AFTER INSERT ON public.user_moodboards
FOR EACH ROW EXECUTE FUNCTION public.enforce_user_moodboards_limit();

-- Limite de 14 imagens por moodboard
CREATE OR REPLACE FUNCTION public.enforce_moodboard_images_limit()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.user_moodboard_images
  WHERE id IN (
    SELECT id FROM public.user_moodboard_images
    WHERE moodboard_id = NEW.moodboard_id
    ORDER BY order_index ASC, created_at ASC
    OFFSET 14
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_enforce_moodboard_images_limit
AFTER INSERT ON public.user_moodboard_images
FOR EACH ROW EXECUTE FUNCTION public.enforce_moodboard_images_limit();