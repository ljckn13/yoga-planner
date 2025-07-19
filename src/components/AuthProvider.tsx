import { createContext, useContext, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useUser } from '../hooks/useUser'
import { CanvasService } from '../services/canvasService'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, UserPreferences } from '../hooks/useUser'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  signIn: (email: string) => Promise<{ success?: boolean; error?: string }>
  signOut: () => Promise<{ success?: boolean; error?: string }>
  deleteAccount: () => Promise<{ success?: boolean; error?: string }>
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

  // Delete account function
  const deleteAccount = async () => {
    try {
      if (!auth.user) {
        return { error: 'No user found to delete' }
      }

      console.log('🗑️ Starting account deletion...')
      
      // Delete all user data from the database
      await CanvasService.deleteUserAccount(auth.user.id)
      
      // Clear browser storage
      console.log('🧹 Clearing browser storage...')
      
      // Clear localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('yoga_flow') || key.includes('canvas') || key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key)
          console.log('Removed localStorage:', key)
        }
      })
      
      // Clear sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('yoga_flow') || key.includes('canvas') || key.includes('supabase') || key.includes('sb-')) {
          sessionStorage.removeItem(key)
          console.log('Removed sessionStorage:', key)
        }
      })
      
      // Clear indexedDB
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases()
        databases.forEach(db => {
          if (db.name && (db.name.includes('yoga') || db.name.includes('canvas') || db.name.includes('supabase') || db.name.includes('tldraw'))) {
            console.log('Deleting database:', db.name)
            indexedDB.deleteDatabase(db.name)
          }
        })
      }
      
      // Sign out the user (this will clear the auth session)
      await auth.signOut()
      
      console.log('✅ Account deletion completed successfully')
      return { success: true }
      
    } catch (error) {
      console.error('Error deleting account:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account'
      return { error: errorMessage }
    }
  }

  const contextValue: AuthContextType = {
    ...auth,
    ...userProfile,
    deleteAccount
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
} 