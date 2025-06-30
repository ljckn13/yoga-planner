-- Fix database functions to properly handle root folders by name
-- This migration updates the functions to recognize root folders by name instead of fixed UUID

-- Update the get_next_canvas_sort_order function to handle root folders by name
CREATE OR REPLACE FUNCTION public.get_next_canvas_sort_order(
  p_user_id UUID, 
  p_folder_id UUID DEFAULT NULL,
  p_insert_at_beginning BOOLEAN DEFAULT FALSE
) RETURNS INTEGER AS $$
DECLARE
  next_order INTEGER;
  is_root_folder BOOLEAN := FALSE;
BEGIN
  -- Check if this is a root folder
  IF p_folder_id IS NOT NULL THEN
    SELECT (name = 'Root' AND parent_folder_id IS NULL) INTO is_root_folder
    FROM public.folders 
    WHERE id = p_folder_id;
  END IF;

  IF p_insert_at_beginning THEN
    -- Insert at beginning: shift all existing items and use sort_order 1
    IF p_folder_id IS NULL OR is_root_folder THEN
      -- Root folder case: handle canvases with null folder_id or in root folder
      UPDATE public.canvases 
      SET sort_order = sort_order + 1 
      WHERE user_id = p_user_id 
      AND (
        (p_folder_id IS NULL AND folder_id IS NULL) OR 
        (is_root_folder AND folder_id = p_folder_id)
      );
    ELSE
      -- Regular folder case
      UPDATE public.canvases 
      SET sort_order = sort_order + 1 
      WHERE user_id = p_user_id AND folder_id = p_folder_id;
    END IF;
    
    RETURN 1;
  ELSE
    -- Insert at end: get next available sort_order
    IF p_folder_id IS NULL OR is_root_folder THEN
      -- Root folder case: handle canvases with null folder_id or in root folder
      SELECT COALESCE(MAX(sort_order), 0) + 1 
      INTO next_order
      FROM public.canvases 
      WHERE user_id = p_user_id 
      AND (
        (p_folder_id IS NULL AND folder_id IS NULL) OR 
        (is_root_folder AND folder_id = p_folder_id)
      );
    ELSE
      -- Regular folder case
      SELECT COALESCE(MAX(sort_order), 0) + 1 
      INTO next_order
      FROM public.canvases 
      WHERE user_id = p_user_id AND folder_id = p_folder_id;
    END IF;
    
    RETURN next_order;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the reorder_canvases_in_folder function to handle root folders by name
CREATE OR REPLACE FUNCTION public.reorder_canvases_in_folder(
  p_user_id UUID,
  p_canvas_ids UUID[],
  p_folder_id UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  i INTEGER;
  is_root_folder BOOLEAN := FALSE;
BEGIN
  -- Check if this is a root folder
  IF p_folder_id IS NOT NULL THEN
    SELECT (name = 'Root' AND parent_folder_id IS NULL) INTO is_root_folder
    FROM public.folders 
    WHERE id = p_folder_id;
  END IF;

  -- Update sort_order for each canvas in the provided order
  FOR i IN 1..array_length(p_canvas_ids, 1) LOOP
    IF p_folder_id IS NULL OR is_root_folder THEN
      -- Root folder case: handle canvases with null folder_id or in root folder
      UPDATE public.canvases 
      SET sort_order = i, updated_at = NOW()
      WHERE id = p_canvas_ids[i] 
      AND user_id = p_user_id
      AND (
        (p_folder_id IS NULL AND folder_id IS NULL) OR 
        (is_root_folder AND folder_id = p_folder_id)
      );
    ELSE
      -- Regular folder case
      UPDATE public.canvases 
      SET sort_order = i, updated_at = NOW()
      WHERE id = p_canvas_ids[i] 
      AND user_id = p_user_id
      AND folder_id = p_folder_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 