-- Adicionar coluna current_plan na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS current_plan TEXT DEFAULT NULL;

-- Atualizar usuário contato@synergyia.com.br para sistema de créditos novo com plano Creator
UPDATE profiles 
SET 
  is_legacy_user = FALSE,
  tokens_remaining = 1000,
  current_plan = 'Creator'
WHERE email = 'contato@synergyia.com.br';

-- Registrar a "compra" do pacote Creator para histórico
INSERT INTO credit_purchases (user_id, stripe_session_id, plan_id, plan_name, tokens_credited, amount_paid, currency)
SELECT 
  id,
  'manual_admin_' || gen_random_uuid(),
  'creator_1000',
  'Creator 1000 - Pacote de Créditos',
  1000,
  300000,
  'brl'
FROM profiles 
WHERE email = 'contato@synergyia.com.br';