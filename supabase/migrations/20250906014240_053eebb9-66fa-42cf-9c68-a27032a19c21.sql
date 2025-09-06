-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing cron job if exists and recreate
SELECT cron.unschedule('daily-storage-cleanup');

-- Create cron job for daily storage cleanup at 2 AM UTC
SELECT cron.schedule(
  'daily-storage-cleanup',
  '0 2 * * *', -- Run at 2:00 AM UTC every day
  $$
  SELECT
    net.http_post(
        url:='https://myqgnnqltemfpzdxwybj.supabase.co/functions/v1/storage-cleanup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cWdubnFsdGVtZnB6ZHh3eWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4ODc3NjIsImV4cCI6MjA2OTQ2Mzc2Mn0.X0jHc8AkyZNZbi3kg5Qh6ngg7aAbijFXchM6bYsAnlE"}'::jsonb,
        body:='{"scheduled": true, "time": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);

-- Create admin users table for admin permissions (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_users') THEN
        CREATE TABLE public.admin_users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          created_by UUID
        );
        
        ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Admin can view admin users" 
        ON public.admin_users 
        FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE admin_users.user_id = auth.uid()
          )
        );
    END IF;
END $$;