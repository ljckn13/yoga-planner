import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lmwbfbnduhijqmoqhxpi.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logging
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key exists:', !!supabaseAnonKey)
console.log('Anon Key length:', supabaseAnonKey?.length)
console.log('Anon Key starts with:', supabaseAnonKey?.substring(0, 20))

let supabase: any

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable')
  console.error('Please check your .env file and restart the development server')
  // Don't throw error, just create a dummy client for now
  supabase = createClient('https://dummy.supabase.co', 'dummy-key')
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log('Supabase client created successfully')
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    supabase = createClient('https://dummy.supabase.co', 'dummy-key')
  }
}

export { supabase }

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      canvases: {
        Row: {
          id: string
          user_id: string
          title: string
          data: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          data: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          data?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type Canvas = Database['public']['Tables']['canvases']['Row']
export type NewUser = Database['public']['Tables']['users']['Insert']
export type NewCanvas = Database['public']['Tables']['canvases']['Insert'] 