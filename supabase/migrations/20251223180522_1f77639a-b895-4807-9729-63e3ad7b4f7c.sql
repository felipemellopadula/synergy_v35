-- Create user_avatars table for storing generated avatars
CREATE TABLE public.user_avatars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_path TEXT NOT NULL,
  style TEXT,
  prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_avatars ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own avatars"
ON public.user_avatars
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own avatars"
ON public.user_avatars
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own avatars"
ON public.user_avatars
FOR DELETE
USING (auth.uid() = user_id);

-- Limit to 20 avatars per user (auto-delete oldest)
CREATE OR REPLACE FUNCTION public.enforce_user_avatars_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.user_avatars
  WHERE id IN (
    SELECT id FROM public.user_avatars
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 20
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_avatars_limit
AFTER INSERT ON public.user_avatars
FOR EACH ROW
EXECUTE FUNCTION public.enforce_user_avatars_limit();