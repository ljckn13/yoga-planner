import { useState, useEffect, useRef, useCallback } from 'react';
import { useSidebarAnimationEmitter } from './useSidebarAnimationEvents';

interface UseAutoSidebarOptions {
  sidebarVisible: boolean;
  setSidebarVisible: (visible: boolean) => void;
  canvasHoverDelay?: number; // Delay before collapsing when hovering canvas (default: 4000ms)
  sidebarHoverDelay?: number; // Delay before expanding when hovering sidebar area (default: 2000ms)
}

export const useAutoSidebar = ({
  sidebarVisible,
  setSidebarVisible,
  canvasHoverDelay = 100,
  sidebarHoverDelay = 100,
}: UseAutoSidebarOptions) => {
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false);
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);
  const [isHoveringSidebarArea, setIsHoveringSidebarArea] = useState(false);
  
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
    
    if (sidebarVisible) {
      // Start timer to collapse sidebar
      canvasHoverTimeoutRef.current = setTimeout(() => {
        emitSidebarAnimation(); // Emit event before animation
        setSidebarVisible(false);
      }, canvasHoverDelay);
    }
  }, [sidebarVisible, setSidebarVisible, canvasHoverDelay, clearAllTimeouts]);

  const handleCanvasMouseLeave = useCallback(() => {
    setIsHoveringCanvas(false);
    clearAllTimeouts();
  }, [clearAllTimeouts]);

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