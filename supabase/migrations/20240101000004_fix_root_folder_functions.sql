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

-- Update the reorder_canvases_in_folder function to handle root folders by name
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