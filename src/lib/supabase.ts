import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lmwbfbnduhijqmoqhxpi.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY



let supabase: any

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable')
  console.error('Please check your .env file and restart the development server')
  // Don't throw error, just create a dummy client for now
  supabase = createClient('https://dummy.supabase.co', 'dummy-key')
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
    
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
          display_name: string | null
          avatar_url: string | null
          preferences: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          preferences?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          preferences?: any
          created_at?: string
          updated_at?: string
        }
      }
      folders: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          color: string
          parent_folder_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          color?: string
          parent_folder_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          color?: string
          parent_folder_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      canvases: {
        Row: {
          id: string
          user_id: string
          folder_id: string | null
          title: string
          description: string | null
          data: any
          thumbnail: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          folder_id?: string | null
          title?: string
          description?: string | null
          data?: any
          thumbnail?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          folder_id?: string | null
          title?: string
          description?: string | null
          data?: any
          thumbnail?: string | null
          is_public?: boolean
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
export type NewUser = Database['public']['Tables']['users']['Insert']
export type UpdateUser = Database['public']['Tables']['users']['Update']

export type Folder = Database['public']['Tables']['folders']['Row']
export type NewFolder = Database['public']['Tables']['folders']['Insert']
export type UpdateFolder = Database['public']['Tables']['folders']['Update']

export type Canvas = Database['public']['Tables']['canvases']['Row']
export type NewCanvas = Database['public']['Tables']['canvases']['Insert']
export type UpdateCanvas = Database['public']['Tables']['canvases']['Update'] 