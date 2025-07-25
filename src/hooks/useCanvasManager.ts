import { useState, useCallback, useEffect, useRef } from 'react';
import { type Editor, loadSnapshot, getSnapshot } from 'tldraw';
import { CanvasService } from '../services/canvasService';
// ROOT_FOLDER_ID no longer needed - using null for top-level canvases
import type { Folder } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { arrayMove } from '@dnd-kit/sortable';

export interface CanvasMetadata {
  id: string;
  title: string;
  lastModified: Date;
  createdAt: Date;
  thumbnail?: string; // Base64 encoded thumbnail
  version: string;
  folderId?: string | null; // NEW: Folder support
  description?: string; // NEW: Description support
  sort_order?: number; // NEW: Sort order for drag and drop
  shape_count?: number; // NEW: Number of shapes on the canvas
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
  createCanvas: (title?: string, folderId?: string | null, insertAtBeginning?: boolean) => Promise<string>;
  duplicateCanvas: (id: string) => Promise<string>;
  updateCanvas: (id: string, updates: Partial<CanvasMetadata>) => Promise<boolean>;
  deleteCanvas: (id: string) => Promise<boolean>;
  switchCanvas: (id: string) => Promise<boolean>;
  saveCurrentCanvas: () => Promise<boolean>; // NEW: Manual save function
  clearError: () => void;
  preloadCanvas: (id: string) => Promise<void>; // Preload canvas data
  unloadCanvas: (id: string) => void; // Unload canvas from memory
  // NEW: Folder operations
  createFolder: (name: string, description?: string, insertAtBeginning?: boolean) => Promise<string>;
  updateFolder: (id: string, updates: { name?: string; description?: string; color?: string }) => Promise<boolean>;
  deleteFolder: (id: string) => Promise<boolean>;
  moveCanvasToFolder: (canvasId: string, folderId: string | null) => Promise<boolean>;
  loadUserData: (options?: { afterDeletion?: { deletedCanvasFolderId: string | null; deletedCanvasId: string } }) => Promise<void>; // Load user's canvases and folders from Supabase
  reorderCanvas: (sourceId: string, targetId: string) => Promise<void>;
  reorderFolder: (sourceId: string, targetId: string) => Promise<void>;
  isLoadingRef: React.MutableRefObject<boolean>; // NEW: Loading ref for auto-save coordination
}

export interface UseCanvasManagerOptions {
  defaultCanvasTitle?: string;
  autoCreateDefault?: boolean;
  version?: string;
  maxLoadedCanvases?: number; // Limit number of canvases kept in memory
  userId?: string; // NEW: User ID for Supabase integration
  enableSupabase?: boolean; // NEW: Toggle Supabase integration
  isDeletionInProgressRef?: React.MutableRefObject<boolean>; // NEW: Deletion flag ref
}

const CANVAS_LIST_KEY = 'yoga_flow_canvas_list';
const STORAGE_KEY_PREFIX = 'yoga_flow_canvas_';
const DEFAULT_CANVAS_TITLE = 'Untitled Flow';
const DEFAULT_MAX_LOADED_CANVASES = 3; // Keep only 3 canvases in memory

export function useCanvasManager(
  editor: Editor | null,
  options: UseCanvasManagerOptions = {}
): UseCanvasManagerReturn {
  const { userId, enableSupabase = false, isDeletionInProgressRef: externalDeletionRef } = options;
  
  // Detect environment
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isProduction = !isLocalhost;
  
  // Use the actual authenticated user ID - no fallback to hardcoded test user
  const effectiveUserId = userId;
  


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

  const canvasSelectedDuringDeletionRef = useRef<string | null>(null);
  const isDeletionInProgressRef = useRef(false);
  const isCreatingCanvasRef = useRef(false); // Prevent double creation
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // NEW: Load user data from Supabase
  const loadUserData = useCallback(async (options?: { 
    afterDeletion?: { deletedCanvasFolderId: string | null; deletedCanvasId: string } 
  }) => {
    if (!effectiveUserId || !enableSupabase) return;
    
    if (isLoadingRef.current) {
      return;
    }
    

    
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      // Load folders (excluding root folder)
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
          // Keep the actual folder_id as assigned by the database (including root folder)
          folderId: canvas.folder_id,
          description: canvas.description || undefined,
          sort_order: canvas.sort_order || 0,
          shape_count: canvas.shape_count || 0,
        },
        hasUnsavedChanges: false,
        saveStatus: 'saved',
        isLoaded: false,
      }));
      
      // Always set canvases and mark as loaded, even if empty
      setCanvases(transformedCanvases);
      hasLoadedCanvasesRef.current = true; // Mark that we've attempted to load canvases from Supabase
      
      // Handle post-deletion canvas selection
      if (options?.afterDeletion && transformedCanvases.length > 0) {
        const { deletedCanvasFolderId, deletedCanvasId } = options.afterDeletion;
        
        // Clear current canvas ID since the deleted one is no longer valid
        if (currentCanvasId === deletedCanvasId) {
          setCurrentCanvasId(null);
        }
        
        // Find the next canvas to select
        let next: CanvasListItem | undefined;

        // Try to find the next canvas in the same folder
        if (deletedCanvasFolderId) {
          next = transformedCanvases
            .filter(c => c.metadata.folderId === deletedCanvasFolderId)
            .sort((a, b) => (a.metadata.sort_order ?? 0) - (b.metadata.sort_order ?? 0))[0];
        }

        // If none in same folder, try root folder (null folderId)
        if (!next) {
          next = transformedCanvases
            .filter(c => c.metadata.folderId === null)
            .sort((a, b) => (a.metadata.sort_order ?? 0) - (b.metadata.sort_order ?? 0))[0];
        }

        // If still none, try any other folder
        if (!next) {
          next = transformedCanvases
            .sort((a, b) => (a.metadata.sort_order ?? 0) - (b.metadata.sort_order ?? 0))[0];
        }

        // Set the selected canvas ID but don't load it here - let deleteCanvas handle the loading
        if (next) {
          console.log('🔄 Selecting next canvas after deletion:', next.metadata.id);
          setCurrentCanvasId(next.metadata.id);
          canvasSelectedDuringDeletionRef.current = next.metadata.id;
        }
      } else if (transformedCanvases.length > 0) {
        // Normal load - only set initial current canvas if we don't already have one
        // This prevents overriding the current canvas during drag operations
        if (!currentCanvasId) {
          // Set initial current canvas (prefer top-level canvas)
          const topLevelCanvas = transformedCanvases.find(c => !c.metadata.folderId);
          const initialCanvasId = topLevelCanvas 
            ? topLevelCanvas.metadata.id 
            : transformedCanvases[0].metadata.id;
          
          setCurrentCanvasId(initialCanvasId);
        }
      }
      

    } catch (err) {
      console.error('Error loading user data from Supabase:', err);
      setError('Failed to load user data');
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [effectiveUserId, enableSupabase, version, currentCanvasId]);

  // NEW: Folder operations
  const createFolder = useCallback(async (name: string, description?: string, insertAtBeginning: boolean = false): Promise<string> => {
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
        }, insertAtBeginning);
        
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
            }, insertAtBeginning);
            
            setFolders(prev => [...prev, newFolder]);

            return newFolder.id;
          } catch { /* intentionally empty */ }
        }
        
        // localStorage fallback with UUID format
        const id = crypto.randomUUID();
        const newFolder = {
          id,
          name,
          description: description || null,
          user_id: effectiveUserId || 'local',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          color: '',
          parent_folder_id: null,
          sort_order: insertAtBeginning ? 0 : 999, // 0 for beginning, high number for end
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
          } catch { /* intentionally empty */ }
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

          } catch { /* intentionally empty */ }
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

  const moveCanvasToFolder = useCallback(async (canvasId: string, targetFolderId: string | null): Promise<boolean> => {
    if (!effectiveUserId || !enableSupabase) return false;
    
    try {
      // Optimistically update the UI immediately
      setCanvases(prev => {
        const movedCanvas = prev.find(c => c.metadata.id === canvasId);
        if (!movedCanvas) return prev;

        const sourceFolderId = movedCanvas.metadata.folderId;
        
        // Don't do anything if already in target folder
        if (sourceFolderId === targetFolderId) return prev;

        return prev.map(canvas => {
          if (canvas.metadata.id === canvasId) {
            // Move the canvas to the target folder at position 1
            return {
              ...canvas,
              metadata: {
                ...canvas.metadata,
                folderId: targetFolderId,
                sort_order: 1, // Always first position in new folder
              }
            };
          } else if (canvas.metadata.folderId === sourceFolderId) {
            // Reorder remaining canvases in source folder to be sequential
            const remainingCanvases = prev
              .filter(c => c.metadata.folderId === sourceFolderId && c.metadata.id !== canvasId)
              .sort((a, b) => (a.metadata.sort_order || 0) - (b.metadata.sort_order || 0));
            
            const newIndex = remainingCanvases.findIndex(c => c.metadata.id === canvas.metadata.id);
            if (newIndex !== -1) {
              return {
                ...canvas,
                metadata: {
                  ...canvas.metadata,
                  sort_order: newIndex + 1, // Sequential ordering starting from 1
                }
              };
            }
          } else if (canvas.metadata.folderId === targetFolderId) {
            // Shift up existing canvases in target folder by 1
            return {
              ...canvas,
              metadata: {
                ...canvas.metadata,
                sort_order: (canvas.metadata.sort_order || 0) + 1,
              }
            };
          }
          
          return canvas;
        });
      });
      
      // Perform the actual move
      await CanvasService.moveCanvas(canvasId, targetFolderId);
      
      // No need to reload data since optimistic update already handled UI state
      // Only reload on error to revert optimistic changes
      
      return true;
    } catch (err) {
      console.error('Error moving canvas to folder:', err);
      // Revert optimistic update on error
      await loadUserData();
      return false;
    }
  }, [effectiveUserId, enableSupabase, loadUserData]);

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
    if (!editor) {
      console.warn('No editor available for creating blank canvas state');
      return null;
    }
    
    try {
      // Clear the editor and get a clean snapshot
      const currentShapeIds = editor.getCurrentPageShapeIds();
      if (currentShapeIds.size > 0) {
        editor.deleteShapes(Array.from(currentShapeIds));
      }
      
      // Get the clean snapshot
      const blankSnapshot = getSnapshot(editor.store);
      

      
      const blankState = {
        snapshot: blankSnapshot,
        timestamp: Date.now(),
        version,
      };
      
      return blankState;
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
          .filter((item: CanvasListItem) => item.metadata && item.metadata.id)
          .map((item: CanvasListItem) => ({
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

  // Load canvas state from Supabase or localStorage
  const loadCanvasState = useCallback(async (canvasId: string, retryCount = 0): Promise<boolean> => {
    if (!canvasId || !editor) {
      console.log('❌ Cannot load canvas state: missing canvasId or editor');
      return false;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      let canvasState = null;
      // Try Supabase first if available
      if (effectiveUserId && enableSupabase) {
        try {
          const canvas = await CanvasService.getCanvasWithFolder(canvasId);
          if (canvas && canvas.data) {
            if (typeof canvas.data === 'string') {
              try {
                canvasState = JSON.parse(canvas.data);
              } catch { /* intentionally empty */ }
            } else if (typeof canvas.data === 'object') {
              canvasState = canvas.data;
            }
          } else if (canvas && typeof canvas === 'object' && 'code' in canvas && canvas.code === 'PGRST116') {
            // Robust retry logic for 406/0 rows
            if (!canvasState && retryCount < 5) {
              await new Promise(res => setTimeout(res, 500));
              return loadCanvasState(canvasId, retryCount + 1);
            }
          }
        } catch { /* intentionally empty */ }
      }
      // If all retries fail, load blank state
      if (!canvasState && retryCount >= 5) {
        // No-op, will load blank state below
      }
      // Fallback to localStorage if Supabase failed or not available
      if (!canvasState) {
        const storageKey = `${STORAGE_KEY_PREFIX}${canvasId}`;
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          try {
            canvasState = JSON.parse(savedData);
          } catch { /* intentionally empty */ }
        }
      }
      if (canvasState && canvasState.snapshot) {
        loadSnapshot(editor.store, canvasState.snapshot);
        return true;
      } else {
        const blankState = createBlankCanvasState();
        if (blankState && blankState.snapshot) {
          loadSnapshot(editor.store, blankState.snapshot);
        } else {
          const shapeIds = editor.getCurrentPageShapeIds();
          if (shapeIds.size > 0) {
            editor.deleteShapes(Array.from(shapeIds));
          }
        }
        return true;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load canvas state';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [editor, effectiveUserId, enableSupabase, createBlankCanvasState, currentCanvasId]);

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
  const createCanvas = useCallback(async (title?: string, folderId?: string | null, insertAtBeginning: boolean = false): Promise<string> => {
    console.log('[createCanvas] called with', { title, folderId, insertAtBeginning, effectiveUserId, enableSupabase });
    setIsLoading(true);
    setError(null);

    try {
      const now = new Date();
      
      let id: string;
      let newCanvas: CanvasListItem;

      if (isProduction) {
        // Production: Supabase only - no localStorage fallback for data consistency
        if (!effectiveUserId || !enableSupabase) {
          console.warn('[createCanvas] Early return: missing effectiveUserId or enableSupabase');
          throw new Error('Database connection required for canvas operations');
        }
        
        // Retry mechanism for canvas creation (in case user profile is not immediately available)
        let supabaseCanvas;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            const blankState = createBlankCanvasState();
            supabaseCanvas = await CanvasService.createCanvas({
              user_id: effectiveUserId,
              folder_id: folderId, // Pass folderId as is (null for top-level)
              title: title || defaultCanvasTitle,
              description: '',
              data: blankState || {},
              thumbnail: await generateThumbnail() || null,
              is_public: false,
              shape_count: 0, // New canvases start with 0 shapes
            }, insertAtBeginning);
            break; // Success, exit retry loop
          } catch (error: unknown) {
            retryCount++;
            console.log(`🔄 Canvas creation attempt ${retryCount}/${maxRetries} failed:`, error);
            
            // If it's a foreign key constraint error and we haven't exhausted retries, wait and retry
            if ((error as { code?: string }).code === '23503' && retryCount < maxRetries) {
              console.log('⏳ User profile might not be ready, waiting before retry...');
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
              continue;
            }
            
            // If we've exhausted retries or it's a different error, throw
            throw error;
          }
        }
        
        if (!supabaseCanvas) {
          throw new Error('Failed to create canvas after multiple attempts');
        }
        
        id = supabaseCanvas.id;
        newCanvas = {
          metadata: {
            id: supabaseCanvas.id,
            title: supabaseCanvas.title,
            lastModified: new Date(supabaseCanvas.updated_at),
            createdAt: new Date(supabaseCanvas.created_at),
            thumbnail: supabaseCanvas.thumbnail || undefined,
            version,
            // Keep the actual folder_id as assigned by the database (including root folder)
            folderId: supabaseCanvas.folder_id,
            description: supabaseCanvas.description || undefined,
            sort_order: supabaseCanvas.sort_order || 0,
            shape_count: supabaseCanvas.shape_count || 0,
          },
          hasUnsavedChanges: false,
          saveStatus: 'saved',
          isLoaded: false,
        };
      } else {
        // Development: Try Supabase first, fall back to localStorage
        if (effectiveUserId && enableSupabase) {
          try {
            // Create canvas in Supabase
            const blankState = createBlankCanvasState();
            const supabaseCanvas = await CanvasService.createCanvas({
              user_id: effectiveUserId,
              folder_id: folderId, // Pass folderId as is (null for top-level)
              title: title || defaultCanvasTitle,
              description: '',
              data: blankState || {},
              thumbnail: await generateThumbnail() || null,
              is_public: false,
              shape_count: 0, // New canvases start with 0 shapes
            }, insertAtBeginning);
            
            id = supabaseCanvas.id;
            newCanvas = {
              metadata: {
                id: supabaseCanvas.id,
                title: supabaseCanvas.title,
                lastModified: new Date(supabaseCanvas.updated_at),
                createdAt: new Date(supabaseCanvas.created_at),
                thumbnail: supabaseCanvas.thumbnail || undefined,
                version,
                // Keep the actual folder_id as assigned by the database (including root folder)
                folderId: supabaseCanvas.folder_id,
                description: supabaseCanvas.description || undefined,
                sort_order: supabaseCanvas.sort_order || 0,
                shape_count: supabaseCanvas.shape_count || 0,
              },
              hasUnsavedChanges: false,
              saveStatus: 'saved',
              isLoaded: false,
            };
          } catch (supabaseError: unknown) {
            console.error('Failed to create canvas in Supabase:', supabaseError);
            // Fall back to localStorage
            id = crypto.randomUUID();
            newCanvas = {
              metadata: {
                id,
                title: title || defaultCanvasTitle,
                lastModified: now,
                createdAt: now,
                version,
                folderId: folderId || null,
                sort_order: 0,
                shape_count: 0,
              },
              hasUnsavedChanges: false,
              saveStatus: 'saved',
              isLoaded: false,
            };
            
            // Save to localStorage
            const blankState = createBlankCanvasState();
            const storageKey = `${STORAGE_KEY_PREFIX}${id}`;
            localStorage.setItem(storageKey, JSON.stringify(blankState));
          }
        } else {
          // LocalStorage only
          id = crypto.randomUUID();
          newCanvas = {
            metadata: {
              id,
              title: title || defaultCanvasTitle,
              lastModified: now,
              createdAt: now,
              version,
              folderId: folderId || null,
              sort_order: 0,
              shape_count: 0,
            },
            hasUnsavedChanges: false,
            saveStatus: 'saved',
            isLoaded: false,
          };
          
          // Save to localStorage
          const blankState = createBlankCanvasState();
          const storageKey = `${STORAGE_KEY_PREFIX}${id}`;
          localStorage.setItem(storageKey, JSON.stringify(blankState));
        }
      }

      // Add the new canvas to the list
      setCanvases(prev => {
        const newList = [...prev, newCanvas];
        
        // Sort by creation date (newest first) if not inserting at beginning
        if (!insertAtBeginning) {
          newList.sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime());
        } else {
          // Insert at beginning
          newList.sort((a, b) => {
            if (a.metadata.id === id) return -1;
            if (b.metadata.id === id) return 1;
            return b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime();
          });
        }
        
        return newList;
      });

      // Set as current canvas
      setCurrentCanvasId(id);
      
      // Load the new canvas state
      await loadCanvasState(id);

      return id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create canvas';
      setError(errorMessage);
      console.error('Error creating canvas:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId, enableSupabase, isProduction, createBlankCanvasState, generateThumbnail, loadCanvasState, version, defaultCanvasTitle]);

  // Duplicate a canvas
  const duplicateCanvas = useCallback(async (id: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // Find the canvas to duplicate
      const sourceCanvas = canvases.find(c => c.metadata.id === id);
      if (!sourceCanvas) {
        throw new Error('Canvas not found');
      }

      // If this is the current canvas, save it first to ensure we have the latest content
      if (currentCanvasId === id && editor) {
        console.log('💾 Saving current canvas before duplication...');
        const currentSnapshot = getSnapshot(editor.store);
        const canvasState = {
          snapshot: currentSnapshot,
          timestamp: Date.now(),
          version: version,
        };
        
        // Save to both Supabase and localStorage for reliability
        if (effectiveUserId && enableSupabase) {
          try {
            await CanvasService.updateCanvas(id, { data: canvasState });
          } catch (supabaseError: unknown) {
            console.error('Failed to save to Supabase:', supabaseError);
            // Fallback to localStorage
            const storageKey = `${STORAGE_KEY_PREFIX}${id}`;
            localStorage.setItem(storageKey, JSON.stringify(canvasState));
          }
        } else {
          // Fallback to localStorage
          const storageKey = `${STORAGE_KEY_PREFIX}${id}`;
          localStorage.setItem(storageKey, JSON.stringify(canvasState));
        }
      }

      // Create new title with "(Copy)" suffix
      const originalTitle = sourceCanvas.metadata.title;
      const newTitle = originalTitle.endsWith(' (Copy)') 
        ? `${originalTitle} (2)`
        : `${originalTitle} (Copy)`;

      // Load the source canvas state
      const storageKey = `${STORAGE_KEY_PREFIX}${id}`;
      let sourceCanvasState = null;
      
      if (effectiveUserId && enableSupabase) {
        try {
          const canvasData = await CanvasService.getCanvasWithFolder(id);
          sourceCanvasState = canvasData.data;
        } catch { /* intentionally empty */ }
      } else {
        // LocalStorage only
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          sourceCanvasState = JSON.parse(savedData);
        }
      }

      // Create the new canvas with the duplicated content
      const newCanvasId = await createCanvas(newTitle, sourceCanvas.metadata.folderId, false);
      
      // Save the duplicated content to the new canvas
      if (sourceCanvasState) {
        const newStorageKey = `${STORAGE_KEY_PREFIX}${newCanvasId}`;
        
        if (effectiveUserId && enableSupabase) {
          try {
            await CanvasService.updateCanvas(newCanvasId, { data: sourceCanvasState });
          } catch (supabaseError: unknown) {
            console.error('Failed to save duplicated canvas to Supabase:', supabaseError);
            // Fallback to localStorage
            localStorage.setItem(newStorageKey, JSON.stringify(sourceCanvasState));
          }
        } else {
          // LocalStorage only
          localStorage.setItem(newStorageKey, JSON.stringify(sourceCanvasState));
        }
      }

      // Handle sort order: insert the duplicated canvas right after the source canvas
      if (effectiveUserId && enableSupabase) {
        try {
          // Get all canvases in the same folder, sorted by current sort_order
          const sameFolderCanvases = canvases
            .filter(c => c.metadata.folderId === sourceCanvas.metadata.folderId)
            .sort((a, b) => (a.metadata.sort_order || 0) - (b.metadata.sort_order || 0));
          
          // Find the source canvas position
          const sourceIndex = sameFolderCanvases.findIndex(c => c.metadata.id === id);
          if (sourceIndex !== -1) {
            // Create the new order: insert the duplicated canvas after the source
            const canvasIds = sameFolderCanvases.map(canvas => canvas.metadata.id);
            canvasIds.splice(sourceIndex + 1, 0, newCanvasId);
            
            // Use the database function to reorder all canvases in the folder
            const { error: reorderError } = await supabase
              .rpc('reorder_canvases_in_folder', {
                p_user_id: effectiveUserId,
                p_canvas_ids: canvasIds,
                p_folder_id: sourceCanvas.metadata.folderId
              });
            
            if (reorderError) {
              throw reorderError;
            }
            
            console.log('🔄 Reordered canvases for duplicated canvas:', {
              sourceId: id,
              newCanvasId,
              folderId: sourceCanvas.metadata.folderId,
              newOrder: canvasIds
            });
            
            // Reload the canvas list to reflect the new sort order
            await loadUserData();
          }
        } catch { /* intentionally empty */ }
      }

      // Switch to the new canvas
      setCurrentCanvasId(newCanvasId);
      await loadCanvasState(newCanvasId);

      return newCanvasId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate canvas';
      setError(errorMessage);
      console.error('Error duplicating canvas:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [canvases, effectiveUserId, enableSupabase, createCanvas, loadCanvasState, currentCanvasId, editor, version]);

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
        const supabaseUpdates: Record<string, unknown> = {};
        if (updates.title !== undefined) supabaseUpdates.title = updates.title;
        if (updates.description !== undefined) supabaseUpdates.description = updates.description;
        if (updates.folderId !== undefined) supabaseUpdates.folder_id = updates.folderId;
        if (updates.shape_count !== undefined) supabaseUpdates.shape_count = updates.shape_count;
        
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
    // Set deletion and creation flags to prevent auto-create effect from firing
    isDeletionInProgressRef.current = true;
    defaultCanvasCreatedRef.current = true; // Prevent auto-create effect
    isCreatingCanvasRef.current = true; // Prevent double creation
    // Clear the canvas selection ref at the start
    canvasSelectedDuringDeletionRef.current = null;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Find the folderId of the canvas being deleted
      const toDelete = canvases.find(c => c.metadata.id === id);
      const deletedCanvasFolderId = toDelete?.metadata.folderId;

      // 2. Delete from backend if needed
      if (effectiveUserId && enableSupabase) {
        await CanvasService.deleteCanvas(id);
      }

      // 3. Reload canvases from backend to get updated sort_order and handle canvas selection
      await loadUserData({
        afterDeletion: {
          deletedCanvasFolderId: deletedCanvasFolderId || null,
          deletedCanvasId: id
        }
      });

      // 4. Handle canvas selection after data is reloaded
      setTimeout(async () => {
        // Check if a canvas was already selected during loadUserData
        if (canvasSelectedDuringDeletionRef.current && canvasSelectedDuringDeletionRef.current !== id) {
          const selectedCanvasId = canvasSelectedDuringDeletionRef.current;
          await loadCanvasState(selectedCanvasId);
          setCurrentCanvasId(selectedCanvasId);
          canvasSelectedDuringDeletionRef.current = null;
        } else if (!currentCanvasId || currentCanvasId === id) {
          // No canvas selected or the deleted canvas is still selected, select the first available
          const firstCanvas = canvases[0];
          if (firstCanvas) {
            setCurrentCanvasId(firstCanvas.metadata.id);
            await loadCanvasState(firstCanvas.metadata.id);
          }
        } else {
          // Canvas is already selected, just load it
          await loadCanvasState(currentCanvasId);
        }
        // Synchronously reset flags after all async work and state updates
        isCreatingCanvasRef.current = false;
        defaultCanvasCreatedRef.current = false;
        isDeletionInProgressRef.current = false;
        canvasSelectedDuringDeletionRef.current = null;
      }, 50);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete canvas';
      setError(errorMessage);
      // Always reset flags on error
      isCreatingCanvasRef.current = false;
      defaultCanvasCreatedRef.current = false;
      isDeletionInProgressRef.current = false;
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [canvases, currentCanvasId, effectiveUserId, enableSupabase, loadUserData, createCanvas, loadCanvasState, defaultCanvasTitle]);

  // Switch to a different canvas - ENHANCED with Supabase support
  const switchCanvas = useCallback(async (id: string): Promise<boolean> => {
    if (currentCanvasId === id) {
      return true;
    }

    // Save current canvas state before switching (if editor exists and current canvas is set)
    if (editor && currentCanvasId) {
      try {
        const currentSnapshot = getSnapshot(editor.store);
        
        // Calculate shape count from current page
        const shapeCount = editor.getCurrentPageShapeIds().size;
        
        const canvasState = {
          snapshot: currentSnapshot,
          timestamp: Date.now(),
          version: version,
        };
        
        // Save to both Supabase and localStorage for reliability
        if (effectiveUserId && enableSupabase) {
          try {
            await CanvasService.updateCanvas(currentCanvasId, { 
              data: canvasState,
              shape_count: shapeCount
            });
          } catch (supabaseError: unknown) {
            console.error('Failed to save to Supabase:', supabaseError);
            // Fallback to localStorage
            const storageKey = `${STORAGE_KEY_PREFIX}${currentCanvasId}`;
            localStorage.setItem(storageKey, JSON.stringify(canvasState));
          }
        } else {
          // Fallback to localStorage
          const storageKey = `${STORAGE_KEY_PREFIX}${currentCanvasId}`;
          localStorage.setItem(storageKey, JSON.stringify(canvasState));
        }
      } catch (err) {
        console.error('Failed to save current canvas before switch:', err);
        // Continue with switch even if save failed
      }
    }
    
    // Switch the current canvas ID
    setCurrentCanvasId(id);
    
    // Load the new canvas state
    const success = await loadCanvasState(id);
    
    if (!success) {
      console.error('Failed to switch to canvas:', id);
    }
    
    return success;
  }, [currentCanvasId, loadCanvasState, editor, effectiveUserId, enableSupabase, version]);

  // NEW: Manual save function for current canvas
  const saveCurrentCanvas = useCallback(async (): Promise<boolean> => {
    if (!editor || !currentCanvasId) {
      console.log('❌ [CanvasManager] Cannot save: missing editor or currentCanvasId', { 
        editor: !!editor, 
        currentCanvasId,
        effectiveUserId,
        enableSupabase 
      });
      return false;
    }

    try {
      const currentSnapshot = getSnapshot(editor.store);
      
      // Calculate shape count from current page
      const shapeCount = editor.getCurrentPageShapeIds().size;
      
      const canvasState = {
        snapshot: currentSnapshot,
        timestamp: Date.now(),
        version: version,
      };
      
      // Save to both Supabase and localStorage for reliability
      if (effectiveUserId && enableSupabase) {
        try {
          await CanvasService.updateCanvas(currentCanvasId, { 
            data: canvasState,
            shape_count: shapeCount
          });
        } catch (supabaseError: unknown) {
          console.error('❌ [CanvasManager] Failed to save to Supabase:', supabaseError);
          // Fallback to localStorage
          const storageKey = `${STORAGE_KEY_PREFIX}${currentCanvasId}`;
          localStorage.setItem(storageKey, JSON.stringify(canvasState));
        }
      } else {
        // Fallback to localStorage
        const storageKey = `${STORAGE_KEY_PREFIX}${currentCanvasId}`;
        localStorage.setItem(storageKey, JSON.stringify(canvasState));
      }
      
      return true;
    } catch (err) {
      console.error('❌ [CanvasManager] Failed to save current canvas:', err);
      return false;
    }
  }, [editor, currentCanvasId, effectiveUserId, enableSupabase, version]);

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
        }).catch((_error) => {
          console.error('❌ [PROD] Supabase connection failed:', _error);
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
    }
  }, [effectiveUserId, enableSupabase, isInitialized, loadUserData, loadCanvasList, isProduction]);

  // SIMPLIFIED: Auto-create default canvas if needed
  useEffect(() => {
    const deletionInProgress = externalDeletionRef?.current || isDeletionInProgressRef.current;
    
    // Early exit - avoid expensive checks if basic conditions aren't met
    if (!isInitialized || !autoCreateDefault || defaultCanvasCreatedRef.current || deletionInProgress || isCreatingCanvasRef.current) {
      return;
    }
    
    // Skip if still loading
    if (isLoading) {
      return;
    }
    
    console.log('[AutoCreateEffect] Running check - canvases.length:', canvases.length, 'effectiveUserId:', effectiveUserId, 'enableSupabase:', enableSupabase);
    
    // Simple check: Only auto-create if workspace is truly empty
    const checkIfWorkspaceEmpty = async () => {
      // Check if we have canvases in current state
      if (canvases.length > 0) {
        return false;
      }
      
      // For localStorage users (no Supabase), check localStorage
      if (!effectiveUserId || !enableSupabase) {
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
      }
      
      // For Supabase users, only check if we've successfully loaded from Supabase
      if (effectiveUserId && enableSupabase) {
        if (!hasLoadedCanvasesRef.current) {
          return false; // Wait for Supabase load to complete
        }
      }
      
      return true;
    };
    
    checkIfWorkspaceEmpty().then((shouldCreate) => {
      console.log('[AutoCreateEffect] shouldCreate:', shouldCreate);
      if (shouldCreate) {
        defaultCanvasCreatedRef.current = true;
        // Use setTimeout to avoid calling createCanvas during render
        setTimeout(() => {
          // Ensure auto-created canvas goes to root folder and uses proper parameters
          createCanvas(defaultCanvasTitle, null, false).catch((_error) => {
            console.error('Failed to create default canvas:', _error);
            
            // In production, this is a critical error - reset flag and show error
            if (isProduction && effectiveUserId && enableSupabase) {
              setError('Failed to create default canvas. Please check your connection and try again.');
            }
            
            // Reset the flag if creation failed so it can be retried
            defaultCanvasCreatedRef.current = false;
          });
        }, 100);
      }
    });
  }, [isInitialized, autoCreateDefault, canvases.length, effectiveUserId, enableSupabase]);

  // NEW: Load canvas content when currentCanvasId is set
  useEffect(() => {
    const deletionInProgress = externalDeletionRef?.current || isDeletionInProgressRef.current;
    
    // Skip auto-loading if deletion is in progress or if a canvas was already selected during deletion
    if (deletionInProgress || canvasSelectedDuringDeletionRef.current) {
      return;
    }
    
    if (currentCanvasId && editor && isInitialized) {
      // Add a small delay to ensure state updates have propagated
      setTimeout(() => {
        // Only load if not already loading
        if (!isLoadingRef.current) {
          // Set a flag to indicate we're loading (this will be used by auto-save)
          isLoadingRef.current = true;
          loadCanvasState(currentCanvasId).finally(() => {
            // Clear loading flag after a short delay to allow editor to settle
            setTimeout(() => {
              isLoadingRef.current = false;
            }, 100);
          });
        }
      }, 50); // Increased delay to prevent race conditions
    }
  }, [currentCanvasId, editor, isInitialized, loadCanvasState, externalDeletionRef]);

  // Get current canvas
  const currentCanvas = canvases.find(canvas => canvas.metadata.id === currentCanvasId) || null;



  const reorderCanvas = useCallback(async (sourceId: string, targetId: string) => {
    if (!enableSupabase || !effectiveUserId) return;
    
    try {
      // Optimistically update the UI immediately
      setCanvases(prev => {
        const sourceCanvas = prev.find(c => c.metadata.id === sourceId);
        const targetCanvas = prev.find(c => c.metadata.id === targetId);

        if (!sourceCanvas || !targetCanvas) {
          return prev;
        }

        // Verify both canvases are in the same folder
        if (sourceCanvas.metadata.folderId !== targetCanvas.metadata.folderId) {
          return prev;
        }

        // Get all canvases in the same folder, sorted by sort_order
        const sameFolderCanvases = prev.filter(c => c.metadata.folderId === sourceCanvas.metadata.folderId);
        const otherCanvases = prev.filter(c => c.metadata.folderId !== sourceCanvas.metadata.folderId);

        // Sort by current sort_order
        sameFolderCanvases.sort((a, b) => (a.metadata.sort_order || 0) - (b.metadata.sort_order || 0));
        
        // Find positions
        const sourceIndex = sameFolderCanvases.findIndex(c => c.metadata.id === sourceId);
        const targetIndex = sameFolderCanvases.findIndex(c => c.metadata.id === targetId);

        if (sourceIndex === -1 || targetIndex === -1) {
          return prev;
        }

        // Use arrayMove utility to handle positioning correctly
        const reorderedCanvases = arrayMove(sameFolderCanvases, sourceIndex, targetIndex);
        
        // Update sort_order for all canvases in the folder (use 1-based indexing to match creation)
        const updatedFolderCanvases = reorderedCanvases.map((canvas, index) => ({
          ...canvas,
          metadata: {
            ...canvas.metadata,
            sort_order: index + 1,
          },
        }));

        // Combine with canvases from other folders
        const allUpdatedCanvases = [...updatedFolderCanvases, ...otherCanvases];
        
        return allUpdatedCanvases;
      });
      
      await CanvasService.reorderCanvases(effectiveUserId, sourceId, targetId);
      
      // No need to reload data since optimistic update already handled UI state
      // Only reload on error to revert optimistic changes
    } catch (error: unknown) {
      console.error('Failed to reorder canvas:', error);
      // Revert optimistic update on error
      await loadUserData();
    }
  }, [enableSupabase, effectiveUserId, loadUserData]);

  const reorderFolder = useCallback(async (sourceId: string, targetId: string) => {
    if (!enableSupabase || !effectiveUserId) return;
    
    try {
      await CanvasService.reorderFolders(effectiveUserId, sourceId, targetId);
      
      // Refresh folders to get the new order
      await loadUserData();
    } catch (err) {
      console.error('Failed to reorder folders:', err);
      setError('Failed to save new folder order');
    }
  }, [enableSupabase, effectiveUserId, loadUserData]);



  return {
    canvases,
    folders,
    currentCanvas,
    isLoading,
    error,
    createCanvas,
    duplicateCanvas,
    updateCanvas,
    deleteCanvas,
    switchCanvas,
    saveCurrentCanvas,
    clearError,
    preloadCanvas,
    unloadCanvas,
    createFolder,
    updateFolder,
    deleteFolder,
    moveCanvasToFolder,
    loadUserData,
    reorderCanvas,
    reorderFolder,
    isLoadingRef, // NEW: Expose loading ref for auto-save coordination
  };
} 