-- Production Migrations for Yoga Planner
-- Run this in your Supabase SQL Editor

-- ===== MIGRATION 1: Fix the get_next_canvas_sort_order_v2 function =====
-- Drop the function first to avoid parameter default conflicts
DROP FUNCTION IF EXISTS public.get_next_canvas_sort_order_v2(UUID, UUID, BOOLEAN);
DROP FUNCTION IF EXISTS public.get_next_canvas_sort_order_v2(UUID, UUID);

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

-- ===== MIGRATION 2: Add the missing reorder_canvases_in_folder function =====
-- Drop the function first to avoid parameter default conflicts
DROP FUNCTION IF EXISTS public.reorder_canvases_in_folder(UUID, UUID[], UUID);
DROP FUNCTION IF EXISTS public.reorder_canvases_in_folder(UUID, UUID[], UUID, BOOLEAN);

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

-- ===== MIGRATION 3: Add missing folder sort order function =====
-- Drop the function first to avoid parameter default conflicts
DROP FUNCTION IF EXISTS public.get_next_folder_sort_order(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS public.get_next_folder_sort_order(UUID);

CREATE OR REPLACE FUNCTION public.get_next_folder_sort_order(
  p_user_id UUID,
  p_insert_at_beginning BOOLEAN DEFAULT FALSE
) RETURNS INTEGER AS $$
DECLARE
  next_sort_order INTEGER;
BEGIN
  IF p_insert_at_beginning THEN
    UPDATE public.folders 
    SET sort_order = sort_order + 1
    WHERE user_id = p_user_id AND name != 'Root';
    RETURN 1;
  ELSE
    SELECT COALESCE(MAX(sort_order), 0) + 1
    INTO next_sort_order
    FROM public.folders 
    WHERE user_id = p_user_id AND name != 'Root';
    RETURN next_sort_order;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_next_folder_sort_order(UUID, BOOLEAN) TO authenticated;

-- ===== MIGRATION 4: Ensure root folder function exists =====
-- Drop the function first to avoid parameter default conflicts
DROP FUNCTION IF EXISTS public.ensure_root_folder_exists_v2(UUID);

CREATE OR REPLACE FUNCTION public.ensure_root_folder_exists_v2(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  root_folder_id UUID;
BEGIN
  SELECT id INTO root_folder_id
  FROM public.folders 
  WHERE user_id = p_user_id AND name = 'Root' AND parent_folder_id IS NULL
  LIMIT 1;
  
  IF root_folder_id IS NULL THEN
    root_folder_id := gen_random_uuid();
    
    INSERT INTO public.folders (
      id, user_id, name, description, color, parent_folder_id, sort_order, created_at, updated_at
    ) VALUES (
      root_folder_id, p_user_id, 'Root', 'Root folder for top-level canvases', '#666666', NULL, 1, NOW(), NOW()
    );
  END IF;
  
  RETURN root_folder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.ensure_root_folder_exists_v2(UUID) TO authenticated;

-- ===== MIGRATION 5: Update user creation trigger to be more robust =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to insert the user, but handle conflicts gracefully
  INSERT INTO public.users (id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW())
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the trigger
    RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== MIGRATION 6: Create missing user profiles for existing auth users =====
-- This will create user profiles for any auth users that don't have them yet
INSERT INTO public.users (id, email, display_name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'display_name', au.email),
  COALESCE(au.created_at, NOW()),
  COALESCE(au.updated_at, NOW())
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ===== MIGRATION 7: Create root folders for users who don't have them =====
-- This will create root folders for any users that don't have them yet
INSERT INTO public.folders (id, user_id, name, description, color, parent_folder_id, sort_order, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  u.id,
  'Root',
  'Root folder for top-level canvases',
  '#666666',
  NULL,
  1,
  NOW(),
  NOW()
FROM public.users u
LEFT JOIN public.folders f ON u.id = f.user_id AND f.name = 'Root' AND f.parent_folder_id IS NULL
WHERE f.id IS NULL;

-- ===== MIGRATION 8: Fix any canvases without proper sort_order =====
-- Update canvases that have NULL or 0 sort_order to have proper sequential ordering
WITH canvas_updates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id, COALESCE(folder_id::text, 'root') ORDER BY created_at) as new_sort_order
  FROM public.canvases 
  WHERE sort_order IS NULL OR sort_order = 0
)
UPDATE public.canvases 
SET sort_order = cu.new_sort_order
FROM canvas_updates cu
WHERE public.canvases.id = cu.id;

-- ===== MIGRATION 9: Fix any folders without proper sort_order =====
-- Update folders that have NULL or 0 sort_order to have proper sequential ordering
WITH folder_updates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as new_sort_order
  FROM public.folders 
  WHERE (sort_order IS NULL OR sort_order = 0) AND name != 'Root'
)
UPDATE public.folders 
SET sort_order = fu.new_sort_order
FROM folder_updates fu
WHERE public.folders.id = fu.id;

-- Success message
SELECT 'All migrations applied successfully!' as status; 