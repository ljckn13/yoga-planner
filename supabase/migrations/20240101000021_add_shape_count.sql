-- Add shape_count column to canvases table
ALTER TABLE public.canvases 
ADD COLUMN IF NOT EXISTS shape_count INTEGER DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN public.canvases.shape_count IS 'Number of shapes on the canvas, updated on every save'; 