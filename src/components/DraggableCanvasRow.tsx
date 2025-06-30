import React from 'react';
import { MoreVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EditableCanvasTitle } from './EditableCanvasTitle';

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
  isLast?: boolean;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: { title?: string }) => void;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
}

export const DraggableCanvasRow: React.FC<DraggableCanvasRowProps> = React.memo(({
  canvas,
  index: _index,
  isCurrent,
  isEditing,
  isLast = false,
  onSwitch,
  onDelete,
  onUpdate,
  onStartEdit,
  onCancelEdit,
}) => {
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

  const canvasElement = (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        width: '100%',
        padding: '0px 8px',
        fontSize: '11px',
        fontWeight: '500',
        fontFamily: 'var(--font-system)',
        borderRadius: '6px',
        border: 'none',
        marginBottom: isLast ? '0px' : '12px',
        backgroundColor: isCurrent 
          ? 'rgba(255, 255, 255, 0.15)' 
          : 'transparent',
        cursor: isDragging ? 'grabbing' : (isEditing ? 'text' : 'pointer'),
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '24px',
        boxSizing: 'border-box',
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
      }}
      {...(isEditing ? {} : attributes)}
      {...(isEditing ? {} : listeners)}
      onMouseLeave={() => {
        // Reset background color on mouse leave
        if (!isCurrent && !isEditing && !isDragging) {
          // Background color will be reset by CSS
        }
      }}
      onMouseEnter={(e) => {
        if (!isCurrent && !isEditing && !isDragging) {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
        }
      }}
      onClick={(e) => {
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
      />
      
      {isCurrent && !isEditing && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(canvas.id);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          style={{
            width: '16px',
            height: '16px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer',
            color: '#885050',
            opacity: 0.5,
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            marginLeft: '8px',
            zIndex: 10,
            position: 'relative',
          }}
          title="Canvas options"
        >
          <MoreVertical size={12} style={{ opacity: 0.5 }} />
        </div>
      )}
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>
      {canvasElement}
    </div>
  );
}); 