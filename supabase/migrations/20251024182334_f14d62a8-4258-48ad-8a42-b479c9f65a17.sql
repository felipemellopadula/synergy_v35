-- Atualizar todos os planos pagos para dar 1.000.000 de tokens
UPDATE stripe_products 
SET tokens_included = 1000000 
WHERE active = true;