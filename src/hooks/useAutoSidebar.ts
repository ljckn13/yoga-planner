import { useState, useEffect, useRef, useCallback } from 'react';
import { useSidebarAnimationEmitter } from './useSidebarAnimationEvents';

interface UseAutoSidebarOptions {
  sidebarVisible: boolean;
  setSidebarVisible: (visible: boolean) => void;
  canvasHoverDelay?: number; // Delay before collapsing when hovering canvas (default: 4000ms)
  sidebarHoverDelay?: number; // Delay before expanding when hovering sidebar area (default: 2000ms)
  isDeletionInProgress?: boolean; // Prevent auto-hide during deletion animation
  isCreationInProgress?: boolean; // Prevent auto-hide during canvas creation
  isDragInProgress?: boolean; // Prevent auto-hide during drag operations
}

export const useAutoSidebar = ({
  sidebarVisible,
  setSidebarVisible,
      canvasHoverDelay = 100,
    sidebarHoverDelay = 100,
  isDeletionInProgress = false,
  isCreationInProgress = false,
  isDragInProgress = false,
}: UseAutoSidebarOptions) => {
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false);
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);
  const [isHoveringSidebarArea, setIsHoveringSidebarArea] = useState(false);
  
  // Track previous deletion state to detect when deletion completes
  const prevIsDeletionInProgress = useRef(isDeletionInProgress);
  const prevIsCreationInProgress = useRef(isCreationInProgress);
  
  const canvasHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sidebarHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sidebarAreaHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { emitSidebarAnimation } = useSidebarAnimationEmitter();

  // Clear all timeouts
  const clearAllTimeouts = useCallback(() => {
    if (canvasHoverTimeoutRef.current) {
      clearTimeout(canvasHoverTimeoutRef.current);
      canvasHoverTimeoutRef.current = null;
    }
    if (sidebarHoverTimeoutRef.current) {
      clearTimeout(sidebarHoverTimeoutRef.current);
      sidebarHoverTimeoutRef.current = null;
    }
    if (sidebarAreaHoverTimeoutRef.current) {
      clearTimeout(sidebarAreaHoverTimeoutRef.current);
      sidebarAreaHoverTimeoutRef.current = null;
    }
  }, []);

  // Handle sidebar hover
  const handleSidebarMouseEnter = useCallback(() => {
    setIsHoveringSidebar(true);
    clearAllTimeouts();
    
    if (!sidebarVisible) {
      // Start timer to expand sidebar
      sidebarHoverTimeoutRef.current = setTimeout(() => {
        emitSidebarAnimation(); // Emit event before animation
        setSidebarVisible(true);
      }, sidebarHoverDelay);
    }
  }, [sidebarVisible, setSidebarVisible, sidebarHoverDelay, clearAllTimeouts]);

  const handleSidebarMouseLeave = useCallback(() => {
    setIsHoveringSidebar(false);
    clearAllTimeouts();
  }, [clearAllTimeouts]);

  // Handle sidebar area hover (left padding area when sidebar is collapsed)
  const handleSidebarAreaMouseEnter = useCallback(() => {
    setIsHoveringSidebarArea(true);
    clearAllTimeouts();
    
    if (!sidebarVisible) {
      // Start timer to expand sidebar
      sidebarAreaHoverTimeoutRef.current = setTimeout(() => {
        emitSidebarAnimation(); // Emit event before animation
        setSidebarVisible(true);
      }, sidebarHoverDelay);
    }
  }, [sidebarVisible, setSidebarVisible, sidebarHoverDelay, clearAllTimeouts]);

  const handleSidebarAreaMouseLeave = useCallback(() => {
    setIsHoveringSidebarArea(false);
    clearAllTimeouts();
  }, [clearAllTimeouts]);

  // Handle canvas hover
  const handleCanvasMouseEnter = useCallback(() => {
    setIsHoveringCanvas(true);
    clearAllTimeouts();
    
    console.log('🖱️ Canvas mouse enter - sidebarVisible:', sidebarVisible, 'isDeletionInProgress:', isDeletionInProgress, 'isCreationInProgress:', isCreationInProgress, 'isDragInProgress:', isDragInProgress);
    
    if (sidebarVisible) {
      // Don't auto-collapse if any operation is in progress
      if (isDeletionInProgress || isCreationInProgress || isDragInProgress) {
        console.log('🔒 Keeping sidebar open - operation in progress');
        return; // Keep sidebar open
      }
      
      console.log('⏱️ Starting timer to collapse sidebar in', canvasHoverDelay, 'ms');
      // Start timer to collapse sidebar
      canvasHoverTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Timer fired - checking if safe to collapse. isDeletionInProgress:', isDeletionInProgress, 'isCreationInProgress:', isCreationInProgress, 'isDragInProgress:', isDragInProgress);
        // Double-check that no operations are in progress before collapsing
        if (!isDeletionInProgress && !isCreationInProgress && !isDragInProgress) {
          console.log('📐 Collapsing sidebar');
          emitSidebarAnimation(); // Emit event before animation
          setSidebarVisible(false);
        } else {
          console.log('🚫 Cancelling sidebar collapse - operation still in progress');
        }
      }, canvasHoverDelay);
    }
  }, [sidebarVisible, setSidebarVisible, canvasHoverDelay, clearAllTimeouts, isDeletionInProgress, isCreationInProgress, isDragInProgress]);

  const handleCanvasMouseLeave = useCallback(() => {
    setIsHoveringCanvas(false);
    clearAllTimeouts();
  }, [clearAllTimeouts]);

  // Auto-restart collapse timer when deletion/creation completes while hovering canvas
  useEffect(() => {
    // Check if deletion or creation just completed
    const deletionJustCompleted = prevIsDeletionInProgress.current && !isDeletionInProgress;
    const creationJustCompleted = prevIsCreationInProgress.current && !isCreationInProgress;
    
    if ((deletionJustCompleted || creationJustCompleted) && isHoveringCanvas && sidebarVisible) {
      console.log('🔄 Operation completed while hovering canvas - restarting collapse timer');
      clearAllTimeouts();
      
      // Start collapse timer since mouse is still over canvas
      canvasHoverTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Post-operation timer fired - checking if safe to collapse');
        if (!isDeletionInProgress && !isCreationInProgress && !isDragInProgress) {
          console.log('📐 Collapsing sidebar after operation completion');
          emitSidebarAnimation();
          setSidebarVisible(false);
        }
      }, canvasHoverDelay);
    }
    
    // Update previous state for next comparison
    prevIsDeletionInProgress.current = isDeletionInProgress;
    prevIsCreationInProgress.current = isCreationInProgress;
  }, [isDeletionInProgress, isCreationInProgress, isHoveringCanvas, sidebarVisible, canvasHoverDelay, clearAllTimeouts, emitSidebarAnimation, setSidebarVisible, isDragInProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  // Reset timeouts when sidebar visibility changes
  useEffect(() => {
    clearAllTimeouts();
  }, [sidebarVisible, clearAllTimeouts]);

  return {
    isHoveringSidebar,
    isHoveringCanvas,
    isHoveringSidebarArea,
    handleSidebarMouseEnter,
    handleSidebarMouseLeave,
    handleSidebarAreaMouseEnter,
    handleSidebarAreaMouseLeave,
    handleCanvasMouseEnter,
    handleCanvasMouseLeave,
  };
}; 