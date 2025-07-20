import { useEffect, useCallback } from 'react';

// Event name for sidebar animation
const SIDEBAR_ANIMATION_EVENT = 'sidebar-animation-start';

// Hook to emit sidebar animation events
export const useSidebarAnimationEmitter = () => {
  const emitSidebarAnimation = useCallback(() => {
    const event = new CustomEvent(SIDEBAR_ANIMATION_EVENT);
    document.dispatchEvent(event);
  }, []);

  return { emitSidebarAnimation };
};

// Hook to listen for sidebar animation events
export const useSidebarAnimationListener = (onSidebarAnimation: () => void) => {
  useEffect(() => {
    const handleSidebarAnimation = () => {
      onSidebarAnimation();
    };

    document.addEventListener(SIDEBAR_ANIMATION_EVENT, handleSidebarAnimation);
    
    return () => {
      document.removeEventListener(SIDEBAR_ANIMATION_EVENT, handleSidebarAnimation);
    };
  }, [onSidebarAnimation]);
}; 