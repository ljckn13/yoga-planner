-- Add user deletion function for production
-- This function can be called from the frontend with proper RLS

-- Function to delete user account and all associated data
CREATE OR REPLACE FUNCTION public.delete_user_account_v2(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Delete all user's canvases
  DELETE FROM public.canvases WHERE user_id = p_user_id;
  
  -- Delete all user's folders (this will cascade to any nested folders)
  DELETE FROM public.folders WHERE user_id = p_user_id;
  
  -- Delete user profile
  DELETE FROM public.users WHERE id = p_user_id;
  
  -- Return success
  RETURN jsonb_build_object('success', true, 'message', 'User account deleted successfully');
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error details
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account_v2(UUID) TO authenticated;

-- Add RLS policy to allow users to delete their own account
CREATE POLICY "Users can delete own account" ON public.users
  FOR DELETE USING (auth.uid() = id); 