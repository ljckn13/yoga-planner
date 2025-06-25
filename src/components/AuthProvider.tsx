import { createContext, useContext, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useUser } from '../hooks/useUser'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, UserPreferences } from '../hooks/useUser'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  signIn: (email: string) => Promise<{ success?: boolean; error?: string }>
  signOut: () => Promise<{ success?: boolean; error?: string }>
  clearError: () => void
  // User profile functionality
  profile: UserProfile | null
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success?: boolean; error?: string; data?: any }>
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<{ success?: boolean; error?: string; data?: any }>
  getPreference: (key: keyof UserPreferences, defaultValue?: any) => any
  setPreference: (key: keyof UserPreferences, value: any) => Promise<{ success?: boolean; error?: string; data?: any }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()
  const userProfile = useUser()

  // Fetch user profile when user changes
  useEffect(() => {
    if (auth.user && !userProfile.profile) {
      // The useUser hook will handle fetching the profile
      // This is just to trigger the effect
    }
  }, [auth.user, userProfile.profile])

  const contextValue: AuthContextType = {
    ...auth,
    ...userProfile
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
} 