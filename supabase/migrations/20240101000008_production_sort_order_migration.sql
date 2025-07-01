-- Production Migration: Add sort_order support and related functions
-- This migration combines all sort_order related changes for production deployment

-- Step 1: Add sort_order columns to existing tables
ALTER TABLE public.canvases ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 1;
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 1;

-- Step 2: Create indexes for sort_order
CREATE INDEX IF NOT EXISTS idx_canvases_sort_order ON public.canvases(sort_order);
CREATE INDEX IF NOT EXISTS idx_folders_sort_order ON public.folders(sort_order);

-- Step 3: Create composite indexes for better performance on folder-scoped queries
DROP INDEX IF EXISTS idx_canvases_folder_sort;
CREATE INDEX IF NOT EXISTS idx_canvases_folder_sort 
ON public.canvases(user_id, COALESCE(folder_id::text, 'root'), sort_order);

DROP INDEX IF EXISTS idx_folders_user_sort;
CREATE INDEX IF NOT EXISTS idx_folders_user_sort 
ON public.folders(user_id, sort_order);

-- Step 4: Update existing records to have sequential sort_order
UPDATE public.canvases 
SET sort_order = subquery.row_num 
FROM (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY user_id, COALESCE(folder_id::text, 'root') 
    ORDER BY created_at
  ) as row_num
  FROM public.canvases
) as subquery 
WHERE public.canvases.id = subquery.id;

UPDATE public.folders 
SET sort_order = subquery.row_num 
FROM (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY user_id 
    ORDER BY created_at
  ) as row_num
  FROM public.folders
) as subquery 
WHERE public.folders.id = subquery.id;

-- Step 5: Create function to get the next sort_order for canvases
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
    WHERE user_id = p_user_id AND folder_id IS NOT DISTINCT FROM p_folder_id;
    
    RETURN 1;
  ELSE
    -- Insert at end: get next available sort_order
    SELECT COALESCE(MAX(sort_order), 0) + 1 
    INTO next_order
    FROM public.canvases 
    WHERE user_id = p_user_id AND folder_id IS NOT DISTINCT FROM p_folder_id;
    
    RETURN next_order;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create function to get the next sort_order for folders
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

-- Step 7: Create function to reorder canvases within a folder scope
CREATE OR REPLACE FUNCTION public.reorder_canvases_in_folder(
  p_user_id UUID,
  p_canvas_ids UUID[],
  p_folder_id UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  i INTEGER;
BEGIN
  -- Update sort_order and folder_id for each canvas in the provided order
  FOR i IN 1..array_length(p_canvas_ids, 1) LOOP
    UPDATE public.canvases 
    SET sort_order = i, folder_id = p_folder_id, updated_at = NOW()
    WHERE id = p_canvas_ids[i] 
    AND user_id = p_user_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create function to ensure root folder exists for a user
CREATE OR REPLACE FUNCTION public.ensure_root_folder_exists(
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  root_folder_id UUID;
BEGIN
  -- Check if root folder already exists for this user
  SELECT id INTO root_folder_id
  FROM public.folders
  WHERE user_id = p_user_id AND name = 'Root'
  LIMIT 1;
  
  -- If root folder doesn't exist, create it
  IF root_folder_id IS NULL THEN
    INSERT INTO public.folders (user_id, name, description, color, sort_order)
    VALUES (p_user_id, 'Root', 'Root folder for user canvases', '#885050', 1)
    RETURNING id INTO root_folder_id;
  END IF;
  
  RETURN root_folder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create function to fix corrupted sort_order values
CREATE OR REPLACE FUNCTION public.fix_canvas_sort_orders() RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  folder_record RECORD;
  canvas_record RECORD;
  sort_counter INTEGER;
BEGIN
  -- Loop through all users
  FOR user_record IN SELECT DISTINCT user_id FROM public.canvases LOOP
    -- Loop through all folders for this user (including null for root)
    FOR folder_record IN 
      SELECT DISTINCT folder_id 
      FROM public.canvases 
      WHERE user_id = user_record.user_id
    LOOP
      -- Reset sort_order for canvases in this folder
      sort_counter := 1;
      FOR canvas_record IN 
        SELECT id 
        FROM public.canvases 
        WHERE user_id = user_record.user_id 
        AND folder_id IS NOT DISTINCT FROM folder_record.folder_id
        ORDER BY created_at
      LOOP
        UPDATE public.canvases 
        SET sort_order = sort_counter, updated_at = NOW()
        WHERE id = canvas_record.id;
        
        sort_counter := sort_counter + 1;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_next_canvas_sort_order(UUID, UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_folder_sort_order(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_canvases_in_folder(UUID, UUID[], UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_root_folder_exists(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_canvas_sort_orders() TO authenticated;

-- Step 11: Update RLS policies to include sort_order in queries
-- (The existing policies should work, but we ensure they're properly set)
DROP POLICY IF EXISTS "Users can view own folders" ON public.folders;
CREATE POLICY "Users can view own folders" ON public.folders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own canvases" ON public.canvases;
CREATE POLICY "Users can view own canvases" ON public.canvases
  FOR SELECT USING (auth.uid() = user_id);

-- Step 12: Add comments for documentation
COMMENT ON COLUMN public.canvases.sort_order IS 'Order of canvases within a folder (1-based)';
COMMENT ON COLUMN public.folders.sort_order IS 'Order of folders for a user (1-based)';
COMMENT ON FUNCTION public.get_next_canvas_sort_order IS 'Get the next available sort_order for a canvas in a specific folder';
COMMENT ON FUNCTION public.get_next_folder_sort_order IS 'Get the next available sort_order for a folder';
COMMENT ON FUNCTION public.reorder_canvases_in_folder IS 'Reorder canvases within a folder by updating their sort_order values';
COMMENT ON FUNCTION public.ensure_root_folder_exists IS 'Ensure a root folder exists for a user, create if missing';
COMMENT ON FUNCTION public.fix_canvas_sort_orders IS 'Fix corrupted sort_order values by resetting them to be sequential within each folder'; 