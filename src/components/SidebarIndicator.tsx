import React, { useState, useEffect } from 'react';

interface SidebarIndicatorProps {
  sidebarVisible: boolean;
  delay?: number; // Delay in milliseconds before showing indicator
}

export const SidebarIndicator: React.FC<SidebarIndicatorProps> = ({
  sidebarVisible,
  delay = 100, // No delay - show immediately
}) => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (sidebarVisible) {
      setShouldShow(false);
    } else {
      // Add delay before showing indicator when sidebar closes
      const timer = setTimeout(() => {
        setShouldShow(true);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [sidebarVisible, delay]);

  if (sidebarVisible) {
    return null; // Don't show indicator when sidebar is visible
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: '18px', // Centered in 40px area: (40px - 2px) / 2 = 19px
        top: '50%',
        transform: 'translateY(-50%)',
        width: '4px',
        height: '30vh',
        backgroundColor: 'rgba(255, 255, 255, 0.4)', // White with 50% opacity
        borderRadius: '100px',
        zIndex: 1001,
        pointerEvents: 'none', // Don't interfere with hover events
        transition: 'opacity 0.8s ease-in-out',
        opacity: shouldShow ? 1 : 0,
      }}
    />
  );
}; 