-- Corrigir usuários com assinatura ativa que estão marcados como 'free'
UPDATE profiles p
SET 
  subscription_type = 'paid',
  updated_at = NOW()
FROM stripe_subscriptions s
WHERE p.id = s.user_id
  AND s.status = 'active'
  AND p.subscription_type = 'free';