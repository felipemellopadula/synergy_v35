-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

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

-- Create a table to track storage cleanup logs
CREATE TABLE IF NOT EXISTS public.storage_cleanup_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  total_files INTEGER,
  deleted_files INTEGER,
  freed_space_mb INTEGER,
  errors TEXT[],
  triggered_by TEXT DEFAULT 'cron',
  success BOOLEAN DEFAULT true
);

-- Enable RLS on storage cleanup logs
ALTER TABLE public.storage_cleanup_logs ENABLE ROW LEVEL SECURITY;

-- Create admin users table for admin permissions
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on admin users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to storage cleanup logs
CREATE POLICY "Admin can view storage cleanup logs" 
ON public.storage_cleanup_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Create policy for system to insert storage cleanup logs
CREATE POLICY "System can insert storage cleanup logs" 
ON public.storage_cleanup_logs 
FOR INSERT 
WITH CHECK (true);

-- Create policy for admins to manage admin users
CREATE POLICY "Admin can view admin users" 
ON public.admin_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

CREATE POLICY "Admin can insert admin users" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);