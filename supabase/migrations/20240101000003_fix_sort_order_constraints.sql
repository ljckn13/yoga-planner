-- Fix sort_order to be properly scoped per folder
-- This migration adds constraints and fixes defaults

-- First, normalize existing sort_order values to be 1-based and properly scoped
UPDATE public.canvases 
SET sort_order = subquery.row_num 
FROM (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY user_id, COALESCE(folder_id::text, 'root') 
    ORDER BY sort_order, created_at
  ) as row_num
  FROM public.canvases
) as subquery 
WHERE public.canvases.id = subquery.id;

UPDATE public.folders 
SET sort_order = subquery.row_num 
FROM (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY user_id 
    ORDER BY sort_order, created_at
  ) as row_num
  FROM public.folders
) as subquery 
WHERE public.folders.id = subquery.id;

-- Change default from 0 to 1 to match application logic
ALTER TABLE public.canvases ALTER COLUMN sort_order SET DEFAULT 1;
ALTER TABLE public.folders ALTER COLUMN sort_order SET DEFAULT 1;

-- Add composite indexes for better performance on folder-scoped queries
DROP INDEX IF EXISTS idx_canvases_sort_order;
DROP INDEX IF EXISTS idx_folders_sort_order;

CREATE INDEX IF NOT EXISTS idx_canvases_folder_sort 
ON public.canvases(user_id, COALESCE(folder_id::text, 'root'), sort_order);

CREATE INDEX IF NOT EXISTS idx_folders_user_sort 
ON public.folders(user_id, sort_order);

-- Add a function to get the next sort_order for a folder scope
CREATE OR REPLACE FUNCTION public.get_next_canvas_sort_order(
  p_user_id UUID, 
  p_folder_id UUID DEFAULT NULL,
  p_insert_at_beginning BOOLEAN DEFAULT FALSE
) RETURNS INTEGER AS $$
DECLARE
  next_order INTEGER;
BEGIN
  IF p_insert_at_beginning THEN
    -- Insert at beginning: shift all existing items and use sort_order 1
    UPDATE public.canvases 
    SET sort_order = sort_order + 1 
    WHERE user_id = p_user_id 
    AND (
      (p_folder_id IS NULL AND folder_id IS NULL) OR 
      (folder_id = p_folder_id)
    );
    
    RETURN 1;
  ELSE
    -- Insert at end: get next available sort_order
    SELECT COALESCE(MAX(sort_order), 0) + 1 
    INTO next_order
    FROM public.canvases 
    WHERE user_id = p_user_id 
    AND (
      (p_folder_id IS NULL AND folder_id IS NULL) OR 
      (folder_id = p_folder_id)
    );
    
    RETURN next_order;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to get the next sort_order for folders
CREATE OR REPLACE FUNCTION public.get_next_folder_sort_order(
  p_user_id UUID,
  p_insert_at_beginning BOOLEAN DEFAULT FALSE
) RETURNS INTEGER AS $$
DECLARE
  next_order INTEGER;
BEGIN
  IF p_insert_at_beginning THEN
    -- Insert at beginning: shift all existing items and use sort_order 1
    UPDATE public.folders 
    SET sort_order = sort_order + 1 
    WHERE user_id = p_user_id;
    
    RETURN 1;
  ELSE
    -- Insert at end: get next available sort_order
    SELECT COALESCE(MAX(sort_order), 0) + 1 
    INTO next_order
    FROM public.folders 
    WHERE user_id = p_user_id;
    
    RETURN next_order;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to reorder canvases within a folder scope
CREATE OR REPLACE FUNCTION public.reorder_canvases_in_folder(
  p_user_id UUID,
  p_canvas_ids UUID[],
  p_folder_id UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  i INTEGER;
BEGIN
  -- Update sort_order for each canvas in the provided order
  FOR i IN 1..array_length(p_canvas_ids, 1) LOOP
    UPDATE public.canvases 
    SET sort_order = i, updated_at = NOW()
    WHERE id = p_canvas_ids[i] 
    AND user_id = p_user_id
    AND (
      (p_folder_id IS NULL AND folder_id IS NULL) OR 
      (folder_id = p_folder_id)
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 