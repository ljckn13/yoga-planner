import React, { useRef, useEffect } from 'react';
import { type Editor } from 'tldraw';

interface UseSidebarAnimationOptions {
  editorInstance: Editor | null;
  sidebarVisible: boolean;
  isAnimating: boolean;
  allowAnimation: boolean;
  hasInitialized: boolean;
  isLoading: boolean;
}

export const useSidebarAnimation = ({
  editorInstance,
  sidebarVisible,
  isAnimating,
  allowAnimation,
  hasInitialized,
  isLoading,
}: UseSidebarAnimationOptions) => {
  // Add CSS for smooth shape transitions
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .tldraw__editor[data-animating="true"] .tlui-shape {
        transition: opacity 0.25s ease-in-out !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Track canvas loading state
  const isCanvasLoadingRef = useRef(false);
  useEffect(() => {
    isCanvasLoadingRef.current = isLoading;
  }, [isLoading]);

  // Handle sidebar animation with content hiding
  useEffect(() => {
    if (!editorInstance) return;
    
    // Don't run animation logic if the editor is still loading or if there are no shapes yet
    const allShapes = editorInstance.getCurrentPageShapes();
    if (allShapes.length === 0) {
      return;
    }
    
    // Don't interfere with canvas loading operations
    if (isCanvasLoadingRef.current) {
      return;
    }
    
    // Don't run animation effects until the initial delay has passed
    if (!allowAnimation) {
      return;
    }
    
    // Don't run animation effect during initial state setup
    if (!hasInitialized) {
      return;
    }

    if (isAnimating) {
      // Fade out all shapes smoothly by setting their opacity to 0
      const shapes = editorInstance.getCurrentPageShapes();
      const shapeUpdates = shapes.map(shape => ({
        id: shape.id,
        type: shape.type,
        opacity: 0
      }));
      if (shapeUpdates.length > 0) {
        editorInstance.updateShapes(shapeUpdates);
      }
    } else {
      // Fade in shapes smoothly after a longer delay for a more gradual effect
      setTimeout(() => {
        const shapes = editorInstance.getCurrentPageShapes();
        const shapeUpdates = shapes.map(shape => ({
          id: shape.id,
          type: shape.type,
          opacity: 1
        }));
        if (shapeUpdates.length > 0) {
          editorInstance.updateShapes(shapeUpdates);
        }
      }, 300);
    }
  }, [isAnimating, editorInstance, sidebarVisible, allowAnimation, hasInitialized]);

  return {};
}; 