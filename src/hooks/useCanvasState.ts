import { useState, useCallback } from 'react';
import { type Editor, loadSnapshot, getSnapshot } from 'tldraw';

export interface CanvasState {
  snapshot: ReturnType<typeof getSnapshot>;
  timestamp: number;
  version: string;
}

export interface UseCanvasStateReturn {
  serializeCanvas: () => Promise<CanvasState | null>;
  deserializeCanvas: (state: CanvasState) => Promise<boolean>;
  saveCanvasState: () => boolean;
  loadCanvasState: () => boolean;
  clearCanvasState: () => boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export interface UseCanvasStateOptions {
  version?: string;
}

/**
 * Hook for serializing and deserializing tldraw canvas state
 * 
 * @param editor - The tldraw editor instance
 * @param options - Configuration options
 * @returns Object with serialization methods and state
 */
export function useCanvasState(
  editor: Editor | null,
  options: UseCanvasStateOptions = {}
): UseCanvasStateReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { version = '1.0.0' } = options;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const serializeCanvas = useCallback(async (): Promise<CanvasState | null> => {
    if (!editor) {
      setError('Editor not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the current snapshot from the editor store using the new API
      const snapshot = getSnapshot(editor.store);
      
      // Create canvas state object
      const canvasState: CanvasState = {
        snapshot,
        timestamp: Date.now(),
        version,
      };

      return canvasState;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to serialize canvas';
      setError(errorMessage);
      console.error('Canvas serialization error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [editor, version]);

  const deserializeCanvas = useCallback(async (state: CanvasState): Promise<boolean> => {
    if (!editor) {
      setError('Editor not available');
      return false;
    }

    if (!state.snapshot) {
      setError('Invalid canvas state: missing snapshot');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the new loadSnapshot function instead of the deprecated editor.store.loadSnapshot
      loadSnapshot(editor.store, state.snapshot);
      
      // Force a re-render of the editor
      editor.updateInstanceState({});
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deserialize canvas';
      setError(errorMessage);
      console.error('Canvas deserialization error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [editor]);

  const saveCanvasState = useCallback(() => {
    if (!editor) {
      console.error('Editor not available');
      return false;
    }

    try {
      const snapshot = getSnapshot(editor.store);
      const serializedState = JSON.stringify(snapshot);
      localStorage.setItem('yoga-flow-canvas-state', serializedState);
      console.log('Canvas state saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving canvas state:', error);
      return false;
    }
  }, [editor]);

  const loadCanvasState = useCallback(() => {
    if (!editor) {
      console.error('Editor not available');
      return false;
    }

    try {
      const savedState = localStorage.getItem('yoga-flow-canvas-state');
      if (!savedState) {
        console.log('No saved canvas state found');
        return false;
      }

      const snapshot = JSON.parse(savedState);
      loadSnapshot(editor.store, snapshot);
      console.log('Canvas state loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading canvas state:', error);
      return false;
    }
  }, [editor]);

  const clearCanvasState = useCallback(() => {
    try {
      localStorage.removeItem('yoga-flow-canvas-state');
      console.log('Canvas state cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing canvas state:', error);
      return false;
    }
  }, []);

  return {
    serializeCanvas,
    deserializeCanvas,
    saveCanvasState,
    loadCanvasState,
    clearCanvasState,
    isLoading,
    error,
    clearError,
  };
} 