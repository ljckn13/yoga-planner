import { supabase } from '../lib/supabase'
import type { Folder, NewFolder, UpdateFolder, Canvas, NewCanvas, UpdateCanvas } from '../lib/supabase'

// Canvas Service for handling folder and canvas CRUD operations
export class CanvasService {
  // ===== FOLDER OPERATIONS =====
  
  /**
   * Get all folders for the current user
   */
  static async getUserFolders(userId: string): Promise<Folder[]> {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching user folders:', error)
      throw error
    }
  }

  /**
   * Create a new folder
   */
  static async createFolder(folder: NewFolder): Promise<Folder> {
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert(folder)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating folder:', error)
      throw error
    }
  }

  /**
   * Update a folder
   */
  static async updateFolder(id: string, updates: UpdateFolder): Promise<Folder> {
    try {
      const { data, error } = await supabase
        .from('folders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating folder:', error)
      throw error
    }
  }

  /**
   * Delete a folder (and move its canvases to root level)
   */
  static async deleteFolder(id: string): Promise<void> {
    try {
      // First, move all canvases in this folder to root level (null folder_id)
      const { error: updateError } = await supabase
        .from('canvases')
        .update({ folder_id: null })
        .eq('folder_id', id)
      
      if (updateError) throw updateError

      // Then delete the folder
      const { error: deleteError } = await supabase
        .from('folders')
        .delete()
        .eq('id', id)
      
      if (deleteError) throw deleteError
    } catch (error) {
      console.error('Error deleting folder:', error)
      throw error
    }
  }

  // ===== CANVAS OPERATIONS =====

  /**
   * Get all canvases for the current user (optionally filtered by folder)
   */
  static async getUserCanvases(userId: string, folderId?: string | null): Promise<Canvas[]> {
    try {
      let query = supabase
        .from('canvases')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
      
      if (folderId !== undefined) {
        query = query.eq('folder_id', folderId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching user canvases:', error)
      throw error
    }
  }

  /**
   * Create a new canvas
   */
  static async createCanvas(canvas: NewCanvas): Promise<Canvas> {
    try {
      const { data, error } = await supabase
        .from('canvases')
        .insert(canvas)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating canvas:', error)
      throw error
    }
  }

  /**
   * Update a canvas
   */
  static async updateCanvas(id: string, updates: UpdateCanvas): Promise<Canvas> {
    try {
      const { data, error } = await supabase
        .from('canvases')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating canvas:', error)
      throw error
    }
  }

  /**
   * Delete a canvas
   */
  static async deleteCanvas(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('canvases')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting canvas:', error)
      throw error
    }
  }

  /**
   * Move a canvas to a different folder
   */
  static async moveCanvas(canvasId: string, folderId: string | null): Promise<Canvas> {
    try {
      const { data, error } = await supabase
        .from('canvases')
        .update({ folder_id: folderId })
        .eq('id', canvasId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error moving canvas:', error)
      throw error
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Get canvas with folder information
   */
  static async getCanvasWithFolder(canvasId: string): Promise<Canvas & { folder?: Folder }> {
    try {
      const { data, error } = await supabase
        .from('canvases')
        .select(`
          *,
          folder:folders(*)
        `)
        .eq('id', canvasId)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching canvas with folder:', error)
      throw error
    }
  }

  /**
   * Get folder with its canvases
   */
  static async getFolderWithCanvases(folderId: string): Promise<Folder & { canvases: Canvas[] }> {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select(`
          *,
          canvases:canvases(*)
        `)
        .eq('id', folderId)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching folder with canvases:', error)
      throw error
    }
  }
} 