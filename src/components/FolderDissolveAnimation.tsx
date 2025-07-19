import React, { useState, useEffect, useRef } from 'react';

interface FolderDissolveAnimationProps {
  isDeleting: boolean;
  onAnimationComplete: () => void;
  children: React.ReactNode;
  isOpen: boolean;
  hasContent: boolean;
}

export const FolderDissolveAnimation: React.FC<FolderDissolveAnimationProps> = ({
  isDeleting,
  onAnimationComplete,
  children,
  isOpen,
  hasContent,
}) => {
  const [opacity, setOpacity] = useState(1);
  const [height, setHeight] = useState<number | null>(null); // Dynamic height
  const [isDeletionComplete, setIsDeletionComplete] = useState(false);
  const [isDeletionInProgress, setIsDeletionInProgress] = useState(false);
  const animationRef = useRef<{ dissolveInterval?: NodeJS.Timeout; collapseInterval?: NodeJS.Timeout }>({});
  const hasStartedRef = useRef(false);

  // Calculate initial height based on folder state
  const getInitialHeight = () => {
    // For empty folders, we know the exact height is 84px (including padding)
    if (!hasContent) {
      return 84;
    }
    
    // For folders with content, calculate dynamic height
    const headerHeight = 24; // Folder header height
    const headerPadding = 16; // 8px top + 8px bottom padding
    const contentPadding = 8; // Bottom padding of content area
    const borderWidth = 2; // Border width (2px top + 2px bottom)
    
    let totalHeight = headerHeight + headerPadding + contentPadding + (borderWidth * 2);
    
    if (isOpen) {
      // Add gap between header and content (flex gap: '8px')
      totalHeight += 8;
      
      // Add height for canvas content
      const canvasHeight = 36; // Height of each canvas row
      const canvasGap = 8; // Gap between canvases
      const canvasPadding = 8; // 4px left + 4px right padding for canvas container
      const canvasCount = 1; // Assume 1 canvas for height calculation
      
      totalHeight += (canvasHeight * canvasCount) + (canvasGap * (canvasCount - 1)) + canvasPadding;
    }
    
    // Add the margin bottom that creates space between folders
    const folderMarginBottom = isOpen ? 16 : 4; // marginBottom: isOpen ? '16px' : '4px'
    totalHeight += folderMarginBottom;
    
    return totalHeight;
  };

  useEffect(() => {
    // Only start animation once when isDeleting becomes true
    if (isDeleting && !hasStartedRef.current) {
      hasStartedRef.current = true;
      
      const initialHeight = getInitialHeight();
      setHeight(initialHeight);
      
      // Phase 1: Dissolve folder content (opacity animation)
      const dissolveDuration = 600; // 600ms for dissolve
      const dissolveStart = Date.now();
      
      animationRef.current.dissolveInterval = setInterval(() => {
        const elapsed = Date.now() - dissolveStart;
        const progress = Math.min(elapsed / dissolveDuration, 1);
        // Apply ease-in-out to the progress
        const easedProgress = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        const newOpacity = 1 - easedProgress;
        

        setOpacity(newOpacity);
        
                  if (progress >= 1) {
            if (animationRef.current.dissolveInterval) {
              clearInterval(animationRef.current.dissolveInterval);
              animationRef.current.dissolveInterval = undefined;
            }
          
          // Phase 2: Collapse height to 0px with red border
          const collapseDuration = 500; // 500ms for collapse
          const collapseStart = Date.now();
          
          animationRef.current.collapseInterval = setInterval(() => {
            const collapseElapsed = Date.now() - collapseStart;
            const collapseProgress = Math.min(collapseElapsed / collapseDuration, 1);
            // Apply ease-in-out to the collapse progress
            const easedCollapseProgress = collapseProgress < 0.5 
              ? 2 * collapseProgress * collapseProgress 
              : 1 - Math.pow(-2 * collapseProgress + 2, 2) / 2;
            const newHeight = initialHeight - (easedCollapseProgress * initialHeight); // From initial height to 0px
            

            // Animate to 0px to prevent any layout jumps
            const finalHeight = collapseProgress >= 0.95 ? 0 : Math.max(newHeight, 0);
            setHeight(finalHeight);
            
            if (collapseProgress >= 1) {
              if (animationRef.current.collapseInterval) {
                clearInterval(animationRef.current.collapseInterval);
                animationRef.current.collapseInterval = undefined;
              }
              setTimeout(() => {
                setIsDeletionInProgress(true);
                onAnimationComplete();
              }, 150); // Increased delay to ensure smooth transition
            }
          }, 16); // ~60fps
        }
      }, 16); // ~60fps
    }
    
    // Reset when not deleting
    if (!isDeleting) {
      hasStartedRef.current = false;
      setOpacity(1);
      setHeight(null); // Reset to auto height
      setIsDeletionComplete(false);
    }
  }, [isDeleting, onAnimationComplete, isOpen, hasContent]);



  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current.dissolveInterval) {
        clearInterval(animationRef.current.dissolveInterval);
      }
      if (animationRef.current.collapseInterval) {
        clearInterval(animationRef.current.collapseInterval);
      }
    };
  }, []);

  // Effect to handle deletion completion
  useEffect(() => {
    if (isDeletionInProgress && !isDeleting) {
      // Deletion has completed, wait a bit more before removing the element
      setTimeout(() => {
        setIsDeletionComplete(true);
      }, 100);
    }
  }, [isDeletionInProgress, isDeleting]);

  // Don't render if deletion is complete
  if (isDeletionComplete) {
    return null;
  }



  return (
    <div
      style={{
        marginBottom: isOpen ? '16px' : '4px', // Less margin when closed
        marginLeft: '8px',
        marginRight: '8px', 
        width: 'calc(100% - 16px)',
        overflowX: 'visible',
        minWidth: 0, // Allow flex items to shrink below their content size
        opacity,
        height: height !== null ? `${height}px` : 'auto',

        borderRadius: '8px',
        overflow: 'hidden',
        pointerEvents: isDeleting ? 'none' : 'auto',
        marginTop: '0px',
        padding: '0px',
        transform: isDeleting ? 'scale(0.98)' : 'scale(1)',
        boxSizing: 'border-box',
        minHeight: '0px',
        maxHeight: isDeleting ? `${getInitialHeight()}px` : 'none',
        position: height === 0 ? 'absolute' : 'relative',
        top: height === 0 ? '-9999px' : 'auto',
        left: height === 0 ? '-9999px' : 'auto',
        zIndex: height === 0 ? -1 : 'auto',
      }}
    >
      {/* Hide children content immediately when deletion starts to prevent layout jumps */}
      <div style={{
        opacity: isDeleting ? 0 : 1,
        visibility: isDeleting ? 'hidden' : 'visible',
        transition: 'opacity 0.1s ease, visibility 0.1s ease',
      }}>
        {children}
      </div>
    </div>
  );
}; 