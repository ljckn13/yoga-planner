import React, { useState } from 'react';
import { useAuthContext } from './AuthProvider';
import { useCanvasManager } from '../hooks/useCanvasManager';
import { useSidebarDragAndDrop } from '../hooks/useSidebarDragAndDrop';
import { DraggableCanvasRow } from './DraggableCanvasRow';
import { DeleteButton } from './DeleteButton';
import { MoreVertical, X, Folder, FolderOpen } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  rectIntersection,
  pointerWithin,
  closestCenter,
} from '@dnd-kit/core';
import type {
  CollisionDetection,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { CanvasService } from '../services/canvasService';
import type { Folder as FolderType } from '../lib/supabase';

export interface FlowSidebarProps {
  sidebarVisible: boolean;
  canvasManager: ReturnType<typeof useCanvasManager>;
  canvases: Array<{
    id: string;
    title: string;
    folderId?: string | null;
    createdAt?: Date;
    sort_order?: number;
  }>;
  folders: FolderType[];
  currentCanvasId: string;
  editingCanvasId: string | null;
  setEditingCanvasId: (id: string | null) => void;
  onSwitchCanvas: (id: string) => void;
  onDeleteCanvas: (id: string) => void;
  onDuplicateCanvas: (id: string) => void;
  onUpdateCanvas: (id: string, updates: { title?: string }) => void;
  openFolders: Set<string>;
  setOpenFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
  setManuallyOpenedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
  isDragInProgressRef: React.RefObject<boolean>;
}

// Custom collision detection that better handles gaps between canvas rows
const customCollisionDetection: CollisionDetection = (args) => {
  const { active, droppableContainers, pointerCoordinates } = args;
  
  // If we're dragging a canvas, use a more aggressive collision detection
  if (active.data.current?.type === 'canvas') {
    // First try pointerWithin for immediate detection
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    
    // If no pointer collisions, try rectIntersection with expanded bounds
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }
    
    // If still no collisions, try closestCenter with expanded detection radius
    const closestCollisions = closestCenter(args);
    if (closestCollisions.length > 0) {
      return closestCollisions;
    }
    
    // Last resort: find the closest droppable within a reasonable distance
    if (pointerCoordinates && droppableContainers.length > 0) {
      const { x, y } = pointerCoordinates;
      let closestContainer = null;
      let minDistance = Infinity;
      
      for (const container of droppableContainers) {
        const rect = container.rect.current;
        if (rect) {
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          
          // Use a generous detection radius (50px)
          if (distance < 50 && distance < minDistance) {
            minDistance = distance;
            closestContainer = container;
          }
        }
      }
      
      if (closestContainer) {
        return [closestContainer];
      }
    }
  }
  
  // For other types (like folder drops), use rectIntersection
  return rectIntersection(args);
};

// Root folder droppable component
const RootFolderDroppable: React.FC<{
  userRootFolderId: string | null;
  overFolderIds: Set<string>;
  getRootCanvases: () => Array<{
    id: string;
    title: string;
    folderId?: string | null;
    createdAt?: Date;
    sort_order?: number;
  }>;
  currentCanvasId: string;
  editingCanvasId: string | null;
  draggedCanvas: any | null;
  onSwitchCanvas: (id: string) => void;
  onDeleteCanvas: (id: string) => void;
  onDuplicateCanvas: (id: string) => void;
  onUpdateCanvas: (id: string, updates: { title?: string }) => void;
  setEditingCanvasId: (id: string | null) => void;
}> = ({
  userRootFolderId,
  overFolderIds,
  getRootCanvases,
  currentCanvasId,
  editingCanvasId,
  draggedCanvas,
  onSwitchCanvas,
  onDeleteCanvas,
  onDuplicateCanvas,
  onUpdateCanvas,
  setEditingCanvasId,
}) => {
  const { setNodeRef } = useDroppable({
    id: `folder-droppable-${userRootFolderId || 'root'}`,
    data: {
      type: 'folder',
      folderId: userRootFolderId,
    },
  });

  const rootCanvases = getRootCanvases();
  const isOver = overFolderIds.has(userRootFolderId || '');
  
  // Only show drop zone when dragging from a different folder (not from root)
  const isDraggingFromRoot = draggedCanvas && draggedCanvas.folderId === userRootFolderId;
  const shouldShowDropZone = isOver && rootCanvases.length === 0 && draggedCanvas && !isDraggingFromRoot;

  return (
    <div
      ref={setNodeRef}
      style={{ 
        minHeight: rootCanvases.length === 0 ? '36px' : '40px',
        padding: '8px',
        borderRadius: '8px',
        position: 'relative',
        backgroundColor: 'transparent',
        border: '2px solid transparent',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        // Ensure the droppable zone covers the full area including gaps
        marginBottom: '4px',
        // Add drop zone styling when showing drop feedback
        ...(isOver && {
          border: '2px solid rgba(255, 161, 118, 0.5)',
          backgroundColor: 'rgba(255, 161, 118, 0.1)',
        }),
      }}
    >
      {shouldShowDropZone && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '24px', // Match canvas height
          color: '#885050',
          fontSize: '12px',
          fontWeight: '500',
          fontFamily: 'var(--font-system)',
          opacity: 0.8,
        }}>
        </div>
      )}

      {rootCanvases.length === 0 && !shouldShowDropZone && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '24px',
          color: 'transparent',
          fontSize: '12px',
          fontWeight: '500',
          fontFamily: 'var(--font-system)',
          opacity: 0,
        }}>
        </div>
      )}

                {rootCanvases
            .sort((a, b) => {
              if (a.sort_order !== undefined && b.sort_order !== undefined) {
                return a.sort_order - b.sort_order;
              }
              const aDate = new Date(a.createdAt || 0);
              const bDate = new Date(b.createdAt || 0);
              return bDate.getTime() - aDate.getTime();
            })
            .map((canvas, index) => (
              <DraggableCanvasRow
                key={canvas.id}
                canvas={canvas}
                index={index}
                isCurrent={currentCanvasId === canvas.id}
                isEditing={editingCanvasId === canvas.id}
                onSwitch={onSwitchCanvas}
                onDelete={onDeleteCanvas}
                onDuplicate={onDuplicateCanvas}
                onUpdate={(id, updates) => {
                  onUpdateCanvas(id, updates);
                  setEditingCanvasId(null);
                }}
                onStartEdit={setEditingCanvasId}
                onCancelEdit={() => setEditingCanvasId(null)}
              />
            ))}
    </div>
  );
};

// Enhanced FolderComponent with original styling
const FolderComponent: React.FC<{
  folder: FolderType;
  folderCanvases: Array<{
    id: string;
    title: string;
    folderId?: string | null;
    createdAt?: Date;
    sort_order?: number;
  }>;
  isOpen: boolean;
  isEditing: boolean;
  editingFolderName: string;
  activeId: string | null;
  draggedCanvas: any | null;
  currentCanvasId: string;
  editingCanvasId: string | null;
  shouldShowDropFeedback: (folderId: string) => boolean;
  toggleFolder: (id: string) => void;
  handleStartFolderEdit: (id: string, name: string) => void;
  handleCancelFolderEdit: () => void;
  handleSaveFolderEdit: (id: string) => void;
  handleDeleteFolder: (id: string) => void;
  handleSwitchCanvas: (id: string) => void;
  handleDeleteCanvas: (id: string) => void;
  handleDuplicateCanvas: (id: string) => void;
  updateCanvas: (id: string, updates: { title?: string }) => void;
  setEditingCanvasId: (id: string | null) => void;
  handleCreateCanvasInFolder: (id: string) => void;
  setEditingFolderName: (name: string) => void;
  userRootFolderId: string | null;
}> = ({
  folder,
  folderCanvases,
  isOpen,
  isEditing,
  editingFolderName,
  activeId,
  draggedCanvas,
  currentCanvasId,
  editingCanvasId,
  shouldShowDropFeedback,
  toggleFolder,
  handleStartFolderEdit,
  handleCancelFolderEdit,
  handleSaveFolderEdit,
  handleDeleteFolder,
  handleSwitchCanvas,
  handleDeleteCanvas,
  handleDuplicateCanvas,
  updateCanvas,
  setEditingCanvasId,
  handleCreateCanvasInFolder,
  setEditingFolderName,
  userRootFolderId,
}) => {
  // Make the entire folder droppable for folder-to-folder drops
  // BUT disable when dragging folders to allow native DND Kit placeholders
  const { isOver: isOverFolder, setNodeRef: setFolderDroppableRef } = useDroppable({
    id: `folder-droppable-${folder.id}`,
    data: {
      type: 'folder',
      folderId: folder.id,
    },
    disabled: false, // Enable for all drags
  });

  const isOver = isOverFolder;

  // Use the drop feedback from the hook
  const shouldShowDropFeedbackForFolder = shouldShowDropFeedback(folder.id);

  // Determine folder styling based on state
  const shouldShowAddNewButton = isOpen; // Only show "Add new" when open

  // Auto-open folder when dragging over it (when closed) - only for canvas drags
  React.useEffect(() => {
    if (activeId && !isOpen && isOverFolder && draggedCanvas) {
      // Only auto-open when dragging a canvas
      const timer = setTimeout(() => {
        if (activeId && !isOpen && isOverFolder && draggedCanvas) {
          toggleFolder(folder.id);
        }
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [activeId, isOpen, isOverFolder, folder.id, toggleFolder, draggedCanvas]);

  return (
          <div 
        style={{ 
          marginBottom: '16px', // Reduced from 16px to minimize blind spots
          marginLeft: '8px',
          marginRight: '8px', 
          width: 'calc(100% - 16px)',
          overflowX: 'visible',
          minWidth: 0, // Allow flex items to shrink below their content size
        }}
      >
      {/* Folder Wrapper - Neumorphic design like Account Settings */}
              <div 
          ref={setFolderDroppableRef}
          style={{ 
            width: 'calc(100%-12px)',
            borderRadius: '8px',
          // Animate background during folder open/close
          backgroundColor: isOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          backdropFilter: isOpen ? 'blur(10px)' : 'none',
          WebkitBackdropFilter: isOpen ? 'blur(10px)' : 'none',
          boxShadow: isOpen ? '-2px -2px 10px rgba(255, 248, 220, 1), 3px 3px 10px rgba(255, 69, 0, 0.4)' : 'none',
          // Highlight when dragging over (even when closed)
          border: isOver ? '2px solid rgba(255, 161, 118, 0.5)' : '2px solid transparent',
          transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {/* Folder Header */}
        <div
          style={{
            position: 'relative',
            backgroundColor: 'transparent',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            height: '24px',
            padding: '8px',
          }}
        >
          {/* Main folder button */}
          <div
            onClick={() => toggleFolder(folder.id)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleStartFolderEdit(folder.id, folder.name);
            }}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              color: '#885050',
              fontSize: '12px',
              fontWeight: '600',
              fontFamily: 'var(--font-system)',
              cursor: 'pointer',
              transition: 'all 0.1s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: 0,
            }}
            title={`${folder.name} (click to ${isOpen ? 'close' : 'open'})`}
          >
            {isOpen ? (
              <FolderOpen size={16} style={{ 
                opacity: 0.7,
                transform: 'scale(1.05)',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }} />
            ) : (
              <Folder size={16} style={{ 
                opacity: 0.7,
                transform: 'scale(1)',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }} />
            )}
            <span style={{ 
              flex: '1', 
              textAlign: 'left',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {isEditing ? (
                <input
                  type="text"
                  value={editingFolderName}
                  onChange={(e) => setEditingFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveFolderEdit(folder.id);
                    } else if (e.key === 'Escape') {
                      handleCancelFolderEdit();
                    }
                  }}
                  onBlur={() => handleSaveFolderEdit(folder.id)}
                  onFocus={(e) => {
                    // Select all text when focusing (for new folders)
                    e.target.select();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    width: '100%',
                    padding: '0',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: 'transparent',
                    color: '#885050',
                    border: 'none',
                    outline: 'none',
                    fontFamily: 'var(--font-system)',
                  }}
                  autoFocus
                />
              ) : (
                folder.name
              )}
            </span>
          </div>
          
          {/* Add new button - separate from folder button */}
          {!isEditing && (shouldShowAddNewButton || (activeId && shouldShowDropFeedbackForFolder)) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCreateCanvasInFolder(folder.id);
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#885050',
                opacity: 0.7,
                fontSize: '10px',
                fontFamily: 'var(--font-system)',
                padding: '2px 6px',
                flexShrink: 0,
                marginLeft: '8px',
              }}
              title="Create new flow"
            >
              {activeId && shouldShowDropFeedbackForFolder ? 'Drop flow' : 'Add new'}
            </button>
          )}
        </div>

        {/* Folder Contents */}
        <div 
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '0 0 8px 8px',
            maxHeight: isOpen ? '1000px' : '0px',
            overflow: 'hidden',
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
            transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
          }}
        >
          <div style={{
            padding: '0px 0px 8px 0px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0)' : 'translateY(-4px)',
            transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transitionDelay: isOpen ? '0.1s' : '0s',
          }}>
            
            {/* Folder content - canvases */}
            {folderCanvases.length > 0 && (
              <div
                style={{
                  padding: '0px 4px',
                  borderRadius: '6px',
                  position: 'relative',
                  overflow: 'visible', // Allow content to overflow
                  // Always maintain consistent spacing to prevent jumping
                  border: '2px solid transparent',
                  backgroundColor: 'transparent',
                  transition: 'all 0.2s ease',
                  // Add drop zone styling when showing drop feedback for non-empty folders
                  ...(shouldShowDropFeedbackForFolder && {
                    border: '2px solid rgba(255, 161, 118, 0.5)',
                    backgroundColor: 'rgba(255, 161, 118, 0.1)',
                  })
                }}
              >
                <SortableContext 
                  items={folderCanvases.map(canvas => canvas.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  {folderCanvases
                    .sort((a, b) => {
                      if (a.sort_order !== undefined && b.sort_order !== undefined) {
                        return a.sort_order - b.sort_order;
                      }
                      const aDate = new Date(a.createdAt || 0);
                      const bDate = new Date(b.createdAt || 0);
                      return bDate.getTime() - aDate.getTime();
                    })
                    .map((canvas, index) => (
                      <DraggableCanvasRow
                        key={canvas.id}
                        canvas={canvas}
                        index={index}
                        isCurrent={currentCanvasId === canvas.id}
                        isEditing={editingCanvasId === canvas.id}
                        onSwitch={handleSwitchCanvas}
                        onDelete={handleDeleteCanvas}
                        onDuplicate={handleDuplicateCanvas}
                        onUpdate={(id, updates) => {
                          updateCanvas(id, updates);
                          setEditingCanvasId(null); // Ensure editing state is cleared
                        }}
                        onStartEdit={setEditingCanvasId}
                        onCancelEdit={() => setEditingCanvasId(null)}
                      />
                    ))}
                </SortableContext>
              </div>
            )}



            {/* Delete folder button or drop zone - only for empty folders */}
            {folder.id !== userRootFolderId && folderCanvases.length === 0 && (
              <div style={{
                padding: '0px 4px',
              }}>
                {shouldShowDropFeedbackForFolder ? (
                  <div style={{
                    fontSize: '11px',
                    color: '#885050',
                    opacity: 0.6,
                    fontFamily: 'var(--font-system)',
                    textAlign: 'center',
                    border: '2px solid rgba(255, 161, 118, 0.5)',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 161, 118, 0.1)',
                    transition: 'all 0.2s ease',
                    minHeight: '36px',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '28px',
                      color: 'transparent',
                      fontSize: '12px',
                      fontWeight: '500',
                      fontFamily: 'var(--font-system)',
                      opacity: 0,
                      padding: '6px 8px',
                      borderRadius: '6px',
                      boxSizing: 'border-box',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      boxShadow: '-2px -2px 10px rgba(255, 248, 220, 1), 3px 3px 10px rgba(255, 69, 0, 0.4)',
                    }}>
                    </div>
                  </div>
                ) : (
                  <DeleteButton
                    text="Delete folder"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id);
                    }}
                    disabled={!!draggedCanvas}
                    title="Delete folder"
                  />
                )}
              </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
};

export const FlowSidebar: React.FC<FlowSidebarProps> = ({
  sidebarVisible,
  canvasManager,
  canvases,
  folders,
  currentCanvasId,
  editingCanvasId,
  setEditingCanvasId,
  onSwitchCanvas,
  onDeleteCanvas,
  onDuplicateCanvas,
  onUpdateCanvas,
  openFolders,
  setOpenFolders,
  setManuallyOpenedFolders,
  isDragInProgressRef,
}) => {
  const { user, signOut, deleteAccount } = useAuthContext();
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState<string>('');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [userRootFolderId, setUserRootFolderId] = useState<string | null>(null);

  const {
    createFolder,
    updateFolder,
    deleteFolder,
    createCanvas: createCanvasInManager,
    duplicateCanvas: duplicateCanvasInManager,
  } = canvasManager;

  const {
    activeId,
    draggedCanvas,
    overFolderIds,
    shouldFolderShowDropFeedback,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useSidebarDragAndDrop(
    canvasManager,
    canvases,
    setOpenFolders,
    isDragInProgressRef,
    onSwitchCanvas
  );

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Increased from 4 to make dragging less sensitive
        tolerance: 5, // Increased tolerance
        delay: 50, // Increased delay to prevent accidental drags
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get canvases for each folder
  // Get root canvases by checking if they belong to the root folder
  const getRootCanvases = () => {
    return canvases.filter(canvas => canvas.folderId === userRootFolderId);
  };
  const getFolderCanvases = (folderId: string) => canvases.filter(canvas => canvas.folderId === folderId);

  // Canvas management functions
  const handleCreateCanvasInFolder = async (folderId: string) => {
    try {
      const title = 'Untitled Flow';
      const newCanvasId = await createCanvasInManager(title, folderId, true); // Insert at beginning
      
      // Only open folder if not in drag state
      if (!isDragInProgressRef?.current) {
        setOpenFolders(prev => {
          const newSet = new Set(prev);
          newSet.add(folderId);
          return newSet;
        });
      }
      
      // Set editing state and switch to new canvas
      setEditingCanvasId(newCanvasId);
      await onSwitchCanvas(newCanvasId);
    } catch (error) {
      console.error('Failed to create canvas in folder:', error);
    }
  };

  const handleCreateCanvasAtRoot = async () => {
    try {
      const title = 'Untitled Flow';
      const newCanvasId = await createCanvasInManager(title, userRootFolderId, true); // Pass userRootFolderId for top-level canvas
      
      // Set editing state and switch to new canvas
      setEditingCanvasId(newCanvasId);
      await onSwitchCanvas(newCanvasId);
    } catch (error) {
      console.error('Failed to create canvas at root:', error);
    }
  };

  const handleDuplicateCanvas = async (canvasId: string) => {
    try {
      const newCanvasId = await duplicateCanvasInManager(canvasId);
      // Set editing state for the new canvas
      setEditingCanvasId(newCanvasId);
    } catch (error) {
      console.error('Failed to duplicate canvas:', error);
    }
  };

  // Folder management functions
  const handleCreateFolder = async () => {
    if (folders.length >= 10) {
      alert('Max 10 folders per workspace');
      return;
    }
    
    try {
      const folderId = await createFolder('Untitled Folder', undefined, true); // Insert at beginning with default name
      
      // Only open folder if not in drag state
      if (folderId && !isDragInProgressRef?.current) {
        setOpenFolders(prev => {
          const newSet = new Set(prev);
          newSet.add(folderId);
          return newSet;
        });
        
        // Track as manually opened
        setManuallyOpenedFolders(prev => {
          const newSet = new Set(prev);
          newSet.add(folderId);
          return newSet;
        });
        
        // Start editing the folder name immediately
        setEditingFolderId(folderId);
        setEditingFolderName('Untitled Folder');
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder');
    }
  };

  const handleStartFolderEdit = (folderId: string, currentName: string) => {
    setEditingFolderId(folderId);
    setEditingFolderName(currentName);
  };

  const handleCancelFolderEdit = () => {
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  const handleSaveFolderEdit = async (folderId: string) => {
    if (!editingFolderName.trim()) return;
    
    try {
      await updateFolder(folderId, { name: editingFolderName.trim() });
      setEditingFolderId(null);
      setEditingFolderName('');
    } catch (error) {
      console.error('Failed to update folder:', error);
      alert('Failed to update folder');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    // Check if folder is empty
    const folderCanvases = getFolderCanvases(folderId);
    if (folderCanvases.length > 0) {
      alert('Only empty folders can be deleted');
      return;
    }
    
    if (confirm('Are you sure you want to delete this folder?')) {
      try {
        await deleteFolder(folderId);
      } catch (error) {
        console.error('Failed to delete folder:', error);
        alert('Failed to delete folder');
      }
    }
  };

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(folderId)) {
        // Closing a folder
        newSet.delete(folderId);
        
        // Remove from manually opened tracking
        setManuallyOpenedFolders(prevManual => {
          const newManualSet = new Set(prevManual);
          newManualSet.delete(folderId);
          return newManualSet;
        });
      } else {
        // Opening a folder
        newSet.add(folderId);
        
        // Track as manually opened
        setManuallyOpenedFolders(prevManual => {
          const newManualSet = new Set(prevManual);
          newManualSet.add(folderId);
          return newManualSet;
        });
      }
      
      return newSet;
    });
  };

  // Fetch user's root folder ID
  React.useEffect(() => {
    if (user?.id) {
      const fetchRootFolderId = async () => {
        try {
          const rootFolderId = await CanvasService.getRootFolder(user.id);
          setUserRootFolderId(rootFolderId);
        } catch (error) {
          console.error('Error fetching root folder ID:', error);
        }
      };
      fetchRootFolderId();
    }
  }, [user?.id]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        width: sidebarVisible ? '240px' : '0px',
        minWidth: sidebarVisible ? '240px' : '0px',
        maxWidth: sidebarVisible ? '240px' : '0px',
        height: '100vh',
        padding: sidebarVisible ? '40px 8px 0px 8px' : '0',
        backgroundColor: 'transparent',
        border: 'none',
        opacity: sidebarVisible ? 1 : 0,
        pointerEvents: sidebarVisible ? 'auto' : 'none',
        overflowY: 'hidden',
        overflowX: 'visible',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <DndContext 
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Main content area - takes remaining space */}
        <div
          style={{
            width: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'hidden',
            overflowX: 'visible',
            marginBottom: '8px',
            minWidth: 0, // Allow flex items to shrink below their content size
          }}
        >
          {/* Separate SortableContext for root canvases only */}
          <SortableContext 
            items={getRootCanvases().map(canvas => canvas.id)} 
            strategy={verticalListSortingStrategy}
          >
          {/* Fixed Header - Flows Section */}
          <div style={{
            width: '100%',
            flexShrink: 0,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 0',
              marginBottom: '4px',
            }}>
              <span style={{
                fontSize: '13px',
                fontWeight: '500',
                color: '#885050',
                fontFamily: 'var(--font-system)',
              }}>
                Flows
              </span>
              <button
                onClick={handleCreateCanvasAtRoot}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: '#885050',
                  opacity: 0.7,
                  fontSize: '10px',
                  fontFamily: 'var(--font-system)',
                  padding: '2px 4px',
                }}
                title="Create new flow"
              >
                {(() => {
                  const shouldShowDropFlow = activeId && draggedCanvas && overFolderIds.has(userRootFolderId || '');
                  return shouldShowDropFlow ? 'Drop flow' : 'Add new';
                })()}
              </button>
            </div>
          </div>

          {/* Scrollable Content Area with SimpleBar */}
          <SimpleBar style={{
            flex: 1,
            width: '100%',
            height: '100%',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'visible',
            minWidth: 0, // Allow flex items to shrink below their content size
          }}>
            <div style={{
              width: '100%',
              paddingBottom: '16px',
              minWidth: 0, // Allow flex items to shrink below their content size
              boxSizing: 'border-box',
            }}>
              {/* Root folder (top-level canvases) - now droppable like other folders */}
              <RootFolderDroppable
                userRootFolderId={userRootFolderId}
                overFolderIds={overFolderIds}
                getRootCanvases={getRootCanvases}
                currentCanvasId={currentCanvasId}
                editingCanvasId={editingCanvasId}
                draggedCanvas={draggedCanvas}
                onSwitchCanvas={onSwitchCanvas}
                onDeleteCanvas={onDeleteCanvas}
                onDuplicateCanvas={onDuplicateCanvas}
                onUpdateCanvas={onUpdateCanvas}
                setEditingCanvasId={setEditingCanvasId}
              />

              {/* Folders Section */}
              <div style={{ width: '100%' }}>
                {/* Folders Header */}
                {user && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 0',
                    marginBottom: '4px',
                    marginTop: '8px',
                    borderTop: '2px solid rgba(255, 161, 118, 0.2)',
                    paddingTop: '12px',
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#885050',
                      fontFamily: 'var(--font-system)',
                    }}>
                      Folders
                    </span>
                    <button
                      onClick={handleCreateFolder}
                      disabled={folders.length >= 10}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: folders.length >= 10 ? 'not-allowed' : 'pointer',
                        color: '#885050',
                        opacity: folders.length >= 10 ? 0.3 : 0.7,
                        fontSize: '10px',
                        fontFamily: 'var(--font-system)',
                        padding: '2px 6px',
                      }}
                      title={folders.length >= 10 ? 'Max 10 folders' : 'Create folder'}
                    >
                      Add new
                    </button>
                  </div>
                )}

                {/* Folders with their canvases */}
                <div style={{ paddingTop: '8px', paddingBottom: '4px' }}>
                  {folders
                    .sort((a, b) => {
                      // Sort alphabetically by name
                      return a.name.localeCompare(b.name);
                    })
                    .map((folder) => {
                      return (
                        <FolderComponent
                          key={folder.id}
                          folder={folder}
                          folderCanvases={getFolderCanvases(folder.id)}
                          isOpen={openFolders.has(folder.id)}
                          isEditing={editingFolderId === folder.id}
                          editingFolderName={editingFolderName}
                          activeId={activeId}
                          draggedCanvas={draggedCanvas}
                          currentCanvasId={currentCanvasId}
                          editingCanvasId={editingCanvasId}
                          shouldShowDropFeedback={shouldFolderShowDropFeedback}
                          toggleFolder={toggleFolder}
                          handleStartFolderEdit={handleStartFolderEdit}
                          handleCancelFolderEdit={handleCancelFolderEdit}
                          handleSaveFolderEdit={handleSaveFolderEdit}
                          handleDeleteFolder={handleDeleteFolder}
                          handleSwitchCanvas={onSwitchCanvas}
                          handleDeleteCanvas={onDeleteCanvas}
                          handleDuplicateCanvas={handleDuplicateCanvas}
                          updateCanvas={onUpdateCanvas}
                          setEditingCanvasId={setEditingCanvasId}
                          handleCreateCanvasInFolder={handleCreateCanvasInFolder}
                          setEditingFolderName={setEditingFolderName}
                          userRootFolderId={userRootFolderId}
                        />
                      );
                    })}
                </div>
              </div>
            </div>
          </SimpleBar>
          </SortableContext>
        </div>

        <DragOverlay>
          {activeId ? (
            // Only show canvas drag overlay
            draggedCanvas ? (
              <div style={{
                padding: '0px 10px',
                fontSize: '11px',
                fontWeight: '500',
                fontFamily: 'var(--font-system)',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#885050',
                boxShadow: '-2px -2px 10px rgba(255, 248, 220, 0.8), 3px 3px 10px rgba(255, 69, 0, 0.3)',
                cursor: 'pointer',
                minHeight: '28px',
                display: 'flex',
                alignItems: 'center',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                justifyContent: 'space-between',
              }}>
                <span className="text-primary flex items-center">
                  {draggedCanvas.title}
                </span>
              </div>
            ) : null
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Fixed Account Settings at Bottom - Always Visible */}
      {user && (
        <div style={{ 
          width: '100%',
          flexShrink: 0,
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '-2px -2px 10px rgba(255, 248, 220, 1), 3px 3px 10px rgba(255, 69, 0, 0.4)',
          marginBottom: '40px',
          position: 'relative',
        }}>
          <button
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            style={{
              width: '100%',
              padding: '6px 12px',
              backgroundColor: 'transparent',
              color: '#885050',
              border: 'none',
              borderRadius: isAccountMenuOpen ? '8px 8px 0 0' : '8px',
              fontSize: '12px',
              fontWeight: '600',
              fontFamily: 'var(--font-system)',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.1s ease',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              height: '40px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0px',
            }}
            title="Account Settings"
          >
            <span style={{ flex: '1', textAlign: 'left' }}>Account Settings</span>
            <div
              style={{
                width: '20px',
                height: '20px',
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
                padding: '2px',
                marginLeft: '8px',
                zIndex: 20,
                position: 'relative',
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
              title="Account Settings"
            >
              {isAccountMenuOpen ? (
                <X 
                  size={12} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAccountMenuOpen(false);
                  }}
                  style={{ opacity: 1 }} 
                />
              ) : (
                <MoreVertical size={12} style={{ opacity: 1 }} />
              )}
            </div>
          </button>
          
          {/* Expandable Account Settings Content */}
          <div
            style={{
              width: '100%',
              maxHeight: isAccountMenuOpen ? '400px' : '0px',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
              opacity: isAccountMenuOpen ? 1 : 0,
              transform: isAccountMenuOpen ? 'translateY(0)' : 'translateY(-10px)',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '0 0 8px 8px',
            }}
          >
            <div style={{ padding: '4px 8px 8px 8px' }}>
              {/* Email (read-only) */}
              <div style={{ marginBottom: '0px' }}>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '11px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#BD8F8E',
                    border: 'none',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    fontFamily: 'var(--font-system)',
                  }}
                />
              </div>

              {/* Account Actions */}
              <div style={{
                borderTop: '1px solid var(--color-divider)',
                paddingTop: '12px',
              }}>
                <DeleteButton
                  text="Sign Out"
                  onClick={async () => {
                    const result = await signOut();
                    if (result.error) {
                      console.error('Sign out error:', result.error);
                    }
                    setIsAccountMenuOpen(false);
                  }}
                  variant="danger"
                  style={{
                    marginBottom: '6px',
                  }}
                  title="Sign out of your account"
                />

                <DeleteButton
                  text="Delete Account"
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data including canvases and preferences.')) {
                      try {
                        const result = await deleteAccount();
                        if (result.error) {
                          console.error('Account deletion error:', result.error);
                          alert(`Failed to delete account: ${result.error}`);
                        } else {
                          console.log('Account deleted successfully');
                          // User will be automatically redirected to sign-in page
                        }
                      } catch (error) {
                        console.error('Unexpected error during account deletion:', error);
                        alert('An unexpected error occurred while deleting your account');
                      }
                      setIsAccountMenuOpen(false);
                    }
                  }}
                  variant="danger"
                  title="Delete your account permanently"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 