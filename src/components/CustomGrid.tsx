import { useLayoutEffect, useRef } from 'react';
import { useEditor, useValue, useIsDarkMode } from 'tldraw';

// Custom grid component with subtle dots
export const CustomGrid = ({ size, ...camera }: any) => {
  const editor = useEditor();
  const screenBounds = useValue('screenBounds', () => editor.getViewportScreenBounds(), []);
  const devicePixelRatio = useValue('dpr', () => editor.getInstanceState().devicePixelRatio, []);
  const isDarkMode = useIsDarkMode();
  const canvas = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    if (!canvas.current) return;
    const canvasW = screenBounds.w * devicePixelRatio;
    const canvasH = screenBounds.h * devicePixelRatio;
    canvas.current.width = canvasW;
    canvas.current.height = canvasH;

    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasW, canvasH);

    // Use a larger grid size for more distance between dots
    const gridSize = size * 2;

    const pageViewportBounds = editor.getViewportPageBounds();
    const startPageX = Math.ceil(pageViewportBounds.minX / gridSize) * gridSize;
    const startPageY = Math.ceil(pageViewportBounds.minY / gridSize) * gridSize;
    const endPageX = Math.floor(pageViewportBounds.maxX / gridSize) * gridSize;
    const endPageY = Math.floor(pageViewportBounds.maxY / gridSize) * gridSize;
    const numRows = Math.round((endPageY - startPageY) / gridSize);
    const numCols = Math.round((endPageX - startPageX) / gridSize);

    // Dots color that matches the yellow-white background theme
    ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(139, 69, 19, 0.15)';

    // Draw dots at grid intersections
    for (let row = 0; row <= numRows; row++) {
      for (let col = 0; col <= numCols; col++) {
        const pageX = startPageX + col * gridSize;
        const pageY = startPageY + row * gridSize;
        const canvasX = (pageX + camera.x) * camera.z * devicePixelRatio;
        const canvasY = (pageY + camera.y) * camera.z * devicePixelRatio;
        
        // Draw a small dot
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 1 * devicePixelRatio, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }, [screenBounds, camera, size, devicePixelRatio, editor, isDarkMode]);

  return <canvas className="tl-grid" ref={canvas} />;
}; 