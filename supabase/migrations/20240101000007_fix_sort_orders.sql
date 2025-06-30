-- Fix corrupted sort_order values by resetting them to be sequential within each folder
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