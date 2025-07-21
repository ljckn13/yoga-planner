import React, { useState, useEffect, useRef } from 'react';

interface CanvasDissolveAnimationProps {
  isDeleting: boolean;
  onAnimationComplete: () => void;
  children: React.ReactNode;
}

export const CanvasDissolveAnimation: React.FC<CanvasDissolveAnimationProps> = ({
  isDeleting,
  onAnimationComplete,
  children,
}) => {

  const [opacity, setOpacity] = useState(1);
  const [height, setHeight] = useState(36); // Initial height in pixels
  const [borderColor, setBorderColor] = useState('transparent');
  const [borderWidth, setBorderWidth] = useState(0); // Track border width
  const animationRef = useRef<{ dissolveInterval?: NodeJS.Timeout; collapseInterval?: NodeJS.Timeout }>({});
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Only start animation once when isDeleting becomes true
    if (isDeleting && !hasStartedRef.current) {
      hasStartedRef.current = true;
      console.log('🎬 Starting canvas dissolve animation');
      
      // Phase 1: Dissolve popup, settings icon, and text (opacity animation)
      const dissolveDuration = 500; // 500ms for dissolve (reduced from 800ms)
      const dissolveStart = Date.now();
      
      animationRef.current.dissolveInterval = setInterval(() => {
        const elapsed = Date.now() - dissolveStart;
        const progress = Math.min(elapsed / dissolveDuration, 1);
        // Apply ease-in-out to the progress
        const easedProgress = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        const newOpacity = 1 - easedProgress;
        
        if (progress % 0.1 < 0.016) { // Log every ~10% progress
          console.log('🎬 Dissolve progress:', progress.toFixed(2), 'opacity:', newOpacity.toFixed(2));
        }
        setOpacity(newOpacity);
        
        if (progress >= 1) {
          if (animationRef.current.dissolveInterval) {
            clearInterval(animationRef.current.dissolveInterval);
            animationRef.current.dissolveInterval = undefined;
          }
          console.log('🎬 Dissolve phase complete, starting collapse phase');
          
          // Phase 2: Collapse height to 1px with red border
          const collapseDuration = 400; // 400ms for collapse (reduced from 600ms)
          const collapseStart = Date.now();
          setBorderColor('rgba(255, 161, 118, 0.5)'); // Same red as drop areas
          setBorderWidth(1); // Add border width
          
          animationRef.current.collapseInterval = setInterval(() => {
            const collapseElapsed = Date.now() - collapseStart;
            const collapseProgress = Math.min(collapseElapsed / collapseDuration, 1);
            // Apply ease-in-out to the collapse progress
            const easedCollapseProgress = collapseProgress < 0.5 
              ? 2 * collapseProgress * collapseProgress 
              : 1 - Math.pow(-2 * collapseProgress + 2, 2) / 2;
            const newHeight = 36 - (easedCollapseProgress * 36); // From 36px to 0px
            
            if (collapseProgress % 0.1 < 0.016) { // Log every ~10% progress
              console.log('🎬 Collapse progress:', collapseProgress.toFixed(2), 'height:', newHeight.toFixed(1));
            }
            // Animate to 0px to prevent any layout jumps
            const finalHeight = collapseProgress >= 0.99 ? 0 : Math.max(newHeight, 0);
            setHeight(finalHeight);
            
            if (collapseProgress >= 1) {
              if (animationRef.current.collapseInterval) {
                clearInterval(animationRef.current.collapseInterval);
                animationRef.current.collapseInterval = undefined;
              }
              console.log('✅ Canvas dissolve animation complete');
              setTimeout(() => {
                onAnimationComplete();
              }, 100); // Increased delay to ensure visibility change takes effect
            }
          }, 16); // ~60fps
        }
      }, 16); // ~60fps
    }
    
    // Reset when not deleting
    if (!isDeleting) {
      hasStartedRef.current = false;
      setOpacity(1);
      setHeight(36);
      setBorderColor('transparent');
      setBorderWidth(0);
    }
  }, [isDeleting, onAnimationComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current.dissolveInterval) {
        clearInterval(animationRef.current.dissolveInterval);
        console.log('🧹 Cleanup: cleared dissolve interval');
      }
      if (animationRef.current.collapseInterval) {
        clearInterval(animationRef.current.collapseInterval);
        console.log('🧹 Cleanup: cleared collapse interval');
      }
    };
  }, []);



  return (
    <div
      style={{
        opacity,
        height: `${height}px`,
        border: `${borderWidth}px solid ${borderColor}`,
        borderRadius: '6px',
        overflow: isDeleting ? 'hidden' : 'visible',
        pointerEvents: isDeleting ? 'none' : 'auto',
        marginBottom: '0px',
        marginTop: '0px',
        padding: '0px',
        transform: isDeleting ? 'scale(0.98)' : 'scale(1)',
        boxSizing: 'border-box',
        minHeight: '0px',
        maxHeight: isDeleting ? '36px' : 'none',
        position: height === 0 ? 'absolute' : 'relative',
        top: height === 0 ? '-9999px' : 'auto',
        left: height === 0 ? '-9999px' : 'auto',
        zIndex: height === 0 ? -1 : 'auto',
      }}
    >
      {children}
    </div>
  );
}; 