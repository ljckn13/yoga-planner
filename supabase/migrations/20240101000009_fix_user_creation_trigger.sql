-- Fix user creation trigger issue
-- This migration addresses the problem where users are authenticated but not created in public.users table

-- First, let's check if the trigger exists and drop it if it does
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a more robust user creation function that handles conflicts
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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to manually create missing user profiles
CREATE OR REPLACE FUNCTION public.create_missing_user_profiles()
RETURNS INTEGER AS $$
DECLARE
  auth_user RECORD;
  created_count INTEGER := 0;
BEGIN
  -- Find auth users that don't have corresponding public.users records
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data, au.created_at, au.updated_at
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    BEGIN
      INSERT INTO public.users (id, email, display_name, created_at, updated_at)
      VALUES (
        auth_user.id,
        auth_user.email,
        COALESCE(auth_user.raw_user_meta_data->>'display_name', auth_user.email),
        COALESCE(auth_user.created_at, NOW()),
        COALESCE(auth_user.updated_at, NOW())
      );
      created_count := created_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to create user profile for %: %', auth_user.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.create_missing_user_profiles() TO authenticated;

-- Run the function to create any missing user profiles
SELECT public.create_missing_user_profiles() as created_profiles;

-- Add a comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a user profile in public.users when a new user is created in auth.users';
COMMENT ON FUNCTION public.create_missing_user_profiles() IS 'Creates missing user profiles for existing auth users that don''t have public.users records'; 