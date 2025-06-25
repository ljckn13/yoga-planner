-- Migration: Add user profile fields
-- Run this in your Supabase SQL Editor to update existing users table

-- Add new columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Update existing users to have default preferences
UPDATE public.users 
SET preferences = '{}'::jsonb 
WHERE preferences IS NULL; 