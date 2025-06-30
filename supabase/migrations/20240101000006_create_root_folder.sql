-- Create the root folder with the special UUID
-- This ensures the root folder exists for all users

-- Create a function to ensure root folder exists for any user
CREATE OR REPLACE FUNCTION public.ensure_root_folder_exists(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  root_folder_id UUID;
BEGIN
  -- Check if root folder already exists for this user
  SELECT id INTO root_folder_id
  FROM public.folders 
  WHERE user_id = p_user_id AND name = 'Root' AND parent_folder_id IS NULL
  LIMIT 1;
  
  -- If root folder doesn't exist, create it
  IF root_folder_id IS NULL THEN
    -- Generate a new UUID for this user's root folder
    root_folder_id := gen_random_uuid();
    
    INSERT INTO public.folders (
      id,
      user_id,
      name,
      description,
      color,
      parent_folder_id,
      sort_order,
      created_at,
      updated_at
    ) VALUES (
      root_folder_id,
      p_user_id,
      'Root',
      'Root folder for top-level canvases',
      '#666666',
      NULL,
      0,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN root_folder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 