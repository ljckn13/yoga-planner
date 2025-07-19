import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RenameIcon, DuplicateIcon, DeleteIcon } from '../assets/svg';

interface IconButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

const IconButton: React.FC<IconButtonProps> = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    style={{
      width: '24px',
      height: '24px',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      color: '#885050',
      opacity: 0.5,
      fontSize: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4px',
      transition: 'opacity 0.2s ease, background-color 0.2s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.opacity = '1';
      e.currentTarget.style.backgroundColor = 'rgba(136, 80, 80, 0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.opacity = '0.5';
      e.currentTarget.style.backgroundColor = 'transparent';
    }}
    title={title}
  >
    {children}
  </button>
);

interface CanvasSettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  isHoverTriggered: boolean;
}

export const CanvasSettingsPopup: React.FC<CanvasSettingsPopupProps> = ({
  isOpen,
  onClose,
  onRename,
  onDuplicate,
  onDelete,
  triggerRef,
  isHoverTriggered,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate position when popup opens
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popupWidth = 76; // 3 buttons * 20px + 2 gaps * 4px + 4px padding * 2
      const viewportWidth = window.innerWidth;
      
      // Check if popup would go off-screen to the right
      const wouldGoOffScreen = triggerRect.right + 16 + popupWidth > viewportWidth;
      
      setPosition({
        top: triggerRect.top - 5.5,
        left: wouldGoOffScreen 
          ? triggerRect.left - 16 - popupWidth // Position to the left of trigger
          : triggerRect.right + 16, // Position to the right of trigger
      });
    }
  }, [isOpen, triggerRef]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, triggerRef]);

  // Handle hover behavior for hover-triggered popups
  useEffect(() => {
    if (!isHoverTriggered || !isOpen) return;

    let closeTimeout: NodeJS.Timeout | null = null;

    const handleMouseLeave = () => {
      // Add delay before closing
      closeTimeout = setTimeout(() => {
        onClose();
      }, 300); // 300ms delay
    };

    const handleMouseEnter = () => {
      // Clear timeout if mouse enters again
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }
    };

    const popupElement = popupRef.current;
    const triggerElement = triggerRef.current;

    if (popupElement && triggerElement) {
      popupElement.addEventListener('mouseleave', handleMouseLeave);
      popupElement.addEventListener('mouseenter', handleMouseEnter);
      triggerElement.addEventListener('mouseleave', handleMouseLeave);
      triggerElement.addEventListener('mouseenter', handleMouseEnter);

      return () => {
        popupElement.removeEventListener('mouseleave', handleMouseLeave);
        popupElement.removeEventListener('mouseenter', handleMouseEnter);
        triggerElement.removeEventListener('mouseleave', handleMouseLeave);
        triggerElement.removeEventListener('mouseenter', handleMouseEnter);
        if (closeTimeout) {
          clearTimeout(closeTimeout);
        }
      };
    }
  }, [isOpen, isHoverTriggered, onClose, triggerRef]);

  if (!isOpen) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const popupContent = (
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '-2px -2px 10px rgba(255, 248, 220, 0.8), 3px 3px 10px rgba(255, 69, 0, 0.3)',
        borderRadius: '6px',
        padding: '0 4px',
        display: 'flex',
        flexDirection: 'row',
        gap: '4px',
        zIndex: 1000,
        border: '1px solid var(--color-panel-contrast)',
        height: '36px',
        alignItems: 'center',
      }}
    >
      <IconButton onClick={() => handleAction(onRename)} title="Rename canvas">
        <RenameIcon style={{ width: '16px', height: '16px' }} />
      </IconButton>

      <IconButton onClick={() => handleAction(onDuplicate)} title="Duplicate canvas">
        <DuplicateIcon style={{ width: '16px', height: '16px' }} />
      </IconButton>

      <IconButton onClick={() => handleAction(onDelete)} title="Delete canvas">
        <DeleteIcon style={{ width: '16px', height: '16px' }} />
      </IconButton>
    </div>
  );

  // Use portal to render outside of scrollable container
  return createPortal(popupContent, document.body);
}; 