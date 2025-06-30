import React, { useState } from 'react';
import { ChevronRight, MoreVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Folder {
  id: string;
  name: string;
  canvases?: Array<{ id: string; title: string }>;
}

interface DraggableFolderRowProps {
  folder: Folder;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: { name?: string }) => void;
  children?: React.ReactNode;
}

export const DraggableFolderRow: React.FC<DraggableFolderRowProps> = ({
  folder,
  isExpanded,
  onToggle,
  onDelete,
  onUpdate,
  children,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);

  // Sortable data for drag and drop
  const sortableData = React.useMemo(() => ({
    type: 'folder' as const,
    folderId: folder.id,
  }), [folder.id]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: folder.id,
    data: sortableData,
    disabled: isEditing, // Disable dragging when editing
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const folderElement = (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        width: 'calc(100% - 16px)',
        marginLeft: '8px',
        marginRight: '8px',
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '-2px -2px 10px rgba(255, 248, 220, 0.3), 3px 3px 10px rgba(255, 69, 0, 0.2)',
        marginBottom: '10px',
        position: 'relative',
        overflowX: 'visible',
        overflowY: 'hidden',
        transition: 'all 0.2s ease',
        cursor: isDragging ? 'grabbing' : (isEditing ? 'text' : 'pointer'),
        userSelect: isEditing ? 'text' : 'none',
        WebkitUserSelect: isEditing ? 'text' : 'none',
      }}
      {...(isEditing ? {} : attributes)}
      {...(isEditing ? {} : listeners)}
    >
      <div
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: '12px',
          fontWeight: '600',
          fontFamily: 'var(--font-system)',
          color: '#885050',
          cursor: 'pointer',
          transition: 'all 0.1s ease',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '32px',
          borderRadius: isExpanded ? '8px 8px 0 0' : '8px',
        }}
        onMouseEnter={(e) => {
          if (!isEditing) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isEditing) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        onClick={() => {
          if (!isEditing) {
            onToggle(folder.id);
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <ChevronRight
            size={14}
            style={{
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              opacity: 0.7,
              flexShrink: 0,
            }}
          />
          
          <div style={{ flex: 1, minWidth: 0 }}>
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => {
                  if (editName.trim() && editName !== folder.name) {
                    onUpdate(folder.id, { name: editName.trim() });
                  } else {
                    setEditName(folder.name);
                  }
                  setIsEditing(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (editName.trim() && editName !== folder.name) {
                      onUpdate(folder.id, { name: editName.trim() });
                    } else {
                      setEditName(folder.name);
                    }
                    setIsEditing(false);
                  } else if (e.key === 'Escape') {
                    setEditName(folder.name);
                    setIsEditing(false);
                  }
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  outline: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  fontFamily: 'var(--font-system)',
                  color: '#885050',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  width: '100%',
                }}
                autoFocus
              />
            ) : (
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                style={{
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {folder.name}
              </span>
            )}
          </div>
        </div>
        
        {!isEditing && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onDelete(folder.id);
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
              flexShrink: 0,
            }}
            title="Folder options"
          >
            <MoreVertical size={12} style={{ opacity: 0.5 }} />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {folderElement}
      {isExpanded && children && (
        <div style={{ 
          marginLeft: '16px',
          padding: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '0 0 8px 8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}; 