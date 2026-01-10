-- Create storyboard_references table for storing reference images
CREATE TABLE public.storyboard_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.storyboard_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'IMG1',
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_storyboard_references_project_id ON public.storyboard_references(project_id);

-- Enable RLS
ALTER TABLE public.storyboard_references ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can manage references in their own projects
CREATE POLICY "Users can view their project references"
ON public.storyboard_references
FOR SELECT
USING (
  project_id IN (SELECT id FROM public.storyboard_projects WHERE user_id = auth.uid())
);

CREATE POLICY "Users can insert references to their projects"
ON public.storyboard_references
FOR INSERT
WITH CHECK (
  project_id IN (SELECT id FROM public.storyboard_projects WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their project references"
ON public.storyboard_references
FOR UPDATE
USING (
  project_id IN (SELECT id FROM public.storyboard_projects WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their project references"
ON public.storyboard_references
FOR DELETE
USING (
  project_id IN (SELECT id FROM public.storyboard_projects WHERE user_id = auth.uid())
);

-- Add new columns to storyboard_scenes for AI-generated images
ALTER TABLE public.storyboard_scenes 
ADD COLUMN IF NOT EXISTS generated_image_url TEXT,
ADD COLUMN IF NOT EXISTS image_status TEXT DEFAULT 'pending';

-- Add comment for documentation
COMMENT ON TABLE public.storyboard_references IS 'Stores reference images used for AI generation in storyboard projects';
COMMENT ON COLUMN public.storyboard_scenes.generated_image_url IS 'URL of AI-generated image combining references and prompt';
COMMENT ON COLUMN public.storyboard_scenes.image_status IS 'Status of image generation: pending, generating, completed, failed';