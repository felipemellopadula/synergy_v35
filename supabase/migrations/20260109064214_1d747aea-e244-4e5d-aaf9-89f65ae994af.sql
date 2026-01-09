-- Desativar produtos antigos (assinaturas)
UPDATE stripe_products SET active = false WHERE billing_period IN ('month', 'year');

-- Inserir novos pacotes de créditos (one-time payments)
INSERT INTO stripe_products (plan_id, plan_name, stripe_product_id, stripe_price_id, amount_cents, tokens_included, billing_period, active)
VALUES 
  -- START tier
  ('start_10', 'Start 10 - Pacote de Créditos', 'prod_Tl3iKNqLbg5eeB', 'price_1SnXb53llBehq08NhGP8bRTS', 3000, 10, 'one_time', true),
  ('start_20', 'Start 20 - Pacote de Créditos', 'prod_Tl3iUIPgRbYKM0', 'price_1SnXbM3llBehq08NFwMfGnvH', 6000, 20, 'one_time', true),
  ('start_30', 'Start 30 - Pacote de Créditos', 'prod_Tl4Cfgz9E7FLI4', 'price_1SnY4Q3llBehq08Nfy4bU3eo', 9000, 30, 'one_time', true),
  -- PRO tier
  ('pro_40', 'Pro 40 - Pacote de Créditos', 'prod_Tl4DxWZbN5rUlf', 'price_1SnY5H3llBehq08NCyDaIJAr', 12000, 40, 'one_time', true),
  ('pro_50', 'Pro 50 - Pacote de Créditos', 'prod_Tl5VjgVVKvyK1p', 'price_1SnZK73llBehq08N19CpWj55', 15000, 50, 'one_time', true),
  ('pro_100', 'Pro 100 - Pacote de Créditos', 'prod_Tl5VMnrRuYWDRA', 'price_1SnZKQ3llBehq08NnAQbvqQk', 30000, 100, 'one_time', true),
  -- CREATOR tier
  ('creator_250', 'Creator 250 - Pacote de Créditos', 'prod_Tl5VBdmk1vdV3x', 'price_1SnZKd3llBehq08NkgQDpkbm', 75000, 250, 'one_time', true),
  ('creator_500', 'Creator 500 - Pacote de Créditos', 'prod_Tl5W0MEpAQ7Ko6', 'price_1SnZL83llBehq08NQ2j5QiXW', 150000, 500, 'one_time', true),
  ('creator_1000', 'Creator 1000 - Pacote de Créditos', 'prod_Tl5WJkBT7zjuPy', 'price_1SnZLM3llBehq08NQsPMmTaz', 300000, 1000, 'one_time', true);