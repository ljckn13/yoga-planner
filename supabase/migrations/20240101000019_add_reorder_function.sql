-- Add the missing reorder_canvases_in_folder function

CREATE OR REPLACE FUNCTION public.reorder_canvases_in_folder(
  p_user_id UUID,
  p_canvas_ids UUID[],
  p_folder_id UUID
) RETURNS VOID AS $$
DECLARE
  canvas_id UUID;
  new_sort_order INTEGER := 1;
BEGIN
  -- Validate that all canvas IDs belong to the user and folder
  IF EXISTS (
    SELECT 1 FROM public.canvases 
    WHERE id = ANY(p_canvas_ids) 
    AND (user_id != p_user_id OR COALESCE(folder_id::text, 'root') != COALESCE(p_folder_id::text, 'root'))
  ) THEN
    RAISE EXCEPTION 'Invalid canvas IDs provided';
  END IF;

  -- Update sort_order for each canvas in the provided order
  FOREACH canvas_id IN ARRAY p_canvas_ids
  LOOP
    UPDATE public.canvases 
    SET sort_order = new_sort_order
    WHERE id = canvas_id AND user_id = p_user_id;
    
    new_sort_order := new_sort_order + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.reorder_canvases_in_folder(UUID, UUID[], UUID) TO authenticated; 