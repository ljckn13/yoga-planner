-- Add test user for development
-- This ensures our hardcoded test user ID exists in the database

-- Insert test user into auth.users (if not exists)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test@example.com',
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"display_name": "Test User"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Insert corresponding user into public.users (will be handled by trigger if auth.users insert succeeded)
-- But let's ensure it exists
INSERT INTO public.users (
  id,
  email,
  display_name
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'test@example.com',
  'Test User'
) ON CONFLICT (id) DO NOTHING;

-- Add development-friendly RLS policies that allow operations for the test user
-- even when not authenticated (for local development only)

-- Allow test user operations on folders
CREATE POLICY "Allow test user folder operations" ON public.folders
  FOR ALL USING (user_id = '550e8400-e29b-41d4-a716-446655440000'::UUID);

-- Allow test user operations on canvases  
CREATE POLICY "Allow test user canvas operations" ON public.canvases
  FOR ALL USING (user_id = '550e8400-e29b-41d4-a716-446655440000'::UUID); 