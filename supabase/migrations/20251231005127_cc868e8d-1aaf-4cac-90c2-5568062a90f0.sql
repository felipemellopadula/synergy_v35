-- Add is_password_set column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_password_set BOOLEAN DEFAULT FALSE;

-- Mark all existing users as having password set (they already have access)
UPDATE public.profiles SET is_password_set = TRUE;

-- Update the handle_new_user trigger to include is_password_set
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, subscription_type, tokens_remaining, is_legacy_user, is_password_set)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.email,
    'free',
    1000,
    FALSE,
    -- Se criado via OAuth (Google), já tem "senha" definida
    CASE WHEN NEW.raw_app_meta_data->>'provider' = 'google' THEN TRUE ELSE FALSE END
  );
  RETURN NEW;
END;
$$;