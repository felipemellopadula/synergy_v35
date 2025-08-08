-- Create chat_conversations table to store per-user chat histories with messages as JSONB
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only manage their own conversations
CREATE POLICY "Users can view their own conversations"
ON public.chat_conversations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
ON public.chat_conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.chat_conversations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
ON public.chat_conversations
FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated_at ON public.chat_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_favorites ON public.chat_conversations(user_id, is_favorite);

-- Trigger to keep updated_at in sync
DROP TRIGGER IF EXISTS update_chat_conversations_updated_at ON public.chat_conversations;
CREATE TRIGGER update_chat_conversations_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();