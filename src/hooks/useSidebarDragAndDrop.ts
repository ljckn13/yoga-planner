import { useState, useCallback, useRef } from 'react';
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { useCanvasManager } from './useCanvasManager';

interface Canvas {
  id: string;
  title: string;
  folderId?: string | null;
  createdAt?: Date;
  sort_order?: number;
}

export const useSidebarDragAndDrop = (
  canvasManager: ReturnType<typeof useCanvasManager>,
  canvases: Canvas[],
  setOpenFolders: React.Dispatch<React.SetStateAction<Set<string>>>,
  isDragInProgressRef?: React.RefObject<boolean>,
  onSwitchCanvas?: (id: string) => void
) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedCanvas, setDraggedCanvas] = useState<Canvas | null>(null);
  const [overFolderIds, setOverFolderIds] = useState<Set<string>>(new Set());

  const { moveCanvasToFolder, updateCanvasOrderOptimistically, reorderCanvas } = canvasManager;

  const isProcessingDragEnd = useRef(false);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const itemId = event.active.id as string;
    const canvas = canvases.find(c => c.id === itemId);
    
    // Only handle canvas drags
    if (canvas) {
      setActiveId(itemId);
      setDraggedCanvas(canvas);
      setOverFolderIds(new Set());
      
      // Automatically switch to the dragged canvas
      if (onSwitchCanvas) {
        onSwitchCanvas(canvas.id);
      }
      
      // Set drag in progress
      if (isDragInProgressRef?.current !== undefined) {
        isDragInProgressRef.current = true;
      }
    }
  }, [canvases, isDragInProgressRef, onSwitchCanvas]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!active || !over) {
      return;
    }

    // Only handle canvas operations
    if (active.data.current?.type !== 'canvas') {
      return;
    }

    const overData = over.data.current;
    
    if (!overData) {
      return;
    }

    // Check if over a canvas
    if (overData.type === 'canvas') {
      const overCanvas = canvases.find(c => c.id === over.id);
      if (overCanvas && overCanvas.folderId) {
        setOverFolderIds(new Set([overCanvas.folderId]));
        return;
      }
    }

    // Check if over a folder (including root folder)
    if (overData.type === 'folder') {
      const targetFolderId = overData.folderId;
      if (targetFolderId !== undefined) {
        setOverFolderIds(new Set([targetFolderId]));
        return;
      }
    }

    // If we get here, we're not over any recognized drop target
    setOverFolderIds(new Set());
  }, [canvases]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!active || !over) {
      clearDragState();
      return;
    }

    // Prevent double execution
    if (isProcessingDragEnd.current) {
      return;
    }

    isProcessingDragEnd.current = true;

    try {
      // Only handle canvas operations
      if (active.data.current?.type === 'canvas') {
        const activeCanvas = canvases.find(c => c.id === active.id);
        
        if (!activeCanvas) {
          console.error('Active canvas not found');
          return;
        }

        // Handle different drop targets
        if (over.data.current?.type === 'canvas') {
          const overCanvas = canvases.find(c => c.id === over.id);
          
          if (overCanvas) {
            const activeFolderId = activeCanvas.folderId;
            const overFolderId = overCanvas.folderId || null; // Convert undefined to null
            
            if (activeFolderId === overFolderId) {
              // Same folder - reorder
              await handleCanvasReorder(activeCanvas.id, overCanvas.id);
            } else {
              // Different folders - move to the over canvas's folder
              await handleCanvasMove(activeCanvas.id, overFolderId);
            }
          }
        }
        else if (over.data.current?.type === 'folder') {
          const targetFolderId = over.data.current.folderId;
          if (targetFolderId !== undefined) {
            await handleCanvasMove(activeCanvas.id, targetFolderId);
          }
        }
      }
    } finally {
      isProcessingDragEnd.current = false;
      
      // Add a small delay before clearing drag state to prevent UI jumping
      setTimeout(clearDragState, 100);
    }
  }, [canvases, isDragInProgressRef]);

  const handleCanvasMove = async (canvasId: string, targetFolderId: string | null) => {
    try {
      const canvas = canvases.find(c => c.id === canvasId);
      if (!canvas) {
        console.error('Canvas not found');
        return;
      }

      const currentFolderId = canvas.folderId;
      
      // Don't do anything if the canvas is already in the target location
      if (currentFolderId === targetFolderId) {
        return;
      }

      // Move the canvas
      await canvasManager.moveCanvasToFolder(canvasId, targetFolderId);

      // Auto-open target folder if it's a custom folder
      if (targetFolderId) {
        setOpenFolders(prev => {
          const newSet = new Set(prev);
          newSet.add(targetFolderId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error moving canvas:', error);
    }
  };

  const handleCanvasReorder = async (sourceId: string, targetId: string) => {
    try {
      // Optimistically update the UI immediately
      updateCanvasOrderOptimistically(sourceId, targetId);

      // Perform the actual reorder
      await reorderCanvas(sourceId, targetId);
    } catch (error) {
      console.error('Failed to reorder canvas:', error);
    }
  };

  // Helper function to check if a folder should show drop feedback
  const shouldFolderShowDropFeedback = useCallback((folderId: string) => {
    if (!activeId || !overFolderIds.has(folderId)) return false;
    
    const draggedCanvas = canvases.find(c => c.id === activeId);
    if (!draggedCanvas) return false;
    
    // Only show drop feedback for cross-folder drag operations
    return draggedCanvas.folderId !== folderId;
  }, [activeId, overFolderIds, canvases]);

  const clearDragState = () => {
    setActiveId(null);
    setDraggedCanvas(null);
    setOverFolderIds(new Set());
    
    // Clear drag in progress
    if (isDragInProgressRef?.current !== undefined) {
      isDragInProgressRef.current = false;
    }
  };

  return {
    activeId,
    draggedCanvas,
    overFolderIds,
    shouldFolderShowDropFeedback,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
};
