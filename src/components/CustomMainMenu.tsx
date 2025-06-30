import React from 'react';
import {
  TldrawUiMenuItem,
  TldrawUiMenuGroup,
  DefaultMainMenu,
  DefaultMainMenuContent,
} from 'tldraw';
import { useCanvasContext } from '../contexts/CanvasContext';

// Custom main menu with canvas management
export const CustomMainMenu: React.FC = () => {
  const { canvases, currentCanvasId } = useCanvasContext();

  const handleDeleteCanvas = async () => {
    if (canvases.length <= 1) {
      alert('Cannot delete the last canvas. Create a new one first.');
      return;
    }
    
    const currentCanvas = canvases.find(c => c.id === currentCanvasId);
    if (!currentCanvas) return;
    
    if (confirm(`Are you sure you want to delete "${currentCanvas.title}"?`)) {
      // Canvas deletion is handled by the manager
      const remainingCanvases = canvases.filter(c => c.id !== currentCanvasId);
      if (remainingCanvases.length > 0) {
        // Switch to the first remaining canvas
      }
    }
  };

  return (
    <DefaultMainMenu>
      <DefaultMainMenuContent />
      <TldrawUiMenuGroup id="canvas-actions">
        <TldrawUiMenuItem
          id="delete-canvas"
          label="Delete Canvas"
          icon="trash"
          onSelect={handleDeleteCanvas}
        />
      </TldrawUiMenuGroup>
    </DefaultMainMenu>
  );
}; 