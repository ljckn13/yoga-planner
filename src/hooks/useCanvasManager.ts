import { useState, useCallback, useEffect, useRef } from 'react';
import { type Editor, loadSnapshot, getSnapshot } from 'tldraw';

export interface CanvasMetadata {
  id: string;
  title: string;
  lastModified: Date;
  createdAt: Date;
  thumbnail?: string; // Base64 encoded thumbnail
  version: string;
}

export interface CanvasListItem {
  metadata: CanvasMetadata;
  hasUnsavedChanges: boolean;
  saveStatus: 'saved' | 'saving' | 'error' | 'unsaved';
}

export interface UseCanvasManagerReturn {
  canvases: CanvasListItem[];
  currentCanvas: CanvasListItem | null;
  isLoading: boolean;
  error: string | null;
  createCanvas: (title?: string) => Promise<string>;
  updateCanvas: (id: string, updates: Partial<CanvasMetadata>) => Promise<boolean>;
  deleteCanvas: (id: string) => Promise<boolean>;
  switchCanvas: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export interface UseCanvasManagerOptions {
  defaultCanvasTitle?: string;
  autoCreateDefault?: boolean;
  version?: string;
}

const CANVAS_LIST_KEY = 'yoga_flow_canvas_list';
const STORAGE_KEY_PREFIX = 'yoga_flow_canvas_';
const DEFAULT_CANVAS_TITLE = 'Untitled Flow';

export function useCanvasManager(
  editor: Editor | null,
  options: UseCanvasManagerOptions = {}
): UseCanvasManagerReturn {
  const {
    defaultCanvasTitle = DEFAULT_CANVAS_TITLE,
    autoCreateDefault = true,
    version = '1.0.0',
  } = options;

  const [canvases, setCanvases] = useState<CanvasListItem[]>([]);
  const [currentCanvasId, setCurrentCanvasId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const defaultCanvasCreatedRef = useRef(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

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
        
        console.log('Blank canvas state created successfully');
        return true;
      }
      
      console.error('Failed to create blank canvas state');
      return false;
    } catch (err) {
      console.error('Error in loadCanvasState:', err);
      return false;
    }
  }, [editor, createBlankCanvasState]);

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
  const createCanvas = useCallback(async (title?: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const canvasTitle = title || `${defaultCanvasTitle} ${canvases.length + 1}`;
      const id = `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      
      const newCanvas: CanvasListItem = {
        metadata: {
          id,
          title: canvasTitle,
          lastModified: now,
          createdAt: now,
          thumbnail: await generateThumbnail(),
          version,
        },
        hasUnsavedChanges: false,
        saveStatus: 'saved',
      };

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
  }, [canvases, defaultCanvasTitle, version, generateThumbnail]);

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
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update canvas';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [canvases]);

  // Delete a canvas
  const deleteCanvas = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Remove from canvas list
      const updatedCanvases = canvases.filter(canvas => canvas.metadata.id !== id);
      setCanvases(updatedCanvases);

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
  }, [canvases, currentCanvasId, loadCanvasState]);

  // Switch to a different canvas
  const switchCanvas = useCallback(async (id: string): Promise<boolean> => {
    console.log('switchCanvas called with id:', id);
    console.log('Current currentCanvasId:', currentCanvasId);
    console.log('Available canvases:', canvases.map(c => c.metadata.id));
    
    setIsLoading(true);
    setError(null);

    try {
      const targetCanvas = canvases.find(canvas => canvas.metadata.id === id);
      if (!targetCanvas) {
        console.error('Canvas not found:', id);
        throw new Error('Canvas not found');
      }

      console.log('Setting currentCanvasId to:', id);
      setCurrentCanvasId(id);
      
      // Update the lastModified timestamp of the canvas being switched to
      const updatedCanvases = canvases.map(canvas => {
        if (canvas.metadata.id === id) {
          return {
            ...canvas,
            metadata: {
              ...canvas.metadata,
              lastModified: new Date(),
            },
          };
        }
        return canvas;
      });
      setCanvases(updatedCanvases);
      
      // Load the canvas state
      console.log('Loading canvas state for:', id);
      const success = await loadCanvasState(id);
      if (!success) {
        console.error('Failed to load canvas state for:', id);
        throw new Error('Failed to load canvas state');
      }
      
      console.log('Canvas switch completed successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch canvas';
      console.error('Error in switchCanvas:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [canvases, loadCanvasState]);

  // Load canvas list on mount (only once)
  useEffect(() => {
    if (!isInitialized) {
      loadCanvasList();
      setIsInitialized(true);
    }
  }, [isInitialized, loadCanvasList]);

  // Create default canvas if none exist and autoCreateDefault is true (only once)
  useEffect(() => {
    if (autoCreateDefault && isInitialized && canvases.length === 0 && !isLoading && !defaultCanvasCreatedRef.current) {
      defaultCanvasCreatedRef.current = true;
      createCanvas(defaultCanvasTitle);
    }
  }, [autoCreateDefault, isInitialized, canvases.length, isLoading, createCanvas, defaultCanvasTitle]);

  const currentCanvas = canvases.find(canvas => canvas.metadata.id === currentCanvasId) || null;

  return {
    canvases,
    currentCanvas,
    isLoading,
    error,
    createCanvas,
    updateCanvas,
    deleteCanvas,
    switchCanvas,
    clearError,
  };
} 