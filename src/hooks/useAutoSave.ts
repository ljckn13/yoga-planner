import { useEffect, useCallback, useState, useRef } from 'react';
import { type Editor } from 'tldraw';
import { useCanvasState, type CanvasState } from './useCanvasState';

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
    autoSaveDelay = 0, // Instant save (was 2000ms)
    enableAutoSave = true,
  } = options;

  const { serializeCanvas, deserializeCanvas, error: serializeError } = useCanvasState(editor);
  
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'unsaved'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const storageKey = `${STORAGE_KEY_PREFIX}${canvasId}`;

  const clearAutoSaveTimeout = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
  }, []);

  const saveToStorage = useCallback(async () => {
    if (!editor) return;
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
  }, [editor, serializeCanvas, storageKey]);

  const loadFromStorage = useCallback(async () => {
    if (!editor) return;
    try {
      const savedData = localStorage.getItem(storageKey);
      if (!savedData) return;
      const canvasState: CanvasState = JSON.parse(savedData);
      if (!canvasState.snapshot || !canvasState.timestamp) {
        throw new Error('Invalid saved canvas data');
      }
      const success = await deserializeCanvas(canvasState);
      if (success) {
        setLastSaved(new Date(canvasState.timestamp));
        setSaveStatus('saved');
        setHasUnsavedChanges(false);
      } else {
        throw new Error('Failed to deserialize canvas');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Load failed';
      setError(errorMessage);
      setSaveStatus('error');
      localStorage.removeItem(storageKey);
    }
  }, [editor, deserializeCanvas, storageKey]);

  const manualSave = useCallback(async () => {
    clearAutoSaveTimeout();
    await saveToStorage();
  }, [clearAutoSaveTimeout, saveToStorage]);

  const clearSavedState = useCallback(() => {
    localStorage.removeItem(storageKey);
    setLastSaved(null);
    setSaveStatus('saved');
    setHasUnsavedChanges(false);
    setError(null);
  }, [storageKey]);

  useEffect(() => {
    if (!editor || !enableAutoSave) return;
    const handleCanvasChange = () => {
      setHasUnsavedChanges(true);
      setSaveStatus('unsaved');
      clearAutoSaveTimeout();
      autoSaveTimeoutRef.current = window.setTimeout(() => {
        saveToStorage();
      }, autoSaveDelay);
    };
    const unsubscribe = editor.store.listen(() => {
      handleCanvasChange();
    });
    return () => {
      unsubscribe();
      clearAutoSaveTimeout();
    };
  }, [editor, enableAutoSave, autoSaveDelay, clearAutoSaveTimeout, saveToStorage]);

  useEffect(() => {
    if (editor) {
      loadFromStorage();
    }
  }, [editor, loadFromStorage]);

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