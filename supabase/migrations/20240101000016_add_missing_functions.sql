-- Add missing functions for folder management

-- Function to get next folder sort order
CREATE OR REPLACE FUNCTION public.get_next_folder_sort_order(
  p_user_id UUID,
  p_insert_at_beginning BOOLEAN DEFAULT FALSE
) RETURNS INTEGER AS $$
BEGIN
  IF p_insert_at_beginning THEN
    UPDATE public.folders 
    SET sort_order = sort_order + 1
    WHERE user_id = p_user_id;
    RETURN 1;
  ELSE
    SELECT COALESCE(MAX(sort_order), 0) + 1
    INTO p_insert_at_beginning
    FROM public.folders 
    WHERE user_id = p_user_id;
    RETURN p_insert_at_beginning;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_next_folder_sort_order(UUID, BOOLEAN) TO authenticated; 