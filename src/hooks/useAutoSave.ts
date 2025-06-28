import { useEffect, useCallback, useState, useRef } from 'react';
import { type Editor, getSnapshot } from 'tldraw';
import { useCanvasState } from './useCanvasState';

export interface UseAutoSaveReturn {
  saveStatus: 'saved' | 'saving' | 'error' | 'unsaved';
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  manualSave: () => Promise<void>;
  clearSavedState: () => void;
  error: string | null;
}

export interface UseAutoSaveOptions {
  canvasId?: string;
  autoSaveDelay?: number; // milliseconds
  enableAutoSave?: boolean;
}

const STORAGE_KEY_PREFIX = 'yoga_flow_canvas_';

export function useAutoSave(
  editor: Editor | null,
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn {
  const {
    canvasId = 'default',
    autoSaveDelay = 1000, // 1 second delay for auto-save
  } = options;

  const { serializeCanvas, error: serializeError } = useCanvasState(editor);
  
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'unsaved'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);

  const clearAutoSaveTimeout = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
  }, []);

  const saveToLocalStorage = useCallback((snapshot: any) => {
    if (!canvasId) {

      return;
    }

    try {
      const data = { snapshot, lastSaved: new Date().toISOString() };
      const storageKey = `${STORAGE_KEY_PREFIX}${canvasId}`;
      
  
      
      localStorage.setItem(storageKey, JSON.stringify(data));
      setLastSaved(new Date());

    } catch (error) {
      console.error(`❌ [AutoSave] Failed to save canvas ${canvasId}:`, error);
    }
  }, [canvasId]);

  const saveToStorage = useCallback(async () => {
    if (!editor || !canvasId) return;
    const storageKey = `${STORAGE_KEY_PREFIX}${canvasId}`;

    

    try {
      setSaveStatus('saving');
      setError(null);
      const canvasState = await serializeCanvas();
      if (!canvasState) {
        throw new Error('Failed to serialize canvas');
      }
      
      localStorage.setItem(storageKey, JSON.stringify(canvasState));
      setLastSaved(new Date());
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Save failed';
      setError(errorMessage);
      setSaveStatus('error');
    }
  }, [editor, serializeCanvas, canvasId]);

  const manualSave = useCallback(async () => {
    clearAutoSaveTimeout();
    await saveToStorage();
  }, [clearAutoSaveTimeout, saveToStorage]);

  const clearSavedState = useCallback(() => {
    if (!canvasId) return;
    const storageKey = `${STORAGE_KEY_PREFIX}${canvasId}`;
    localStorage.removeItem(storageKey);
    setLastSaved(null);
    setSaveStatus('saved');
    setHasUnsavedChanges(false);
    setError(null);
  }, [canvasId]);

  useEffect(() => {
    if (!editor || !canvasId || canvasId.trim() === '') {

      return;
    }


    setSaveStatus('saving');

    // Save current state immediately when switching to a new canvas
    const currentSnapshot = getSnapshot(editor.store);
    saveToLocalStorage(currentSnapshot);

    const handleStoreChange = () => {

      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      setSaveStatus('saving');
      autoSaveTimeoutRef.current = setTimeout(() => {
        const snapshot = getSnapshot(editor.store);
  
        saveToLocalStorage(snapshot);
        setSaveStatus('saved');
      }, autoSaveDelay);
    };

    // Listen to all store changes to ensure we capture user edits
    const unsubscribe = editor.store.listen(handleStoreChange);

    return () => {
  
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      unsubscribe();
    };
  }, [editor, canvasId, saveToLocalStorage, autoSaveDelay]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        manualSave();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [manualSave]);

  const combinedError = error || serializeError;

  return {
    saveStatus,
    lastSaved,
    hasUnsavedChanges,
    manualSave,
    clearSavedState,
    error: combinedError,
  };
}