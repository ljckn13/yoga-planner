-- Clean Fresh Start Migration
-- This sets up the complete database schema from scratch
-- Run this on a completely empty database

-- Step 1: Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create folders table
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#885050',
  parent_folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create canvases table
CREATE TABLE IF NOT EXISTS public.canvases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Canvas',
  description TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  thumbnail TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvases ENABLE ROW LEVEL SECURITY;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON public.folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_canvases_user_id ON public.canvases(user_id);
CREATE INDEX IF NOT EXISTS idx_canvases_folder_id ON public.canvases(folder_id);
CREATE INDEX IF NOT EXISTS idx_canvases_updated_at ON public.canvases(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_canvases_sort_order ON public.canvases(sort_order);
CREATE INDEX IF NOT EXISTS idx_folders_sort_order ON public.folders(sort_order);

-- Step 6: Create composite indexes for sort_order
CREATE INDEX IF NOT EXISTS idx_canvases_user_folder_sort 
ON public.canvases(user_id, COALESCE(folder_id::text, 'root'), sort_order);

CREATE INDEX IF NOT EXISTS idx_folders_user_sort 
ON public.folders(user_id, sort_order);

-- Step 7: RLS Policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 8: RLS Policies for folders table
DROP POLICY IF EXISTS "Users can view own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can insert own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can update own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON public.folders;

CREATE POLICY "Users can view own folders" ON public.folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folders" ON public.folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders" ON public.folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders" ON public.folders
  FOR DELETE USING (auth.uid() = user_id);

-- Step 9: RLS Policies for canvases table
DROP POLICY IF EXISTS "Users can view own canvases" ON public.canvases;
DROP POLICY IF EXISTS "Users can insert own canvases" ON public.canvases;
DROP POLICY IF EXISTS "Users can update own canvases" ON public.canvases;
DROP POLICY IF EXISTS "Users can delete own canvases" ON public.canvases;

CREATE POLICY "Users can view own canvases" ON public.canvases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own canvases" ON public.canvases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own canvases" ON public.canvases
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own canvases" ON public.canvases
  FOR DELETE USING (auth.uid() = user_id);

-- Step 10: Create robust user creation function
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

-- Step 11: Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 12: Create essential functions for canvas management
CREATE OR REPLACE FUNCTION public.get_next_canvas_sort_order_v2(
  p_user_id UUID,
  p_folder_id UUID,
  p_insert_at_beginning BOOLEAN DEFAULT FALSE
) RETURNS INTEGER AS $$
BEGIN
  IF p_insert_at_beginning THEN
    UPDATE public.canvases 
    SET sort_order = sort_order + 1
    WHERE user_id = p_user_id AND COALESCE(folder_id::text, 'root') = COALESCE(p_folder_id::text, 'root');
    RETURN 1;
  ELSE
    SELECT COALESCE(MAX(sort_order), 0) + 1
    INTO p_insert_at_beginning
    FROM public.canvases 
    WHERE user_id = p_user_id AND COALESCE(folder_id::text, 'root') = COALESCE(p_folder_id::text, 'root');
    RETURN p_insert_at_beginning;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Step 13: Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_next_canvas_sort_order_v2(UUID, UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_root_folder_exists_v2(UUID) TO authenticated;

-- Step 14: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 15: Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_folders_updated_at ON public.folders;
DROP TRIGGER IF EXISTS update_canvases_updated_at ON public.canvases;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_canvases_updated_at
  BEFORE UPDATE ON public.canvases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); 