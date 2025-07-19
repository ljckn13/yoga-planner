-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create folders table (NEW)
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#885050', -- Folder color for UI
  parent_folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE, -- For nested folders
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create canvases table (ENHANCED with folder support)
CREATE TABLE IF NOT EXISTS public.canvases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL, -- Optional folder
  title TEXT NOT NULL DEFAULT 'Untitled Canvas',
  description TEXT,
  data JSONB NOT NULL DEFAULT '{}', -- tldraw snapshot data
  thumbnail TEXT, -- Base64 thumbnail
  is_public BOOLEAN DEFAULT FALSE, -- For future sharing features
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvases ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON public.folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_canvases_user_id ON public.canvases(user_id);
CREATE INDEX IF NOT EXISTS idx_canvases_folder_id ON public.canvases(folder_id);
CREATE INDEX IF NOT EXISTS idx_canvases_updated_at ON public.canvases(updated_at DESC);

-- Create indexes for sort_order
CREATE INDEX IF NOT EXISTS idx_canvases_sort_order ON public.canvases(sort_order);
CREATE INDEX IF NOT EXISTS idx_folders_sort_order ON public.folders(sort_order);

-- Create composite indexes for better performance
CREATE INDEX IF NOT EXISTS idx_canvases_user_folder_sort 
ON public.canvases(user_id, COALESCE(folder_id::text, 'root'), sort_order);

CREATE INDEX IF NOT EXISTS idx_folders_user_sort 
ON public.folders(user_id, sort_order);

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for folders table (NEW)
CREATE POLICY "Users can view own folders" ON public.folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folders" ON public.folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders" ON public.folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders" ON public.folders
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for canvases table (enhanced)
CREATE POLICY "Users can view own canvases" ON public.canvases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own canvases" ON public.canvases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own canvases" ON public.canvases
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own canvases" ON public.canvases
  FOR DELETE USING (auth.uid() = user_id);

-- Function to handle user creation
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

-- Trigger to automatically create user profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get the next sort_order for canvases
CREATE OR REPLACE FUNCTION public.get_next_canvas_sort_order(
  p_user_id UUID,
  p_folder_id UUID,
  p_insert_at_beginning BOOLEAN DEFAULT FALSE
) RETURNS INTEGER AS $$
BEGIN
  IF p_insert_at_beginning THEN
    -- Insert at beginning: shift all existing items and use sort_order 1
    UPDATE public.canvases 
    SET sort_order = sort_order + 1
    WHERE user_id = p_user_id AND COALESCE(folder_id::text, 'root') = COALESCE(p_folder_id::text, 'root');
    
    RETURN 1;
  ELSE
    -- Insert at end: get next available sort_order
    SELECT COALESCE(MAX(sort_order), 0) + 1
    INTO p_insert_at_beginning
    FROM public.canvases 
    WHERE user_id = p_user_id AND COALESCE(folder_id::text, 'root') = COALESCE(p_folder_id::text, 'root');
    
    RETURN p_insert_at_beginning;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to ensure root folder exists
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
      1,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN root_folder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_next_canvas_sort_order(UUID, UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_root_folder_exists(UUID) TO authenticated;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_canvases_updated_at
  BEFORE UPDATE ON public.canvases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); 