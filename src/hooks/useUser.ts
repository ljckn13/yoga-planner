import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface UserProfile {
  id: string
  email: string
  display_name?: string
  avatar_url?: string
  preferences?: UserPreferences
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto'
  default_canvas_title?: string
  auto_save_delay?: number
  show_grid?: boolean
  notifications_enabled?: boolean
}

export function useUser() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get user profile from database
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        
        // If the user doesn't exist in public.users, try to create it
        if (error.code === 'PGRST116' || error.code === '406') {
          console.log('🔄 User profile not found, attempting to create...')
          return await createUserProfile(userId)
        }
        
        // For other errors, set the error and return null
        setError(error.message)
        return null
      }

      return data as UserProfile
    } catch (err) {
      console.error('Error in fetchProfile:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }

  // Create user profile if it doesn't exist
  const createUserProfile = async (userId: string) => {
    try {
      // Get user info from auth
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Error getting auth user:', authError)
        return null
      }

      // Create user profile
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: user.email || '',
          display_name: user.user_metadata?.display_name || user.email || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user profile:', error)
        setError(error.message)
        return null
      }

      console.log('✅ User profile created successfully')
      return data as UserProfile
    } catch (err) {
      console.error('Error in createUserProfile:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }

  // Load profile when user changes
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Get current user from auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.log('🔐 Authentication error in useUser, clearing session:', authError.message)
          
          // If it's a JWT error (stale token) or missing session, clear the session
          if (authError.message.includes('JWT') || 
              authError.message.includes('sub claim') ||
              authError.message.includes('Auth session missing')) {
            await supabase.auth.signOut()
            setProfile(null)
            setError(null) // Don't set error for normal auth states
            setIsLoading(false)
            return
          }
          
          // For other errors, set the error state
          setProfile(null)
          setError(authError.message)
          setIsLoading(false)
          return
        }
        
        if (user) {
          console.log('👤 User found, loading profile...')
          setIsLoading(true)
          setError(null)
          
          const userProfile = await fetchProfile(user.id)
          if (userProfile) {
            setProfile(userProfile)
          } else {
            // Profile fetch failed, but user exists - this is an error state
            setError('Failed to load user profile')
          }
        } else {
          console.log('🔐 No user found, redirecting to sign in')
          setProfile(null)
          setError(null)
        }
      } catch (err) {
        console.error('Error in loadProfile:', err)
        setProfile(null)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return { error: 'No profile to update' }

    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        setError(error.message)
        return { error: error.message }
      }

      setProfile(data as UserProfile)
      return { success: true, data }
    } catch (err) {
      console.error('Error in updateProfile:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  // Update user preferences
  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!profile) return { error: 'No profile to update' }

    const updatedPreferences = {
      ...profile.preferences,
      ...preferences
    }

    return updateProfile({ preferences: updatedPreferences })
  }

  // Get a specific preference value
  const getPreference = (key: keyof UserPreferences, defaultValue?: any) => {
    return profile?.preferences?.[key] ?? defaultValue
  }

  // Set a specific preference value
  const setPreference = async (key: keyof UserPreferences, value: any) => {
    return updatePreferences({ [key]: value })
  }

  // Upload avatar image
  const uploadAvatar = async (file: File) => {
    if (!profile) return { error: 'No profile to update' }

    try {
      setIsLoading(true)
      setError(null)

      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError)
        setError(uploadError.message)
        return { error: uploadError.message }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      return updateProfile({ avatar_url: publicUrl })
    } catch (err) {
      console.error('Error in uploadAvatar:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  // Delete avatar
  const deleteAvatar = async () => {
    if (!profile?.avatar_url) return { error: 'No avatar to delete' }

    try {
      setIsLoading(true)
      setError(null)

      // Extract file path from URL
      const urlParts = profile.avatar_url.split('/')
      const filePath = urlParts.slice(-2).join('/') // Get 'avatars/filename.ext'

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath])

      if (deleteError) {
        console.error('Error deleting avatar:', deleteError)
        setError(deleteError.message)
        return { error: deleteError.message }
      }

      // Update profile to remove avatar URL
      return updateProfile({ avatar_url: undefined })
    } catch (err) {
      console.error('Error in deleteAvatar:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    updatePreferences,
    getPreference,
    setPreference,
    uploadAvatar,
    deleteAvatar,
    clearError: () => setError(null)
  }
}