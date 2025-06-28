import { useState, useCallback, useEffect, useRef } from 'react';
import { type Editor, loadSnapshot, getSnapshot } from 'tldraw';
import { CanvasService } from '../services/canvasService';
import type { Folder } from '../lib/supabase';
import React from 'react';

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
  const { userId, enableSupabase = false } = options;
  
  // Detect environment
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isProduction = !isLocalhost;
  
  // Temporary: Use test user ID if no real user ID is available
  const effectiveUserId = userId || '550e8400-e29b-41d4-a716-446655440000';
  


  const {
    defaultCanvasTitle = DEFAULT_CANVAS_TITLE,
    autoCreateDefault = true,
    version = '1.0.0',
    maxLoadedCanvases = DEFAULT_MAX_LOADED_CANVASES,
  } = options;

  const [canvases, setCanvases] = useState<CanvasListItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]); // NEW: Folders state
  const [currentCanvasId, setCurrentCanvasId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Track if we've ever loaded canvases (to prevent auto-create after user deletion)
  const hasLoadedCanvasesRef = useRef(false);
  const defaultCanvasCreatedRef = useRef(false);
  const isLoadingRef = useRef(false);
  const loadedCanvasesRef = useRef<Set<string>>(new Set());
  const canvasAccessTimesRef = useRef<Map<string, number>>(new Map());
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // NEW: Load user data from Supabase
  const loadUserData = useCallback(async () => {
    if (!effectiveUserId || !enableSupabase) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Load folders
      const userFolders = await CanvasService.getUserFolders(effectiveUserId);
      setFolders(userFolders);
      
      // Load canvases
      const userCanvases = await CanvasService.getUserCanvases(effectiveUserId);
      
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
      
      // Always set canvases and mark as loaded, even if empty
      setCanvases(transformedCanvases);
      hasLoadedCanvasesRef.current = true; // Mark that we've attempted to load canvases from Supabase
      
      if (transformedCanvases.length > 0) {
        // Set initial current canvas (prefer top-level canvas)
        const topLevelCanvas = transformedCanvases.find(c => !c.metadata.folderId);
        const initialCanvasId = topLevelCanvas 
          ? topLevelCanvas.metadata.id 
          : transformedCanvases[0].metadata.id;
        

        setCurrentCanvasId(initialCanvasId);
      }
      

    } catch (err) {
      console.error('Error loading user data from Supabase:', err);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId, enableSupabase, version, currentCanvasId]);

  // NEW: Folder operations
  const createFolder = useCallback(async (name: string, description?: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isProduction) {
        // Production: Supabase only
        if (!effectiveUserId || !enableSupabase) {
          throw new Error('Database connection required for folder operations');
        }
        
        const newFolder = await CanvasService.createFolder({
          user_id: effectiveUserId,
          name,
          description,
        });
        
        setFolders(prev => [...prev, newFolder]);
        
        return newFolder.id;
      } else {
        // Localhost: Try Supabase first, fallback to localStorage
        if (effectiveUserId && enableSupabase) {
          try {
            const newFolder = await CanvasService.createFolder({
              user_id: effectiveUserId,
              name,
              description,
            });
            
            setFolders(prev => [...prev, newFolder]);

            return newFolder.id;
          } catch (supabaseError) {
    
            // Fall through to localStorage logic below
          }
        }
        
        // localStorage fallback
        const id = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newFolder = {
          id,
          name,
          description: description || null,
          user_id: effectiveUserId || 'local',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          color: '',
          parent_folder_id: null,
        };
        
        setFolders(prev => [...prev, newFolder]);
        
        // Save folders to localStorage
        const updatedFolders = [...folders, newFolder];
        localStorage.setItem('yoga_flow_folders', JSON.stringify(updatedFolders));
        
        
        return newFolder.id;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create folder';
      setError(errorMessage);
      
      if (isProduction) {
        // Show helpful error message for production
        if (errorMessage.includes('does not exist') || errorMessage.includes('schema cache')) {
          setError('Database not properly configured. Please contact support.');
        }
      }
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId, enableSupabase, folders, isProduction]);

  const updateFolder = useCallback(async (
    id: string, 
    updates: { name?: string; description?: string; color?: string }
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isProduction) {
        // Production: Supabase only
        if (!effectiveUserId || !enableSupabase) {
          throw new Error('Database connection required for folder operations');
        }
        
        const updatedFolder = await CanvasService.updateFolder(id, updates);
        setFolders(prev => prev.map(folder => 
          folder.id === id ? updatedFolder : folder
        ));
        
        return true;
      } else {
        // Localhost: Try Supabase first, fallback to localStorage
        if (effectiveUserId && enableSupabase) {
          try {
            const updatedFolder = await CanvasService.updateFolder(id, updates);
            setFolders(prev => prev.map(folder => 
              folder.id === id ? updatedFolder : folder
            ));

            return true;
          } catch (supabaseError) {
    
          }
        }
        
        // localStorage fallback
        setFolders(prev => prev.map(folder => 
          folder.id === id ? { ...folder, ...updates, updated_at: new Date().toISOString() } : folder
        ));
        
        // Update localStorage
        const updatedFolders = folders.map(folder => 
          folder.id === id ? { ...folder, ...updates, updated_at: new Date().toISOString() } : folder
        );
        localStorage.setItem('yoga_flow_folders', JSON.stringify(updatedFolders));
        
        
        return true;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update folder';
      setError(errorMessage);
      
      if (isProduction) {
        // Show helpful error message for production
        if (errorMessage.includes('does not exist') || errorMessage.includes('schema cache')) {
          setError('Database not properly configured. Please contact support.');
        }
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId, enableSupabase, folders, isProduction]);

  const deleteFolder = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isProduction) {
        // Production: Supabase only
        if (!effectiveUserId || !enableSupabase) {
          throw new Error('Database connection required for folder operations');
        }
        
        await CanvasService.deleteFolder(id);
        
        
        // Only update state after successful Supabase operation
        setFolders(prev => prev.filter(folder => folder.id !== id));
        setCanvases(prev => prev.map(canvas => 
          canvas.metadata.folderId === id 
            ? { ...canvas, metadata: { ...canvas.metadata, folderId: null } }
            : canvas
        ));
      } else {
        // Localhost: Try Supabase first, fallback to localStorage
        if (effectiveUserId && enableSupabase) {
          try {
            await CanvasService.deleteFolder(id);

          } catch (supabaseError) {
    
          }
        }
        
        // Update state and localStorage
        setFolders(prev => prev.filter(folder => folder.id !== id));
        setCanvases(prev => prev.map(canvas => 
          canvas.metadata.folderId === id 
            ? { ...canvas, metadata: { ...canvas.metadata, folderId: null } }
            : canvas
        ));
        
        const updatedFolders = folders.filter(folder => folder.id !== id);
        localStorage.setItem('yoga_flow_folders', JSON.stringify(updatedFolders));
      }
      
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete folder';
      setError(errorMessage);
      
      if (isProduction) {
        // Show helpful error message for production
        if (errorMessage.includes('does not exist') || errorMessage.includes('schema cache')) {
          setError('Database not properly configured. Please contact support.');
        }
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId, enableSupabase, folders, isProduction]);

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
    } catch (err) {
      console.error('Error saving canvas list:', err);
      setError('Failed to save canvas list');
    }
  }, []);

  // Load canvas list from localStorage
  const loadCanvasList = useCallback(() => {
    try {
      // Load canvases
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
        hasLoadedCanvasesRef.current = true; // Mark that we've attempted to load canvases from localStorage
        
        // Set current canvas to the first one if none selected
        if (validCanvases.length > 0 && !currentCanvasId) {
  
          setCurrentCanvasId(validCanvases[0].metadata.id);
        }
      }
      
      // Set flag even if no saved data exists
      if (!savedList) {
        hasLoadedCanvasesRef.current = true; // Mark that we've attempted to load (no data found)
      }
      
      // Load folders from localStorage
      const savedFolders = localStorage.getItem('yoga_flow_folders');
      if (savedFolders) {
        const parsedFolders = JSON.parse(savedFolders);
        setFolders(parsedFolders);

      }
    } catch (err) {
      console.error('Error loading canvas list:', err);
      setError('Failed to load canvas list');
    }
  }, [currentCanvasId]); // Removed currentCanvasId from dependencies to prevent infinite loop

  // Load canvas state from localStorage or Supabase
  const loadCanvasState = useCallback(async (canvasId: string): Promise<boolean> => {

    if (!editor) {

      return false;
    }

    if (isLoadingRef.current) {

      return false;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${canvasId}`;
      const savedData = localStorage.getItem(storageKey);


      if (savedData) {
        const canvasState = JSON.parse(savedData);

        
        if (canvasState.snapshot) {
          // Load the snapshot into the editor
          loadSnapshot(editor.store, canvasState.snapshot);

          return true;
        } else {
          console.warn(`⚠️ [DEBUG] Canvas state for ${canvasId} has no snapshot. Creating blank canvas.`);
          // Clear all shapes to create a truly blank canvas
          const shapeIds = editor.getCurrentPageShapeIds();
          if (shapeIds.size > 0) {
            editor.deleteShapes(Array.from(shapeIds));
          }
          return true;
        }
      } else {
        // No saved state found, create a blank canvas

        // Clear all shapes to create a truly blank canvas
        const shapeIds = editor.getCurrentPageShapeIds();
        if (shapeIds.size > 0) {
          editor.deleteShapes(Array.from(shapeIds));
        }
        return true;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load canvas state';
      setError(errorMessage);
      console.error(`❌ [DEBUG] Error loading canvas state for ${canvasId}:`, err);
      return false;
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [editor]);

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
    

  }, [currentCanvasId]); // Removed currentCanvasId from dependencies

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
      const now = new Date();
      
      let id: string;
      let newCanvas: CanvasListItem;

      // Try Supabase first, fall back to localStorage
      if (effectiveUserId && enableSupabase) {
        try {
          // Create canvas in Supabase
          const blankState = createBlankCanvasState();
          const supabaseCanvas = await CanvasService.createCanvas({
            user_id: effectiveUserId,
            folder_id: folderId,
            title: title || defaultCanvasTitle,
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
          
          
        } catch (supabaseError) {
  
          // Fall back to localStorage
          id = `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          newCanvas = {
            metadata: {
              id,
              title: title || defaultCanvasTitle,
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
          
  
        }
      } else {
        // Use localStorage directly
        id = `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        newCanvas = {
          metadata: {
            id,
            title: title || defaultCanvasTitle,
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
        
        
      }

      // Use functional update to avoid dependency on canvases
      setCanvases(prevCanvases => {
        const updatedCanvases = [...prevCanvases, newCanvas];
        // Save to localStorage
        saveCanvasList(updatedCanvases);
        return updatedCanvases;
      });
      
      // Switch to the new canvas and clear it
      setCurrentCanvasId(id);
      
      // Ensure the new canvas is blank by clearing any existing content
      if (editor) {
        const shapeIds = editor.getCurrentPageShapeIds();
        if (shapeIds.size > 0) {
          editor.deleteShapes(Array.from(shapeIds));
        }
      }
      
      return id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create canvas';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [defaultCanvasTitle, version, generateThumbnail, saveCanvasList, effectiveUserId, enableSupabase, createBlankCanvasState]);

  // Update canvas metadata
  const updateCanvas = useCallback(async (
    id: string, 
    updates: Partial<CanvasMetadata>
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Use functional update to avoid dependency on canvases
      setCanvases(prevCanvases => {
        const updatedCanvases = prevCanvases.map(canvas => {
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
        
        // Save to localStorage
        saveCanvasList(updatedCanvases);
        return updatedCanvases;
      });
      
      // Update in Supabase if available
      if (effectiveUserId && enableSupabase) {
        const supabaseUpdates: any = {};
        if (updates.title !== undefined) supabaseUpdates.title = updates.title;
        if (updates.description !== undefined) supabaseUpdates.description = updates.description;
        if (updates.folderId !== undefined) supabaseUpdates.folder_id = updates.folderId;
        
        if (Object.keys(supabaseUpdates).length > 0) {
          await CanvasService.updateCanvas(id, supabaseUpdates);
          
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
  }, [saveCanvasList, effectiveUserId, enableSupabase]);

  // Delete a canvas
  const deleteCanvas = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Use functional update to avoid dependency on canvases
      setCanvases(prevCanvases => {
        const updatedCanvases = prevCanvases.filter(canvas => canvas.metadata.id !== id);
        // Save to localStorage
        saveCanvasList(updatedCanvases);
        return updatedCanvases;
      });

      // Delete from Supabase if available
      if (effectiveUserId && enableSupabase) {
        await CanvasService.deleteCanvas(id);
        
      }

      // If we deleted the current canvas, switch to another one
      if (currentCanvasId === id) {
        setCanvases(prevCanvases => {
          if (prevCanvases.length > 0) {
            const newCanvasId = prevCanvases[0].metadata.id;
            setCurrentCanvasId(newCanvasId);
            // Load the new canvas state
            loadCanvasState(newCanvasId);
          } else {
            setCurrentCanvasId(null);
          }
          return prevCanvases;
        });
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete canvas';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentCanvasId, loadCanvasState, saveCanvasList, effectiveUserId, enableSupabase]);

  // Switch to a different canvas - SIMPLIFIED
  const switchCanvas = useCallback(async (id: string): Promise<boolean> => {
    if (currentCanvasId === id) return true;
    
    // Save current canvas state before switching (if editor exists and current canvas is set)
    if (editor && currentCanvasId) {
      try {
        const currentSnapshot = getSnapshot(editor.store);
        const storageKey = `${STORAGE_KEY_PREFIX}${currentCanvasId}`;
        const canvasState = {
          snapshot: currentSnapshot,
          timestamp: Date.now(),
          version: '1.0.0',
        };
        localStorage.setItem(storageKey, JSON.stringify(canvasState));

      } catch (err) {
        console.warn('Failed to save current canvas before switch:', err);
      }
    }
    
    setCurrentCanvasId(id);
    const success = await loadCanvasState(id);
    return success;
  }, [currentCanvasId, loadCanvasState, editor]);

  // Initialize on mount
  useEffect(() => {
    if (isInitialized) {
      return;
    }
    
    if (isProduction) {
      // Production: Supabase only
      if (effectiveUserId && enableSupabase) {
        loadUserData().then(() => {
          setIsInitialized(true);
        }).catch((error) => {
          console.error('❌ [PROD] Supabase connection failed:', error);
          setError('Database connection failed. Please try again later.');
          setIsInitialized(true);
        });
      } else {
        setError('Authentication required');
        setIsInitialized(true);
      }
    } else {
      // Localhost: Try Supabase first, fallback to localStorage
      if (effectiveUserId && enableSupabase) {
        loadUserData().then(() => {
          setIsInitialized(true);
        }).catch((error) => {
          // Fallback to localStorage if Supabase fails

          loadCanvasList();
          setIsInitialized(true);
        });
      } else {
        // Load from localStorage
        loadCanvasList();
        setIsInitialized(true);
      }
    }
  }, [effectiveUserId, enableSupabase, isInitialized, loadUserData, loadCanvasList, isProduction]);

  // ENHANCED: Auto-create default canvas if needed (works for both Supabase and localStorage)
  useEffect(() => {
    if (!isInitialized || !autoCreateDefault || defaultCanvasCreatedRef.current || isLoading) {
      return;
    }
    
    // More robust check: Only auto-create if workspace is truly empty
    // Check both current state AND persisted storage to prevent auto-creation on refresh
    const checkIfWorkspaceEmpty = async () => {
      // First check if we have canvases in current state
      if (canvases.length > 0) {
        return false;
      }
      
      // Check localStorage for existing canvases
      const savedCanvases = localStorage.getItem(CANVAS_LIST_KEY);
      if (savedCanvases) {
        try {
          const parsedCanvases = JSON.parse(savedCanvases);
          if (Array.isArray(parsedCanvases) && parsedCanvases.length > 0) {
  
            return false;
          }
        } catch (err) {
          console.warn('Failed to parse saved canvases:', err);
        }
      }
      
      // For Supabase users, check if we've attempted to load from Supabase
      if (effectiveUserId && enableSupabase) {
        // If we have a user but no canvases loaded yet, we should wait for Supabase load to complete
        // The hasLoadedCanvasesRef.current tracks if we've ever successfully loaded from Supabase
        if (!hasLoadedCanvasesRef.current) {

          return false;
        }
      }
      

      return true;
    };
    
    checkIfWorkspaceEmpty().then((shouldCreate) => {
      if (shouldCreate) {
        defaultCanvasCreatedRef.current = true;
        // Use setTimeout to avoid calling createCanvas during render
        setTimeout(() => {
          createCanvas(defaultCanvasTitle).catch((error) => {
            console.error('Failed to create default canvas:', error);
            // Reset the flag if creation failed so it can be retried
            defaultCanvasCreatedRef.current = false;
          });
        }, 100);
      }
    });
  }, [isInitialized, autoCreateDefault, canvases.length, defaultCanvasTitle, createCanvas, isLoading, effectiveUserId, enableSupabase]);

  // ENHANCED: Fallback check - if Supabase succeeded but we have no data, check localStorage (localhost only)
  useEffect(() => {
    if (!isInitialized || !effectiveUserId || !enableSupabase || isProduction) {
      return;
    }
    
    // If Supabase loaded but we have no canvases/folders, check localStorage as fallback (localhost only)
    if (canvases.length === 0 && folders.length === 0) {

      const savedCanvases = localStorage.getItem(CANVAS_LIST_KEY);
      const savedFolders = localStorage.getItem('yoga_flow_folders');
      
      if (savedCanvases || savedFolders) {

        loadCanvasList();
      }
    }
  }, [isInitialized, canvases.length, folders.length, effectiveUserId, enableSupabase, loadCanvasList, isProduction]);

  // NEW: Load canvas content when currentCanvasId is set
  useEffect(() => {
    if (currentCanvasId && editor && isInitialized) {

      loadCanvasState(currentCanvasId);
    }
  }, [currentCanvasId, editor, isInitialized, loadCanvasState]);

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