-- Debug and Fix User Creation Trigger
-- This will test and fix the user creation trigger issue

-- First, let's check if the trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if the function exists
SELECT 
  routine_name, 
  routine_type, 
  security_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Drop and recreate the trigger with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a more robust user creation function with better logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the attempt
  RAISE LOG 'Attempting to create user profile for ID: %, Email: %', NEW.id, NEW.email;
  
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
  
  RAISE LOG 'Successfully created/updated user profile for ID: %', NEW.id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the trigger
    RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RAISE LOG 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.folders TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.canvases TO postgres, anon, authenticated, service_role;

-- Temporarily disable RLS to test user creation
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Create any missing user profiles for existing auth users
INSERT INTO public.users (id, email, display_name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'display_name', au.email),
  COALESCE(au.created_at, NOW()),
  COALESCE(au.updated_at, NOW())
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Test the trigger by checking if it exists
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'; 