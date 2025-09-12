-- Habilitar realtime para a tabela token_usage
ALTER TABLE public.token_usage REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.token_usage;