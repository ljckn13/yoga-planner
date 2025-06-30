import React from 'react';
import { useCanvasContext } from '../contexts/CanvasContext';

// Custom hook to track current canvas title
export function useCurrentCanvasTitle() {
  const [canvasTitle, setCanvasTitle] = React.useState('Untitled Flow');
  const { canvases, currentCanvasId } = useCanvasContext();
  
  React.useEffect(() => {
    const currentCanvas = canvases.find((canvas) => canvas.id === currentCanvasId);
    if (currentCanvas && currentCanvas.title) {
      setCanvasTitle(currentCanvas.title);
    } else {
      setCanvasTitle('Untitled Flow');
    }
  }, [canvases, currentCanvasId]);
  
  return canvasTitle;
} 