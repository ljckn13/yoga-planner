-- Fix the variable name conflict in get_next_canvas_sort_order_v2 function

CREATE OR REPLACE FUNCTION public.get_next_canvas_sort_order_v2(
  p_user_id UUID,
  p_folder_id UUID,
  p_insert_at_beginning BOOLEAN DEFAULT FALSE
) RETURNS INTEGER AS $$
DECLARE
  next_sort_order INTEGER;
BEGIN
  IF p_insert_at_beginning THEN
    UPDATE public.canvases 
    SET sort_order = sort_order + 1
    WHERE user_id = p_user_id AND COALESCE(folder_id::text, 'root') = COALESCE(p_folder_id::text, 'root');
    RETURN 1;
  ELSE
    SELECT COALESCE(MAX(sort_order), 0) + 1
    INTO next_sort_order
    FROM public.canvases 
    WHERE user_id = p_user_id AND COALESCE(folder_id::text, 'root') = COALESCE(p_folder_id::text, 'root');
    RETURN next_sort_order;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_next_canvas_sort_order_v2(UUID, UUID, BOOLEAN) TO authenticated; 