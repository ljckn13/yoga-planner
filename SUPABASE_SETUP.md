# Supabase Setup Guide

## Project Configuration

Your Supabase project is already created with ID: `lmwbfbnduhijqmoqhxpi`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=https://lmwbfbnduhijqmoqhxpi.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Database Schema Setup

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/lmwbfbnduhijqmoqhxpi
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL to create the database schema

## Authentication Setup

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure the following:
   - **Site URL**: `http://localhost:5173` (for development)
   - **Redirect URLs**: Add `http://localhost:5173/auth/callback`
3. Go to Authentication > Email Templates
4. Customize the magic link email template if desired

## Row Level Security (RLS)

The schema includes RLS policies that ensure:
- Users can only access their own data
- Canvas data is protected by user ownership
- Automatic user profile creation on signup

## Database Tables

### `users` table
- Extends Supabase auth.users
- Stores user profile information
- Automatically created when user signs up

### `canvases` table
- Stores canvas data for each user
- JSONB field for flexible canvas state storage
- Indexed for performance

## Next Steps

After setting up the database schema and environment variables:

1. Test the connection by running the app
2. Proceed to AUTH-002: Implement Magic Link Authentication
3. Create authentication hooks and components 