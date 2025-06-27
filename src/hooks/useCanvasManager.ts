import { useState, useCallback, useEffect, useRef } from 'react';
import { type Editor, loadSnapshot, getSnapshot } from 'tldraw';
import { CanvasService } from '../services/canvasService';
import type { Folder } from '../lib/supabase';

export interface CanvasMetadata {
  id: string;
  title: string;
  lastModified: Date;
  createdAt: Date;
  thumbnail?: string; // Base64 encoded thumbnail
  version: string;
  folderId?: string | null; // NEW: Folder support
  description?: string; // NEW: Description support
}

export interface CanvasListItem {
  metadata: CanvasMetadata;
  hasUnsavedChanges: boolean;
  saveStatus: 'saved' | 'saving' | 'error' | 'unsaved';
  isLoaded?: boolean; // Track if canvas is loaded in memory
  lastAccessed?: Date; // Track last access for LRU cache
  folder?: Folder; // NEW: Folder information
}

export interface UseCanvasManagerReturn {
  canvases: CanvasListItem[];
  folders: Folder[]; // NEW: Folders list
  currentCanvas: CanvasListItem | null;
  isLoading: boolean;
  error: string | null;
  createCanvas: (title?: string, folderId?: string | null) => Promise<string>;
  updateCanvas: (id: string, updates: Partial<CanvasMetadata>) => Promise<boolean>;
  deleteCanvas: (id: string) => Promise<boolean>;
  switchCanvas: (id: string) => Promise<boolean>;
  clearError: () => void;
  preloadCanvas: (id: string) => Promise<void>; // Preload canvas data
  unloadCanvas: (id: string) => void; // Unload canvas from memory
  // NEW: Folder operations
  createFolder: (name: string, description?: string) => Promise<string>;
  updateFolder: (id: string, updates: { name?: string; description?: string; color?: string }) => Promise<boolean>;
  deleteFolder: (id: string) => Promise<boolean>;
  moveCanvasToFolder: (canvasId: string, folderId: string | null) => Promise<boolean>;
  loadUserData: () => Promise<void>; // Load user's canvases and folders from Supabase
}

export interface UseCanvasManagerOptions {
  defaultCanvasTitle?: string;
  autoCreateDefault?: boolean;
  version?: string;
  maxLoadedCanvases?: number; // Limit number of canvases kept in memory
  userId?: string; // NEW: User ID for Supabase integration
  enableSupabase?: boolean; // NEW: Toggle Supabase integration
}

const CANVAS_LIST_KEY = 'yoga_flow_canvas_list';
const STORAGE_KEY_PREFIX = 'yoga_flow_canvas_';
const DEFAULT_CANVAS_TITLE = 'Untitled Flow';
const DEFAULT_MAX_LOADED_CANVASES = 3; // Keep only 3 canvases in memory

export function useCanvasManager(
  editor: Editor | null,
  options: UseCanvasManagerOptions = {}
): UseCanvasManagerReturn {
  const {
    defaultCanvasTitle = DEFAULT_CANVAS_TITLE,
    autoCreateDefault = true,
    version = '1.0.0',
    maxLoadedCanvases = DEFAULT_MAX_LOADED_CANVASES,
    userId,
    enableSupabase = true,
  } = options;

  const [canvases, setCanvases] = useState<CanvasListItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]); // NEW: Folders state
  const [currentCanvasId, setCurrentCanvasId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const defaultCanvasCreatedRef = useRef(false);
  
  // Track loaded canvases for LRU cache
  const loadedCanvasesRef = useRef<Set<string>>(new Set());
  const canvasAccessTimesRef = useRef<Map<string, number>>(new Map());

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // NEW: Load user data from Supabase
  const loadUserData = useCallback(async () => {
    if (!userId || !enableSupabase) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Load folders
      const userFolders = await CanvasService.getUserFolders(userId);
      setFolders(userFolders);
      
      // Load canvases
      const userCanvases = await CanvasService.getUserCanvases(userId);
      
      // Transform Supabase canvases to CanvasListItem format
      const transformedCanvases: CanvasListItem[] = userCanvases.map(canvas => ({
        metadata: {
          id: canvas.id,
          title: canvas.title,
          lastModified: new Date(canvas.updated_at),
          createdAt: new Date(canvas.created_at),
          thumbnail: canvas.thumbnail || undefined,
          version,
          folderId: canvas.folder_id,
          description: canvas.description || undefined,
        },
        hasUnsavedChanges: false,
        saveStatus: 'saved',
        isLoaded: false,
      }));
      
      setCanvases(transformedCanvases);
      
      // Set current canvas to the first one if none selected
      if (transformedCanvases.length > 0 && !currentCanvasId) {
        setCurrentCanvasId(transformedCanvases[0].metadata.id);
      }
      
      console.log('📥 Loaded user data from Supabase:', {
        folders: userFolders.length,
        canvases: transformedCanvases.length
      });
    } catch (err) {
      console.error('Error loading user data from Supabase:', err);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  }, [userId, enableSupabase, currentCanvasId, version]);

  // NEW: Folder operations
  const createFolder = useCallback(async (name: string, description?: string): Promise<string> => {
    if (!userId || !enableSupabase) {
      throw new Error('Supabase integration not available');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newFolder = await CanvasService.createFolder({
        user_id: userId,
        name,
        description,
      });
      
      setFolders(prev => [...prev, newFolder]);
      console.log('📁 Created folder:', newFolder.name);
      return newFolder.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create folder';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId, enableSupabase]);

  const updateFolder = useCallback(async (
    id: string, 
    updates: { name?: string; description?: string; color?: string }
  ): Promise<boolean> => {
    if (!enableSupabase) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedFolder = await CanvasService.updateFolder(id, updates);
      setFolders(prev => prev.map(folder => 
        folder.id === id ? updatedFolder : folder
      ));
      console.log('📁 Updated folder:', updatedFolder.name);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update folder';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [enableSupabase]);

  const deleteFolder = useCallback(async (id: string): Promise<boolean> => {
    if (!enableSupabase) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await CanvasService.deleteFolder(id);
      
      // Remove folder from state
      setFolders(prev => prev.filter(folder => folder.id !== id));
      
      // Update canvases that were in this folder (move to root)
      setCanvases(prev => prev.map(canvas => 
        canvas.metadata.folderId === id 
          ? { ...canvas, metadata: { ...canvas.metadata, folderId: null } }
          : canvas
      ));
      
      console.log('🗑️ Deleted folder:', id);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete folder';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [enableSupabase]);

  const moveCanvasToFolder = useCallback(async (canvasId: string, folderId: string | null): Promise<boolean> => {
    if (!enableSupabase) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await CanvasService.moveCanvas(canvasId, folderId);
      
      // Update canvas in state
      setCanvases(prev => prev.map(canvas => 
        canvas.metadata.id === canvasId 
          ? { ...canvas, metadata: { ...canvas.metadata, folderId } }
          : canvas
      ));
      
      console.log('📦 Moved canvas to folder:', { canvasId, folderId });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to move canvas';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [enableSupabase]);

  // LRU cache management
  const updateCanvasAccess = useCallback((canvasId: string) => {
    const now = Date.now();
    canvasAccessTimesRef.current.set(canvasId, now);
    
    // Update canvas list with last accessed time
    setCanvases(prev => prev.map(canvas => 
      canvas.metadata.id === canvasId 
        ? { ...canvas, lastAccessed: new Date(now) }
        : canvas
    ));
  }, []);

  const evictLeastRecentlyUsed = useCallback(() => {
    if (loadedCanvasesRef.current.size <= maxLoadedCanvases) return;
    
    // Find least recently used canvas
    let oldestCanvasId: string | null = null;
    let oldestTime = Infinity;
    
    for (const [canvasId, accessTime] of canvasAccessTimesRef.current) {
      if (accessTime < oldestTime && canvasId !== currentCanvasId) {
        oldestTime = accessTime;
        oldestCanvasId = canvasId;
      }
    }
    
    if (oldestCanvasId) {
      loadedCanvasesRef.current.delete(oldestCanvasId);
      canvasAccessTimesRef.current.delete(oldestCanvasId);
      
      // Update canvas list
      setCanvases(prev => prev.map(canvas => 
        canvas.metadata.id === oldestCanvasId 
          ? { ...canvas, isLoaded: false }
          : canvas
      ));
      
      console.log(`🗑️ Unloaded canvas ${oldestCanvasId} due to LRU cache limit`);
    }
  }, [maxLoadedCanvases, currentCanvasId]);

  // Create a blank canvas state
  const createBlankCanvasState = useCallback(() => {
    if (!editor) return null;
    
    try {
      const snapshot = getSnapshot(editor.store);
      return {
        snapshot,
        timestamp: Date.now(),
        version,
      };
    } catch (err) {
      console.error('Error creating blank canvas state:', err);
      return null;
    }
  }, [editor, version]);

  // Save canvas list to localStorage
  const saveCanvasList = useCallback((canvasList: CanvasListItem[]) => {
    try {
      localStorage.setItem(CANVAS_LIST_KEY, JSON.stringify(canvasList));
      console.log('💾 Canvas list saved to localStorage:', canvasList.length, 'canvases');
    } catch (err) {
      console.error('Error saving canvas list:', err);
      setError('Failed to save canvas list');
    }
  }, []);

  // Load canvas list from localStorage
  const loadCanvasList = useCallback(() => {
    try {
      const savedList = localStorage.getItem(CANVAS_LIST_KEY);
      if (savedList) {
        const parsedList = JSON.parse(savedList);
        // Validate and transform the saved data
        const validCanvases: CanvasListItem[] = parsedList
          .filter((item: any) => item.metadata && item.metadata.id)
          .map((item: any) => ({
            metadata: {
              ...item.metadata,
              lastModified: new Date(item.metadata.lastModified),
              createdAt: new Date(item.metadata.createdAt),
            },
            hasUnsavedChanges: item.hasUnsavedChanges || false,
            saveStatus: item.saveStatus || 'saved',
            isLoaded: false, // Start with unloaded state
            lastAccessed: item.lastAccessed ? new Date(item.lastAccessed) : undefined,
          }));
        setCanvases(validCanvases);
        
        // Set current canvas to the first one if none selected
        if (validCanvases.length > 0 && !currentCanvasId) {
          setCurrentCanvasId(validCanvases[0].metadata.id);
        }
      }
    } catch (err) {
      console.error('Error loading canvas list:', err);
      setError('Failed to load canvas list');
    }
  }, [currentCanvasId]);

  // Load canvas state from localStorage
  const loadCanvasState = useCallback(async (canvasId: string): Promise<boolean> => {
    console.log('loadCanvasState called with canvasId:', canvasId);
    console.log('Editor available:', !!editor);
    
    if (!editor) {
      console.error('No editor available');
      return false;
    }
    
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${canvasId}`;
      console.log('Looking for storage key:', storageKey);
      const savedData = localStorage.getItem(storageKey);
      console.log('Saved data found:', !!savedData);
      
      if (savedData) {
        const canvasState = JSON.parse(savedData);
        console.log('Canvas state parsed, has snapshot:', !!canvasState.snapshot);
        
        if (canvasState.snapshot) {
          console.log('Loading snapshot into editor...');
          loadSnapshot(editor.store, canvasState.snapshot);
          editor.updateInstanceState({});
          
          // Ensure only one page per canvas - remove extra pages
          const pages = editor.getPages();
          if (pages.length > 1) {
            const currentPageId = editor.getCurrentPageId();
            pages.forEach(page => {
              if (page.id !== currentPageId) {
                editor.deletePage(page.id);
              }
            });
          }
          
          // Mark as loaded and update access time
          loadedCanvasesRef.current.add(canvasId);
          updateCanvasAccess(canvasId);
          
          // Update canvas list
          setCanvases(prev => prev.map(canvas => 
            canvas.metadata.id === canvasId 
              ? { ...canvas, isLoaded: true }
              : canvas
          ));
          
          console.log('Canvas state loaded successfully');
          return true;
        }
      }
      
      console.log('No saved state found, creating blank canvas');
      // If no saved state, create a blank canvas
      const blankState = createBlankCanvasState();
      if (blankState) {
        const storageKey = `${STORAGE_KEY_PREFIX}${canvasId}`;
        localStorage.setItem(storageKey, JSON.stringify(blankState));
        
        // Ensure only one page exists
        const pages = editor.getPages();
        if (pages.length > 1) {
          const currentPageId = editor.getCurrentPageId();
          pages.forEach(page => {
            if (page.id !== currentPageId) {
              editor.deletePage(page.id);
            }
          });
        }
        
        // Mark as loaded and update access time
        loadedCanvasesRef.current.add(canvasId);
        updateCanvasAccess(canvasId);
        
        // Update canvas list
        setCanvases(prev => prev.map(canvas => 
          canvas.metadata.id === canvasId 
            ? { ...canvas, isLoaded: true }
            : canvas
        ));
        
        console.log('Blank canvas state created successfully');
        return true;
      }
      
      console.error('Failed to create blank canvas state');
      return false;
    } catch (err) {
      console.error('Error in loadCanvasState:', err);
      return false;
    }
  }, [editor, createBlankCanvasState, updateCanvasAccess]);

  // Preload canvas data without switching to it
  const preloadCanvas = useCallback(async (canvasId: string): Promise<void> => {
    if (loadedCanvasesRef.current.has(canvasId)) {
      updateCanvasAccess(canvasId);
      return; // Already loaded
    }
    
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${canvasId}`;
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        // Just mark as loaded without actually loading into editor
        loadedCanvasesRef.current.add(canvasId);
        updateCanvasAccess(canvasId);
        
        // Update canvas list
        setCanvases(prev => prev.map(canvas => 
          canvas.metadata.id === canvasId 
            ? { ...canvas, isLoaded: true }
            : canvas
        ));
        
        // Evict LRU if needed
        evictLeastRecentlyUsed();
        
        console.log(`📦 Preloaded canvas ${canvasId}`);
      }
    } catch (err) {
      console.error('Error preloading canvas:', err);
    }
  }, [updateCanvasAccess, evictLeastRecentlyUsed]);

  // Unload canvas from memory
  const unloadCanvas = useCallback((canvasId: string) => {
    if (canvasId === currentCanvasId) {
      console.warn('Cannot unload current canvas');
      return;
    }
    
    loadedCanvasesRef.current.delete(canvasId);
    canvasAccessTimesRef.current.delete(canvasId);
    
    // Update canvas list
    setCanvases(prev => prev.map(canvas => 
      canvas.metadata.id === canvasId 
        ? { ...canvas, isLoaded: false }
        : canvas
    ));
    
    console.log(`🗑️ Unloaded canvas ${canvasId}`);
  }, [currentCanvasId]);

  // Generate canvas thumbnail
  const generateThumbnail = useCallback(async (): Promise<string | undefined> => {
    if (!editor) return undefined;
    
    try {
      // For now, return undefined - we can implement actual thumbnail generation later
      // This could involve rendering the canvas to a canvas element and converting to base64
      return undefined;
    } catch (err) {
      console.error('Error generating thumbnail:', err);
      return undefined;
    }
  }, [editor]);

  // Create a new canvas
  const createCanvas = useCallback(async (title?: string, folderId?: string | null): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const canvasTitle = title || `${defaultCanvasTitle} ${canvases.length + 1}`;
      const now = new Date();
      
      let id: string;
      let newCanvas: CanvasListItem;

      if (userId && enableSupabase) {
        // Create canvas in Supabase
        const blankState = createBlankCanvasState();
        const supabaseCanvas = await CanvasService.createCanvas({
          user_id: userId,
          folder_id: folderId,
          title: canvasTitle,
          description: '',
          data: blankState || {},
          thumbnail: await generateThumbnail() || null,
          is_public: false,
        });
        
        id = supabaseCanvas.id;
        newCanvas = {
          metadata: {
            id: supabaseCanvas.id,
            title: supabaseCanvas.title,
            lastModified: new Date(supabaseCanvas.updated_at),
            createdAt: new Date(supabaseCanvas.created_at),
            thumbnail: supabaseCanvas.thumbnail || undefined,
            version,
            folderId: supabaseCanvas.folder_id,
            description: supabaseCanvas.description || undefined,
          },
          hasUnsavedChanges: false,
          saveStatus: 'saved',
          isLoaded: false,
        };
        
        console.log('📝 Created canvas in Supabase:', supabaseCanvas.title);
      } else {
        // Fallback to localStorage
        id = `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        newCanvas = {
          metadata: {
            id,
            title: canvasTitle,
            lastModified: now,
            createdAt: now,
            thumbnail: await generateThumbnail(),
            version,
            folderId,
          },
          hasUnsavedChanges: false,
          saveStatus: 'saved',
          isLoaded: false,
        };
        
        // Save to localStorage
        const updatedCanvases = [...canvases, newCanvas];
        saveCanvasList(updatedCanvases);
        
        console.log('📝 Created canvas in localStorage:', canvasTitle);
      }

      const updatedCanvases = [...canvases, newCanvas];
      setCanvases(updatedCanvases);
      
      // Switch to the new canvas
      setCurrentCanvasId(id);
      
      return id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create canvas';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [canvases, defaultCanvasTitle, version, generateThumbnail, saveCanvasList, userId, enableSupabase, createBlankCanvasState]);

  // Update canvas metadata
  const updateCanvas = useCallback(async (
    id: string, 
    updates: Partial<CanvasMetadata>
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedCanvases = canvases.map(canvas => {
        if (canvas.metadata.id === id) {
          return {
            ...canvas,
            metadata: {
              ...canvas.metadata,
              ...updates,
              lastModified: new Date(),
            },
          };
        }
        return canvas;
      });

      setCanvases(updatedCanvases);
      
      // Save to localStorage
      saveCanvasList(updatedCanvases);
      
      // Update in Supabase if available
      if (userId && enableSupabase) {
        const supabaseUpdates: any = {};
        if (updates.title !== undefined) supabaseUpdates.title = updates.title;
        if (updates.description !== undefined) supabaseUpdates.description = updates.description;
        if (updates.folderId !== undefined) supabaseUpdates.folder_id = updates.folderId;
        
        if (Object.keys(supabaseUpdates).length > 0) {
          await CanvasService.updateCanvas(id, supabaseUpdates);
          console.log('📝 Updated canvas in Supabase:', id);
        }
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update canvas';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [canvases, saveCanvasList, userId, enableSupabase]);

  // Delete a canvas
  const deleteCanvas = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Remove from canvas list
      const updatedCanvases = canvases.filter(canvas => canvas.metadata.id !== id);
      setCanvases(updatedCanvases);
      
      // Save to localStorage
      saveCanvasList(updatedCanvases);

      // Delete from Supabase if available
      if (userId && enableSupabase) {
        await CanvasService.deleteCanvas(id);
        console.log('🗑️ Deleted canvas from Supabase:', id);
      }

      // If we deleted the current canvas, switch to another one
      if (currentCanvasId === id) {
        if (updatedCanvases.length > 0) {
          const newCanvasId = updatedCanvases[0].metadata.id;
          setCurrentCanvasId(newCanvasId);
          // Load the new canvas state
          await loadCanvasState(newCanvasId);
        } else {
          setCurrentCanvasId(null);
        }
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete canvas';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [canvases, currentCanvasId, loadCanvasState, saveCanvasList, userId, enableSupabase]);

  // Switch to a different canvas
  const switchCanvas = useCallback(async (id: string): Promise<boolean> => {
    if (currentCanvasId === id) return true;
    
    setCurrentCanvasId(id);
    const success = await loadCanvasState(id);
    return success;
  }, [currentCanvasId, loadCanvasState]);

  // Initialize on mount
  useEffect(() => {
    if (isInitialized) return;
    
    if (userId && enableSupabase) {
      // Load user data from Supabase
      loadUserData().then(() => {
        setIsInitialized(true);
      }).catch(() => {
        // Fallback to localStorage if Supabase fails
        loadCanvasList();
        setIsInitialized(true);
      });
    } else {
      // Load from localStorage
      loadCanvasList();
      setIsInitialized(true);
    }
  }, [userId, enableSupabase, isInitialized, loadUserData, loadCanvasList]);

  // Auto-create default canvas if needed
  useEffect(() => {
    if (!isInitialized || !autoCreateDefault || defaultCanvasCreatedRef.current) return;
    
    if (canvases.length === 0) {
      defaultCanvasCreatedRef.current = true;
      createCanvas(defaultCanvasTitle).catch(console.error);
    }
  }, [isInitialized, autoCreateDefault, canvases.length, createCanvas, defaultCanvasTitle]);

  // Get current canvas
  const currentCanvas = canvases.find(canvas => canvas.metadata.id === currentCanvasId) || null;

  return {
    canvases,
    folders,
    currentCanvas,
    isLoading,
    error,
    createCanvas,
    updateCanvas,
    deleteCanvas,
    switchCanvas,
    clearError,
    preloadCanvas,
    unloadCanvas,
    createFolder,
    updateFolder,
    deleteFolder,
    moveCanvasToFolder,
    loadUserData,
  };
} 