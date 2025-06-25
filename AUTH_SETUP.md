# Authentication Setup Guide

## Supabase Authentication Configuration

### 1. Configure Site URL and Redirect URLs

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/lmwbfbnduhijqmoqhxpi
2. Navigate to **Authentication** → **Settings**
3. Configure the following:

**Site URL:**
```
http://localhost:5173
```

**Redirect URLs:**
```
http://localhost:5173/auth/callback
http://localhost:5173
```

### 2. Email Template Configuration (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the "Magic Link" template if desired
3. The default template should work fine

### 3. Test the Authentication Flow

1. Start your development server: `npm run dev`
2. Open http://localhost:5173
3. You should see the sign-in page
4. Enter your email address
5. Check your email for the magic link
6. Click the magic link to sign in

### 4. Authentication Flow

- **Unauthenticated users**: See the sign-in page
- **Authenticated users**: See the yoga flow planner
- **Magic link**: Sent to user's email
- **Session persistence**: Automatically maintained across browser sessions

### 5. Next Steps

After authentication is working:
- ✅ AUTH-002: Magic Link Authentication (Complete)
- 🔄 AUTH-003: Create User Context and Auth Hooks
- ⭕ AUTH-004: Add Sign Out and Account Management

## Troubleshooting

### Common Issues:

1. **Magic link not received**: Check spam folder
2. **Redirect error**: Ensure redirect URLs are configured correctly
3. **Session not persisting**: Check browser console for errors

### Debug Information:

- Check browser console for authentication logs
- Verify Supabase project settings
- Test with different email addresses 