import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null
  })

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setAuthState(prev => ({ ...prev, error: error.message, isLoading: false }))
          return
        }

        setAuthState({
          user: session?.user ?? null,
          isLoading: false,
          error: null
        })
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        setAuthState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Unknown error', 
          isLoading: false 
        }))
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        setAuthState({
          user: session?.user ?? null,
          isLoading: false,
          error: null
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Sign in with magic link
  const signIn = async (email: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Sign in error:', error)
        setAuthState(prev => ({ 
          ...prev, 
          error: error.message, 
          isLoading: false 
        }))
        return { error: error.message }
      }

      setAuthState(prev => ({ ...prev, isLoading: false }))
      return { success: true }
    } catch (error) {
      console.error('Sign in error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setAuthState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false 
      }))
      return { error: errorMessage }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        setAuthState(prev => ({ 
          ...prev, 
          error: error.message, 
          isLoading: false 
        }))
        return { error: error.message }
      }

      setAuthState(prev => ({ ...prev, isLoading: false }))
      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setAuthState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false 
      }))
      return { error: errorMessage }
    }
  }

  // Clear error
  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }))
  }

  return {
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,
    signIn,
    signOut,
    clearError
  }
} 