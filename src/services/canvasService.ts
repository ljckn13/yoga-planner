import { supabase } from '../lib/supabase'
import type { Folder, NewFolder, UpdateFolder, Canvas, NewCanvas, UpdateCanvas } from '../lib/supabase'

// Cache for root folder IDs to avoid multiple database calls
const rootFolderCache = new Map<string, string>();

// Canvas Service for handling folder and canvas CRUD operations
export class CanvasService {
  // ===== FOLDER OPERATIONS =====
  
  /**
   * Get or create a root folder for a user
   */
  static async getRootFolder(userId: string): Promise<string> {
    // Check cache first
    if (rootFolderCache.has(userId)) {
      return rootFolderCache.get(userId)!;
    }

    try {
      // Use the database function to ensure root folder exists
      const { data: rootFolderId, error } = await supabase
        .rpc('ensure_root_folder_exists', {
          p_user_id: userId
        });

      if (error) throw error;
      
      // Cache and return the root folder ID
      rootFolderCache.set(userId, rootFolderId);
      return rootFolderId;
    } catch (error) {
      console.error('Error getting/creating root folder:', error);
      throw error;
    }
  }

  /**
   * Get all folders for a user (excluding root folder from UI)
   */
  static async getUserFolders(userId: string): Promise<Folder[]> {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .neq('name', 'Root') // Exclude root folders from UI
        .order('sort_order')
      
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
  static async createFolder(folder: NewFolder, insertAtBeginning: boolean = false): Promise<Folder> {
    try {
      // Use the database function to get the next sort_order
      const { data: nextSortOrder, error: sortError } = await supabase
        .rpc('get_next_folder_sort_order', {
          p_user_id: folder.user_id,
          p_insert_at_beginning: insertAtBeginning
        })
      
      if (sortError) throw sortError
      
      const { data, error } = await supabase
        .from('folders')
        .insert({ ...folder, sort_order: nextSortOrder })
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
      // Get the user_id from any canvas in this folder to find the root folder
      const { data: sampleCanvas, error: sampleError } = await supabase
        .from('canvases')
        .select('user_id')
        .eq('folder_id', id)
        .limit(1)
        .single()

      if (sampleError && sampleError.code !== 'PGRST116') {
        throw sampleError
      }

      // If there are canvases in this folder, move them to root
      if (sampleCanvas) {
        const rootFolderId = await this.getRootFolder(sampleCanvas.user_id)
        
        const { error: updateError } = await supabase
          .from('canvases')
          .update({ folder_id: rootFolderId })
          .eq('folder_id', id)
        
        if (updateError) throw updateError
      }
      
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
      // Keep folderId as is - null means top-level canvases, specific ID means canvases in that folder
      const effectiveFolderId = folderId;
      
      let query = supabase
        .from('canvases')
        .select('*')
        .eq('user_id', userId)
      
      if (effectiveFolderId !== undefined) {
        query = query.eq('folder_id', effectiveFolderId)
      }
      
      const { data, error } = await query.order('sort_order')
      
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
  static async createCanvas(canvas: NewCanvas, insertAtBeginning: boolean = false): Promise<Canvas> {
    try {
      // If no folder_id is provided (null), use the root folder
      // Otherwise use the provided folder_id
      const effectiveFolderId = canvas.folder_id || await this.getRootFolder(canvas.user_id);
      
      // Get the next sort order using the database function
      const { data: nextSortOrder, error: sortError } = await supabase
        .rpc('get_next_canvas_sort_order', {
          p_user_id: canvas.user_id,
          p_folder_id: effectiveFolderId,
          p_insert_at_beginning: insertAtBeginning
        })
      
      if (sortError) {
        console.error('Error getting next sort order:', sortError)
        // Fallback to 1 if the function fails
        console.log('Falling back to sort_order = 1')
      }
      
      const newSortOrder = nextSortOrder || 1

      const { data, error } = await supabase
        .from('canvases')
        .insert([{
          ...canvas,
          folder_id: effectiveFolderId,
          sort_order: newSortOrder,
        }])
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
      // Get the canvas to determine user_id first
      const { data: canvas, error: fetchError } = await supabase
        .from('canvases')
        .select('user_id')
        .eq('id', canvasId)
        .single()
      
      if (fetchError) throw fetchError
      if (!canvas) throw new Error('Canvas not found')

      // If no folder_id is provided (null), use the root folder
      // Otherwise use the provided folder_id
      const effectiveFolderId = folderId || await this.getRootFolder(canvas.user_id);
      
      // (canvas user_id already fetched above)
      
      // Get the next sort order for first position in the target folder
      const { data: nextSortOrder, error: sortError } = await supabase
        .rpc('get_next_canvas_sort_order', {
          p_user_id: canvas.user_id,
          p_folder_id: effectiveFolderId,
          p_insert_at_beginning: true
        })
      
      if (sortError) {
        console.error('Error getting next sort order:', sortError)
        // Fallback to 1 if the function fails
      }
      
      const newSortOrder = nextSortOrder || 1

      // Update both folder_id and sort_order to place at first position
      const { data, error } = await supabase
        .from('canvases')
        .update({ 
          folder_id: effectiveFolderId,
          sort_order: newSortOrder
        })
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

  /**
   * Reorder canvases within the same folder - proper drag-and-drop logic
   */
  static async reorderCanvases(userId: string, sourceId: string, targetId: string): Promise<void> {
    if (sourceId === targetId) {
      return;
    }

    try {
      // Get all canvases in the same folder as the source canvas
      const { data: sourceCanvas, error: sourceError } = await supabase
        .from('canvases')
        .select('folder_id, sort_order')
        .eq('id', sourceId)
        .eq('user_id', userId)
        .single();

      if (sourceError || !sourceCanvas) {
        throw new Error('Source canvas not found');
      }

      const { data: targetCanvas, error: targetError } = await supabase
        .from('canvases')
        .select('folder_id, sort_order')
        .eq('id', targetId)
        .eq('user_id', userId)
        .single();

      if (targetError || !targetCanvas) {
        throw new Error('Target canvas not found');
      }

      // Ensure both canvases are in the same folder
      if (sourceCanvas.folder_id !== targetCanvas.folder_id) {
        throw new Error('Canvases must be in the same folder for reordering');
      }

      const folderId = sourceCanvas.folder_id;

      // Get all canvases in the folder, ordered by sort_order
      const { data: allCanvases, error: fetchError } = await supabase
        .from('canvases')
        .select('id, sort_order')
        .eq('user_id', userId)
        .eq('folder_id', folderId)
        .order('sort_order', { ascending: true });

      if (fetchError || !allCanvases) {
        throw new Error('Failed to fetch canvases for reordering');
      }

      // Find current positions
      const sourceIndex = allCanvases.findIndex((c: any) => c.id === sourceId);
      const targetIndex = allCanvases.findIndex((c: any) => c.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) {
        throw new Error('Canvas not found in folder');
      }

      // Create new order array
      const reorderedCanvases = [...allCanvases];
      const [movedCanvas] = reorderedCanvases.splice(sourceIndex, 1);
      reorderedCanvases.splice(targetIndex, 0, movedCanvas);

      // Update sort_order for all affected canvases
      const updates = reorderedCanvases.map((canvas, index) => ({
        id: canvas.id,
        sort_order: index + 1
      }));

      // Perform individual updates to respect RLS policies
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('canvases')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
          .eq('user_id', userId);

        if (updateError) {
          throw updateError;
        }
      }
    } catch (error) {
      console.error('Error reordering canvases:', error);
      throw error;
    }
  }

  /**
   * Reorder folders
   */
  static async reorderFolders(userId: string, sourceId: string, targetId: string): Promise<void> {
    try {
      // Get all user folders (excluding root folders - same as UI)
      const { data: folders, error: fetchError } = await supabase
        .from('folders')
        .select('id, sort_order')
        .eq('user_id', userId)
        .neq('name', 'Root') // Exclude root folders from reordering
        .order('sort_order')
      
      if (fetchError) throw fetchError
      if (!folders) throw new Error('Could not fetch folders')
      
      // Find the target position
      const targetIndex = folders.findIndex((f: any) => f.id === targetId)
      if (targetIndex === -1) throw new Error('Target folder not found')
      
      // Remove source from current position and insert at target position
      const reorderedFolders = folders.filter((f: any) => f.id !== sourceId)
      const sourceFolder = folders.find((f: any) => f.id === sourceId)
      if (!sourceFolder) throw new Error('Source folder not found')
      
      reorderedFolders.splice(targetIndex, 0, sourceFolder)
      
      // Update sort_order for all folders
      const updates = reorderedFolders.map((folder: any, index: number) => ({
        id: folder.id,
        sort_order: index + 1
      }))
      
      // Batch update all folders
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('folders')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
        
        if (updateError) throw updateError
      }
      
    } catch (error) {
      console.error('Error reordering folders:', error)
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