-- Adicionar campo para marcar usuários legados (grandfathered)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_legacy_user BOOLEAN NOT NULL DEFAULT FALSE;

-- Marcar todos os usuários existentes como legados e dar plano básico gratuito
UPDATE public.profiles 
SET 
  is_legacy_user = TRUE,
  tokens_remaining = CASE 
    WHEN tokens_remaining < 100000 THEN 100000 
    ELSE tokens_remaining 
  END,
  subscription_type = 'paid'
WHERE created_at < NOW();

-- Criar assinatura "legacy" para usuários existentes
INSERT INTO public.stripe_subscriptions (
  user_id,
  stripe_subscription_id,
  stripe_customer_id,
  status,
  plan_id,
  price_id,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  tokens_per_period
)
SELECT 
  id as user_id,
  'legacy_' || id as stripe_subscription_id,
  'legacy_customer_' || id as stripe_customer_id,
  'active' as status,
  'basic_legacy' as plan_id,
  'legacy_price' as price_id,
  NOW() as current_period_start,
  NOW() + INTERVAL '100 years' as current_period_end,
  FALSE as cancel_at_period_end,
  100000 as tokens_per_period
FROM public.profiles 
WHERE is_legacy_user = TRUE
ON CONFLICT (stripe_subscription_id) DO NOTHING;

-- Atualizar a função handle_new_user para que novos usuários comecem com tokens limitados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email, subscription_type, tokens_remaining, is_legacy_user)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.email,
    'free',
    1000,  -- Novos usuários ganham apenas 1000 tokens para testar
    FALSE  -- Novos usuários não são legacy
  );
  RETURN NEW;
END;
$function$;