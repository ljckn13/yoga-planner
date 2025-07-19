-- Fix RLS issues for local development testing

-- Temporarily disable RLS to allow all operations during development
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvases DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users for development
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.folders TO authenticated;
GRANT ALL ON public.canvases TO authenticated;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant execute permissions on all functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 