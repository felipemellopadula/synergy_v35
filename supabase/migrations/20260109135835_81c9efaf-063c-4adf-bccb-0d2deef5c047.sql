-- Tabela para histórico de compras de pacotes de créditos
CREATE TABLE public.credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL UNIQUE,
  plan_id TEXT NOT NULL,
  plan_name TEXT,
  tokens_credited INTEGER NOT NULL,
  amount_paid INTEGER, -- em centavos
  currency TEXT DEFAULT 'brl',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas
CREATE INDEX idx_credit_purchases_user_id ON public.credit_purchases(user_id);
CREATE INDEX idx_credit_purchases_created_at ON public.credit_purchases(created_at DESC);

-- RLS
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias compras
CREATE POLICY "Users can view own purchases" 
  ON public.credit_purchases 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Service role pode inserir (para o webhook)
CREATE POLICY "Service role can insert purchases"
  ON public.credit_purchases
  FOR INSERT
  WITH CHECK (true);