import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EditableCanvasTitle } from './EditableCanvasTitle';
import { CanvasSettingsPopup } from './CanvasSettingsPopup';
import { CanvasDissolveAnimation } from './CanvasDissolveAnimation';
import { useSidebarAnimationListener } from '../hooks/useSidebarAnimationEvents';

interface Canvas {
  id: string;
  title: string;
  folderId?: string | null;
  createdAt?: Date;
}

interface DraggableCanvasRowProps {
  canvas: Canvas;
  index: number;
  isCurrent: boolean;
  isEditing: boolean;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onUpdate: (id: string, updates: { title?: string }) => void;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDeleteAnimationComplete?: () => void;

  resetCanvasCreationFlags: () => void;
}

export const DraggableCanvasRow: React.FC<DraggableCanvasRowProps> = React.memo(({
  canvas,
  isCurrent,
  isEditing,
  onSwitch,
  onDelete,
  onDuplicate,
  onUpdate,
  onStartEdit,
  onCancelEdit,
  onDeleteAnimationComplete,

  resetCanvasCreationFlags,
}) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isHoverTriggered, setIsHoverTriggered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const settingsButtonRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Memoize the sortable data to prevent infinite re-renders
  // Only include essential data that doesn't change during drag operations
  // NOTE: We don't include 'index' to avoid confusion between SortableContext indices and database sort_order
  const sortableData = React.useMemo(() => ({
    type: 'canvas' as const,
    canvas: {
      id: canvas.id,
      title: canvas.title,
      folderId: canvas.folderId,
    },
  }), [canvas.id, canvas.title, canvas.folderId]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: canvas.id,
    data: sortableData,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Handle hover with 800ms delay
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsPopupOpen(true);
      setIsHoverTriggered(true);
    }, 800);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  // Handle click
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsPopupOpen(true);
    setIsHoverTriggered(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Listen for sidebar animation events and close popup
  useSidebarAnimationListener(() => {
    if (isPopupOpen) {
      setIsPopupOpen(false);
      setIsHoverTriggered(false);
    }
  });

    // Handle delete with animation
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this canvas? This is irreversible.')) {
      // Trigger onDelete callback immediately to set deletion flags BEFORE animation
      onDelete(canvas.id);
      setIsDeleting(true);
      setIsPopupOpen(false);
    }
  };

  // Handle animation completion
  const handleAnimationComplete = () => {
    resetCanvasCreationFlags();
    onDelete(canvas.id);
    if (onDeleteAnimationComplete) onDeleteAnimationComplete();
  };

  const canvasElement = (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        width: '100%',
        padding: '6px 8px', // Increased vertical padding to replace margins and ensure full coverage
        fontSize: '11px',
        fontWeight: '500',
        fontFamily: 'var(--font-system)',
        borderRadius: '6px',
        border: 'none',
        marginBottom: '0px', // Remove margins to eliminate blind spots
        backgroundColor: isCurrent 
          ? 'rgba(255, 255, 255, 0.15)' 
          : isHovered 
            ? 'rgba(255, 255, 255, 0.08)' 
            : 'transparent',
        cursor: isDragging ? 'grabbing' : (isEditing ? 'text' : 'pointer'),
        transition: isCurrent ? 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '36px',
        boxSizing: 'border-box',
        minWidth: 0, // Allow flex items to shrink below their content size
        boxShadow: isCurrent 
          ? '-2px -2px 10px rgba(255, 248, 220, 0.8), 3px 3px 10px rgba(255, 69, 0, 0.3)' 
          : 'none',
        backdropFilter: isCurrent ? 'blur(10px)' : 'none',
        WebkitBackdropFilter: isCurrent ? 'blur(10px)' : 'none',
        // Prevent text selection during drag, but allow it during editing
        userSelect: isEditing ? 'text' : 'none',
        WebkitUserSelect: isEditing ? 'text' : 'none',
        MozUserSelect: isEditing ? 'text' : 'none',
        msUserSelect: isEditing ? 'text' : 'none',
        // Prevent dragging of images and other elements
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        // Ensure the element fills the animation container
        height: '100%',
      }}
      {...(isEditing ? {} : attributes)}
      {...(isEditing ? {} : listeners)}
      onMouseLeave={() => {
        setIsHovered(false);
        // Reset background color on mouse leave
        if (!isCurrent && !isEditing && !isDragging) {
          // Background color will be reset by CSS
        }
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        if (!isCurrent && !isEditing && !isDragging) {
          // Background color will be set by CSS hover state
        }
      }}
      onClick={() => {
        if (!isEditing && !isDragging) {
          onSwitch(canvas.id);
        }
      }}
    >
      <EditableCanvasTitle
        title={canvas.title}
        onSave={(newTitle) => {
          onUpdate(canvas.id, { title: newTitle });
        }}
        isEditing={isEditing}
        onStartEdit={() => onStartEdit(canvas.id)}
        onCancelEdit={onCancelEdit}
        className="text-primary flex items-center"
        isCurrent={isCurrent}
      />
      
      {(isCurrent || isHovered) && !isEditing && (
        <div
          ref={settingsButtonRef}
          data-no-dnd="true"
          onClick={handleClick}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: '#885050',
            opacity: isCurrent ? 0.5 : 0.3,
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px',
            marginLeft: '8px',
            zIndex: 20,
            position: 'relative',
            transition: 'opacity 0.2s ease, background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.backgroundColor = 'rgba(136, 80, 80, 0.1)';
            handleMouseEnter();
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = isCurrent ? '0.5' : '0.3';
            e.currentTarget.style.backgroundColor = 'transparent';
            handleMouseLeave();
          }}
          title="Canvas settings"
        >
          <MoreVertical size={12} style={{ opacity: 1 }} />
        </div>
      )}
    </div>
  );

  return (
    <div style={{ 
      position: 'relative',
      margin: '0px',
      padding: '0px',
      lineHeight: '1',
    }}>
      <CanvasDissolveAnimation
        isDeleting={isDeleting}
        onAnimationComplete={handleAnimationComplete}
      >
        {canvasElement}
      </CanvasDissolveAnimation>
      
      {/* Canvas Settings Popup - rendered via portal */}
      <CanvasSettingsPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onRename={() => onStartEdit(canvas.id)}
        onDuplicate={() => onDuplicate(canvas.id)}
        onDelete={handleDelete}
        triggerRef={settingsButtonRef}
        isHoverTriggered={isHoverTriggered}
      />
    </div>
  );
}); 