-- Add sort_order fields to canvases and folders tables
ALTER TABLE public.canvases ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create indexes for sort_order
CREATE INDEX IF NOT EXISTS idx_canvases_sort_order ON public.canvases(sort_order);
CREATE INDEX IF NOT EXISTS idx_folders_sort_order ON public.folders(sort_order);

-- Update existing records to have sequential sort_order
UPDATE public.canvases 
SET sort_order = subquery.row_num 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, folder_id ORDER BY created_at) as row_num
  FROM public.canvases
) as subquery 
WHERE public.canvases.id = subquery.id;

UPDATE public.folders 
SET sort_order = subquery.row_num 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_num
  FROM public.folders
) as subquery 
WHERE public.folders.id = subquery.id; 