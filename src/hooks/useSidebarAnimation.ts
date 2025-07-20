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
  // Camera position tracking for animation
  const cameraPositionBeforeAnimationRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const sidebarStateBeforeAnimationRef = useRef<boolean | null>(null);
  const lastProcessedSidebarStateRef = useRef<boolean | null>(null);
  const isCanvasLoadingRef = useRef(false);

  // Initialize the last processed state when component mounts
  useEffect(() => {
    if (lastProcessedSidebarStateRef.current === null) {
      lastProcessedSidebarStateRef.current = sidebarVisible;
      console.log('🎯 Initializing last processed state:', sidebarVisible);
    }
  }, [sidebarVisible]);

  // Track canvas loading state
  useEffect(() => {
    isCanvasLoadingRef.current = isLoading;
    console.log('📊 Canvas loading state changed:', isLoading);
  }, [isLoading]);

  // Handle sidebar animation with content hiding and camera compensation
  useEffect(() => {
    if (!editorInstance) return;
    
    // Don't run animation logic if the editor is still loading or if there are no shapes yet
    const allShapes = editorInstance.getCurrentPageShapes();
    if (allShapes.length === 0) {
      console.log('🔄 Skipping animation effect - no shapes on canvas yet');
      return;
    }
    
    // Don't interfere with canvas loading operations
    if (isCanvasLoadingRef.current) {
      console.log('🔄 Skipping animation effect - canvas is loading');
      return;
    }
    
    // Don't run animation effects until the initial delay has passed
    if (!allowAnimation) {
      console.log('🔄 Skipping animation effect - animation not yet allowed');
      return;
    }
    
    // Don't run animation effect during initial state setup
    if (!hasInitialized) {
      console.log('🔄 Skipping animation effect - not yet initialized');
      return;
    }
    
    const currentCamera = editorInstance.getCamera();
    console.log('🔄 Animation effect triggered:', { 
      isAnimating, 
      sidebarVisible, 
      hasStoredState: !!cameraPositionBeforeAnimationRef.current,
      lastProcessedState: lastProcessedSidebarStateRef.current,
      totalShapes: allShapes.length,
      currentCamera: { x: currentCamera.x, y: currentCamera.y, z: currentCamera.z }
    });
    
    if (isAnimating) {
      // Store state before animation starts (only if not already stored)
      if (!cameraPositionBeforeAnimationRef.current) {
        const camera = editorInstance.getCamera();
        cameraPositionBeforeAnimationRef.current = { x: camera.x, y: camera.y, z: camera.z };
        sidebarStateBeforeAnimationRef.current = lastProcessedSidebarStateRef.current;
        
        console.log('📷 Animation starting - storing state:', { 
          storedCamera: { x: camera.x, y: camera.y, z: camera.z },
          previousSidebarState: lastProcessedSidebarStateRef.current,
          targetSidebarState: sidebarVisible,
          actualTransition: lastProcessedSidebarStateRef.current !== sidebarVisible ? 'YES' : 'NO'
        });
        
        // Fade out all shapes smoothly by setting their opacity to 0
        const shapes = editorInstance.getCurrentPageShapes();
        const shapeUpdates = shapes.map(shape => ({
          id: shape.id,
          type: shape.type,
          opacity: 0
        }));
        
        if (shapeUpdates.length > 0) {
          editorInstance.updateShapes(shapeUpdates);
          console.log('👻 Fading out', shapeUpdates.length, 'shapes during animation');
        }
        
        // Note: We don't set isReadonly anymore to avoid hiding all UI components
        // Instead, we'll handle UI hiding through the components prop in TldrawCanvas
      }
    } else {
      // Animation finished - compensate for canvas movement and enable editing
      if (cameraPositionBeforeAnimationRef.current && sidebarStateBeforeAnimationRef.current !== null) {
        const { x, y, z } = cameraPositionBeforeAnimationRef.current;
        const previousSidebarState = sidebarStateBeforeAnimationRef.current;
        const currentSidebarState = sidebarVisible;
        
        // Only apply compensation if there was an actual state change
        const hasStateChanged = previousSidebarState !== currentSidebarState;
        
        console.log('📷 Animation finished - checking for compensation:', {
          storedCamera: { x, y, z },
          previousSidebarState,
          currentSidebarState,
          hasStateChanged,
          shouldCompensate: hasStateChanged
        });
        
        if (hasStateChanged) {
          // Calculate the actual shift amount based on sidebar layout
          const actualShift = 200; // The actual measured difference
           
          // Determine if sidebar is expanding or collapsing
          const isExpanding = currentSidebarState && !previousSidebarState; // false -> true
          const isCollapsing = !currentSidebarState && previousSidebarState; // true -> false
           
          let compensationX = 0;
          if (isExpanding) {
            // Sidebar expanding: content shifts left, so compensate by moving camera left to follow
            compensationX = -actualShift;
          } else if (isCollapsing) {
            // Sidebar collapsing: content shifts right, so compensate by moving camera right to follow
            compensationX = actualShift;
          }
           
          console.log('📷 Applying camera compensation:', {
            transition: isExpanding ? 'EXPANDING' : isCollapsing ? 'COLLAPSING' : 'NONE',
            actualShift,
            compensationX,
            originalCamera: { x, y, z },
            newCamera: { x: x + compensationX, y, z }
          });
           
          if (compensationX !== 0) {
            editorInstance.setCamera({ 
              x: x + compensationX, 
              y: y, 
              z: z 
            });
            console.log('✅ Camera compensation applied successfully');
          }
        } else {
          console.log('📷 No state change detected, skipping compensation');
        }
        
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
            console.log('👻 Fading in', shapeUpdates.length, 'shapes after animation (with 300ms delay)');
          }
        }, 300);
        
        // Update the last processed state to the current state
        lastProcessedSidebarStateRef.current = currentSidebarState;
        console.log('📝 Updated last processed state to:', currentSidebarState);
        
        // Clear stored state
        cameraPositionBeforeAnimationRef.current = null;
        sidebarStateBeforeAnimationRef.current = null;
      }
      
      // Note: We don't need to re-enable editing since we're not setting isReadonly
    }
  }, [isAnimating, editorInstance, sidebarVisible, allowAnimation, hasInitialized]);

  return {
    lastProcessedSidebarState: lastProcessedSidebarStateRef.current,
  };
}; 