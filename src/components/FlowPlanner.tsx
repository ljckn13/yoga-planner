import React, { useRef, useState } from 'react';
import { type Editor } from 'tldraw';
import { useAutoSave } from '../hooks/useAutoSave';
import { useAuthContext } from './AuthProvider';
import { useCanvasManager } from '../hooks/useCanvasManager';
import { CanvasProvider } from '../contexts/CanvasContext';
import { FlowSidebar } from './FlowSidebar';
import { TldrawCanvas } from './TldrawCanvas';
import { flowPlannerStyles, canvasStyles } from '../styles/FlowPlannerStyles';

export const FlowPlanner: React.FC = () => {
  const { user: _user } = useAuthContext();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const editorRef = useRef<Editor | null>(null);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  
  // Canvas and folder management
  const [currentCanvasId, setCurrentCanvasId] = useState<string>('');
  const [editingCanvasId, setEditingCanvasId] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [, setManuallyOpenedFolders] = useState<Set<string>>(new Set());
  
  // Refs for folder management
  const previousCanvasFolderRef = useRef<string | null | undefined>(undefined);
  const isDragInProgressRef = useRef(false);
  const isDeletionInProgressRef = useRef(false);

  // Stabilize the options object to prevent useCanvasManager from being recreated
  const canvasManagerOptions = React.useMemo(() => ({
    userId: _user?.id,
    enableSupabase: !!_user,
    autoCreateDefault: true,
    defaultCanvasTitle: 'Untitled Flow',
    version: '1.0.0',
    isDeletionInProgressRef: isDeletionInProgressRef,
  }), [_user?.id, !!_user, isDeletionInProgressRef]);
  
  // Use canvas manager for folder and canvas operations
  const canvasManager = useCanvasManager(editorInstance, canvasManagerOptions);
  const {
    folders,
    canvases: managerCanvases,
    currentCanvas,
    isLoading,
    updateCanvas: updateCanvasInManager,
    switchCanvas: switchCanvasInManager,
    deleteCanvas: deleteCanvasInManager,
  } = canvasManager;

  // Convert manager canvases to the format expected by the UI
  const canvases = React.useMemo(() => {
    return managerCanvases.map(canvas => ({
      id: canvas.metadata.id,
      title: canvas.metadata.title,
      folderId: canvas.metadata.folderId || null,
      createdAt: canvas.metadata.createdAt,
      sort_order: canvas.metadata.sort_order || 0,
    }));
  }, [managerCanvases]);

  // Auto-save for the current canvas
  useAutoSave(editorInstance, {
    canvasId: currentCanvasId,
  });

  // Set current canvas when available
  React.useEffect(() => {
    if (currentCanvas && currentCanvas.metadata.id !== currentCanvasId) {
      setCurrentCanvasId(currentCanvas.metadata.id);
    }
  }, [currentCanvas, currentCanvasId]);

  // Manage folder open/close state and cleanup when switching between folders
  React.useEffect(() => {
    if (currentCanvasId) {
      const canvas = canvases.find(c => c.id === currentCanvasId);
      const currentFolderId = canvas?.folderId || null;
      
      // Check if we switched from one folder to another folder
      const previousFolderId = previousCanvasFolderRef.current;
      const switchedBetweenFolders = 
        previousFolderId !== undefined && // Not initial load
        previousFolderId !== currentFolderId && // Actually changed
        previousFolderId !== null && // Previous was in a custom folder (not root)
        currentFolderId !== null; // Current is also in a custom folder (not root)
      
      // Update the ref for next time
      previousCanvasFolderRef.current = currentFolderId;
      
      if (switchedBetweenFolders) {
        // Clean up manually opened folders when switching between different folders
        setManuallyOpenedFolders(prev => {
          const newManualSet = new Set<string>();
          
          // Keep manually opened folders that are either:
          // 1. The same as the current canvas folder
          // 2. Empty folders (always allowed to stay open)
          prev.forEach(folderId => {
            if (folderId === currentFolderId) {
              newManualSet.add(folderId); // Keep if same as current canvas folder
            } else {
              const folderCanvases = canvases.filter(c => c.folderId === folderId);
              if (folderCanvases.length === 0) {
                newManualSet.add(folderId); // Keep empty folders
              }
              // Non-empty folders in different location get removed when canvas switches
            }
          });
          
          return newManualSet;
        });
      }
      
      // Apply folder display rules (using setTimeout to ensure manual cleanup happens first)
      // BUT: Don't apply these rules if a drag operation is in progress
      if (!isDragInProgressRef?.current) {
        setTimeout(() => {
          // Double-check drag state after timeout to prevent race conditions
          if (!isDragInProgressRef?.current) {
            if (canvas && canvas.folderId) {
              // Canvas is in a custom folder - apply folder opening rules
              setOpenFolders(prev => {
                const newSet = new Set<string>();
                
                // Rule 1: Always keep the current canvas's folder open
                newSet.add(canvas.folderId!);
                
                // Keep manually opened folders open (user might be browsing)
                setManuallyOpenedFolders(currentManual => {
                  currentManual.forEach(folderId => {
                    newSet.add(folderId);
                  });
                  return currentManual; // Don't change manual state
                });
                
                // Exception: Keep empty folders open regardless
                prev.forEach(folderId => {
                  if (!newSet.has(folderId)) {
                    const folderCanvases = canvases.filter(c => c.folderId === folderId);
                    if (folderCanvases.length === 0) {
                      newSet.add(folderId); // Keep empty folders open
                    }
                  }
                });
                
                return newSet;
              });
            } else {
              // Rule 2: Top-level canvas is active - but be more conservative about closing folders
              // Only close folders if we're certain this is a deliberate switch to a top-level canvas
              // and not just a temporary state during canvas deletion/reload
              const isDeliberateTopLevelSwitch = 
                previousFolderId !== undefined && // Not initial load
                previousFolderId !== null && // Previous was in a folder
                currentFolderId === null && // Current is top-level
                !isLoading && // Not during loading operations
                !isDeletionInProgressRef.current; // Not during deletion operations
              
              if (isDeliberateTopLevelSwitch && !isDragInProgressRef?.current) {
                console.log('📁 Applying folder close rules - deliberate switch to top-level canvas, closing all folders');
                setOpenFolders(_ => {
                  const newSet = new Set<string>();
                  
                  // When deliberately switching to top-level canvas, close all folders
                  // Clear manually opened tracking as well since folders should be closed
                  setManuallyOpenedFolders(() => {
                    return new Set<string>();
                  });
                  
                  return newSet;
                });
              } else if (currentFolderId === null) {
                // For top-level canvases that aren't deliberate switches, just ensure the current folder state is maintained
                // Don't aggressively close folders - let user manually control folder state
                console.log('📁 Top-level canvas active - maintaining current folder state');
              }
            }
          }
        }, 0);
      }
    }
  }, [currentCanvasId, canvases]);

  // Canvas management functions
  const updateCanvas = async (canvasId: string, updates: { title?: string }) => {
    try {
      await updateCanvasInManager(canvasId, updates);
      // Clear editing state after successful update
      setEditingCanvasId(null);
    } catch (error) {
      console.error('Failed to update canvas:', error);
    }
  };

  const handleDeleteCanvas = async (canvasId: string) => {
    if (!confirm('Are you sure you want to delete this canvas?')) {
      return;
    }
    
    // Set deletion flag immediately after confirmation to prevent auto-loading
    isDeletionInProgressRef.current = true;
    console.log('🚫 Deletion in progress - preventing auto-loading');
    
    try {
      await deleteCanvasInManager(canvasId);
      
      // Clear editing state if we were editing this canvas
      if (editingCanvasId === canvasId) {
        setEditingCanvasId(null);
      }
    } catch (error) {
      console.error('Failed to delete canvas:', error);
    } finally {
      // Reset deletion flag after a delay to allow for state updates
      setTimeout(() => {
        isDeletionInProgressRef.current = false;
      }, 1000);
    }
  };

  const handleSwitchCanvas = async (canvasId: string) => {
    try {
      await switchCanvasInManager(canvasId);
      setCurrentCanvasId(canvasId);
    } catch (error) {
      console.error('Failed to switch canvas:', error);
    }
  };

  const handleMount = (mountedEditor: Editor) => {
    editorRef.current = mountedEditor;
    setEditorInstance(mountedEditor);
  };

  // Toggle sidebar handler
  React.useEffect(() => {
    const handler = () => setSidebarVisible(v => !v);
    window.addEventListener('toggleSidebar', handler);
    return () => window.removeEventListener('toggleSidebar', handler);
  }, []);

  // Canvas context value
  const canvasContextValue = React.useMemo(() => ({
    canvases,
    currentCanvasId,
    setCurrentCanvasId,
  }), [canvases, currentCanvasId]);

  return (
    <>
      <style>{flowPlannerStyles}</style>
      <div className="sunrise-bg" style={{ minHeight: '100vh', width: '100vw' }}>
        <CanvasProvider value={canvasContextValue}>
          <div 
            className="tldraw__editor h-screen w-screen"
            style={{
              display: 'flex',
              width: '100vw',
              height: '100vh',
              padding: sidebarVisible ? '0px' : '40px',
              backgroundColor: 'transparent',
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >
            {/* Sidebar */}
            <FlowSidebar
              sidebarVisible={sidebarVisible}
              canvasManager={canvasManager}
              canvases={canvases}
              folders={folders}
              currentCanvasId={currentCanvasId}
              editingCanvasId={editingCanvasId}
              setEditingCanvasId={setEditingCanvasId}
              onSwitchCanvas={handleSwitchCanvas}
              onDeleteCanvas={handleDeleteCanvas}
              onUpdateCanvas={updateCanvas}
              openFolders={openFolders}
              setOpenFolders={setOpenFolders}
              setManuallyOpenedFolders={setManuallyOpenedFolders}
              isDragInProgressRef={isDragInProgressRef}
            />

            {/* Canvas */}
            <div style={canvasStyles.canvas(sidebarVisible)}>
              <TldrawCanvas
                sidebarVisible={sidebarVisible}
                onMount={handleMount}
              />
            </div>
            
            {/* Ghost Button Overlay */}
            <div
              style={canvasStyles.ghostButton(sidebarVisible)}
              onClick={() => setSidebarVisible(v => !v)}
              title={sidebarVisible ? 'Collapse sidebar' : 'Expand sidebar'}
            />
          </div>
        </CanvasProvider>
      </div>
    </>
  );
};