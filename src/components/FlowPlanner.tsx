import React, { useLayoutEffect, useRef, createContext, useContext } from 'react';
import {
  Tldraw,
  TldrawUiMenuItem,
  TldrawUiMenuGroup,
  TldrawUiMenuSubmenu,
  useIsToolSelected,
  useTools,
  type TLComponents,
  type TLUiAssetUrlOverrides,
  type TLUiOverrides,
  useEditor,
  useValue,
  useIsDarkMode,
  DefaultMainMenu,
  DefaultMainMenuContent,
  DefaultToolbar,
  DefaultToolbarContent,
  type Editor,
  getSnapshot,
} from 'tldraw';
import 'tldraw/tldraw.css';
import { YogaPoseShapeUtil, YogaPoseTool, YogaPoseSvgShapeUtil } from '../shapes';
import { YogaPosePanel } from './YogaPosePanel';
import { getPoseState } from '../utils/pose-state';
import { yogaCategories } from '../assets/yoga-flows';
import { useCloudSync } from '../hooks/useCloudSync';
import { useAuthContext } from './AuthProvider';

// Temporary debug function to clear localStorage
const clearLocalStorage = () => {
  console.log('🧹 Clearing localStorage...');
  localStorage.clear();
  console.log('✅ localStorage cleared');
  window.location.reload();
};

// Add to window for easy access
if (typeof window !== 'undefined') {
  (window as any).clearLocalStorage = clearLocalStorage;
}

// Canvas context to share state between components
interface CanvasContextType {
  canvases: Array<{id: string, title: string}>;
  currentCanvasId: string;
  setCanvases: React.Dispatch<React.SetStateAction<Array<{id: string, title: string}>>>;
  setCurrentCanvasId: React.Dispatch<React.SetStateAction<string>>;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

// Hook to use canvas context
function useCanvasContext() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvasContext must be used within a CanvasProvider');
  }
  return context;
}

// Custom grid component with subtle dots
const CustomGrid = ({ size, ...camera }: any) => {
  const editor = useEditor()
  const screenBounds = useValue('screenBounds', () => editor.getViewportScreenBounds(), [])
  const devicePixelRatio = useValue('dpr', () => editor.getInstanceState().devicePixelRatio, [])
  const isDarkMode = useIsDarkMode()
  const canvas = useRef<HTMLCanvasElement>(null)

  useLayoutEffect(() => {
    if (!canvas.current) return
    const canvasW = screenBounds.w * devicePixelRatio
    const canvasH = screenBounds.h * devicePixelRatio
    canvas.current.width = canvasW
    canvas.current.height = canvasH

    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvasW, canvasH)

    // Use a larger grid size for more distance between dots
    const gridSize = size * 2

    const pageViewportBounds = editor.getViewportPageBounds()
    const startPageX = Math.ceil(pageViewportBounds.minX / gridSize) * gridSize
    const startPageY = Math.ceil(pageViewportBounds.minY / gridSize) * gridSize
    const endPageX = Math.floor(pageViewportBounds.maxX / gridSize) * gridSize
    const endPageY = Math.floor(pageViewportBounds.maxY / gridSize) * gridSize
    const numRows = Math.round((endPageY - startPageY) / gridSize)
    const numCols = Math.round((endPageX - startPageX) / gridSize)

    // More subtle dot color
    ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'

    // Draw dots at grid intersections
    for (let row = 0; row <= numRows; row++) {
      for (let col = 0; col <= numCols; col++) {
        const pageX = startPageX + col * gridSize
        const pageY = startPageY + row * gridSize
        const canvasX = (pageX + camera.x) * camera.z * devicePixelRatio
        const canvasY = (pageY + camera.y) * camera.z * devicePixelRatio
        
        // Draw a small dot
        ctx.beginPath()
        ctx.arc(canvasX, canvasY, 1 * devicePixelRatio, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
  }, [screenBounds, camera, size, devicePixelRatio, editor, isDarkMode])

  return <canvas className="tl-grid" ref={canvas} />
}

// Custom hook to track current canvas title
function useCurrentCanvasTitle(editor: Editor | null) {
  const [canvasTitle, setCanvasTitle] = React.useState('Untitled Canvas');
  const { currentCanvasId } = useCanvasContext();
  
  React.useEffect(() => {
    if (!editor) return;
    
    const updateCanvasTitle = () => {
      try {
        const canvasList = localStorage.getItem('yoga_flow_canvas_list');
        if (canvasList) {
          const canvases = JSON.parse(canvasList);
          // Find the current canvas by currentCanvasId
          const currentCanvas = canvases.find((canvas: any) => canvas.id === currentCanvasId);
          
          if (currentCanvas?.title) {
            setCanvasTitle(currentCanvas.title);
          } else {
            setCanvasTitle('Untitled Canvas');
          }
        }
      } catch (err) {
        console.error('Error updating canvas title:', err);
        setCanvasTitle('Untitled Canvas');
      }
    };
    
    // Update immediately
    updateCanvasTitle();
    
    // Set up an interval to check for changes
    const interval = setInterval(updateCanvasTitle, 50); // More frequent updates
    
    // Also listen for storage events to catch changes from other components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'yoga_flow_canvas_list') {
        updateCanvasTitle();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [editor, currentCanvasId]); // Add currentCanvasId to dependencies
  
  return canvasTitle;
}

// Custom page menu that shows canvas title instead of page name
function CustomPageMenu() {
  const editor = useEditor();
  const canvasTitle = useCurrentCanvasTitle(editor);

  return (
    <div className="tlui-page-menu">
      <div className="tlui-page-menu__header">
        <div 
          className="tlui-page-menu__header__title tlui-text"
          style={{
            width: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'inherit'
          }}
        >
          {canvasTitle}
        </div>
      </div>
    </div>
  );
}

// Custom main menu with canvas management
function CustomMainMenu() {
  const { canvases, currentCanvasId, setCanvases, setCurrentCanvasId } = useCanvasContext();

  const handleRenameCanvas = async () => {
    const currentCanvas = canvases.find(c => c.id === currentCanvasId);
    if (!currentCanvas) return;
    
    const newTitle = prompt('Enter new title:', currentCanvas.title);
    if (newTitle && newTitle.trim() && newTitle !== currentCanvas.title) {
      console.log('Renaming canvas from', currentCanvas.title, 'to', newTitle.trim());
      setCanvases(prev => {
        const updated = prev.map(c => 
          c.id === currentCanvasId 
            ? { ...c, title: newTitle.trim() }
            : c
        );
        console.log('Updated canvases after rename:', updated);
        return updated;
      });
    }
  };

  const handleDeleteCanvas = async () => {
    if (canvases.length <= 1) {
      alert('Cannot delete the last canvas. Create a new one first.');
      return;
    }
    
    const currentCanvas = canvases.find(c => c.id === currentCanvasId);
    if (!currentCanvas) return;
    
    if (confirm(`Are you sure you want to delete "${currentCanvas.title}"?`)) {
      console.log('Deleting canvas:', currentCanvas);
      const newCanvases = canvases.filter(c => c.id !== currentCanvasId);
      console.log('Updated canvases after delete:', newCanvases);
      setCanvases(newCanvases);
      setCurrentCanvasId(newCanvases[0].id);
    }
  };

  const handleSwitchCanvas = async (canvasId: string) => {
    console.log('Switching to canvas:', canvasId);
    setCurrentCanvasId(canvasId);
  };

  return (
    <DefaultMainMenu>
      <TldrawUiMenuGroup id="canvas-management">
        <TldrawUiMenuItem
          id="create-canvas"
          label="Create New Canvas"
          icon="plus"
          onSelect={() => {
            // This will be handled by the main component's handleCreateCanvas
            // We'll trigger it through a custom event
            window.dispatchEvent(new CustomEvent('createNewCanvas'));
          }}
        />
        {canvases.length > 1 && (
          <TldrawUiMenuSubmenu
            id="switch-canvas"
            label="Switch Canvas"
            size="small"
          >
            {canvases.map((canvas) => (
              <TldrawUiMenuItem
                key={canvas.id}
                id={`switch-to-${canvas.id}`}
                label={canvas.title}
                icon={currentCanvasId === canvas.id ? "check" : "blank"}
                onSelect={() => handleSwitchCanvas(canvas.id)}
              />
            ))}
          </TldrawUiMenuSubmenu>
        )}
        {canvases.length > 0 && (
          <>
            <TldrawUiMenuItem
              id="rename-canvas"
              label="Rename Canvas"
              icon="edit"
              onSelect={handleRenameCanvas}
            />
            {canvases.length > 1 && (
              <TldrawUiMenuItem
                id="delete-canvas"
                label="Delete Canvas"
                icon="trash"
                onSelect={handleDeleteCanvas}
              />
            )}
          </>
        )}
      </TldrawUiMenuGroup>
      <DefaultMainMenuContent />
    </DefaultMainMenu>
  );
}

// [1] UI Overrides to add yoga pose tool to the context and remove unwanted tools
const uiOverrides: TLUiOverrides = {
  tools(editor, tools) {
    // Only keep the tools we want
    const allowedTools: any = {
      select: tools.select,
      text: tools.text,
      yogaPose: {
      id: 'yoga-pose-tool',
      icon: 'yoga-icon',
      label: 'Yoga Pose',
      kbd: 'y',
      onSelect: () => {
        editor.setCurrentTool('yoga-pose-tool')
      },
    }
    }
    
    // Add other tools only if they exist
    if (tools.frame) allowedTools.frame = tools.frame
    // if (tools.hand) allowedTools.hand = tools.hand
    if (tools.media) allowedTools.media = tools.media
    if (tools.asset) allowedTools.asset = tools.asset
    if (tools.draw) allowedTools.draw = tools.draw
    // if (tools.highlight) allowedTools.highlight = tools.highlight
    // if (tools.eraser) allowedTools.eraser = tools.eraser
    if (tools.note) allowedTools.note = tools.note
    
    return allowedTools
  },
  // Enable style panel for yoga pose tool
  actions(editor, actions) {
    return {
      ...actions,
      'toggle-quick-styles': {
        id: 'toggle-quick-styles',
        label: 'Toggle Quick Styles',
        kbd: '$mod+shift+s',
        onSelect: () => {
          editor.setCurrentTool('select')
        },
      },
    }
  },
}

// [2] Components to override toolbar and keyboard shortcuts  
const createComponents = (): TLComponents => ({
  Grid: CustomGrid,
  MainMenu: CustomMainMenu,
  PageMenu: CustomPageMenu,
  Toolbar: (props) => {
    const tools = useTools()
    const editor = useEditor()
    const isYogaPoseSelected = useIsToolSelected(tools['yogaPose'])
    const [activeCategory, setActiveCategory] = React.useState<number>(0) // Use number for Category enum
    const [isHoveringPoseTool, setIsHoveringPoseTool] = React.useState(false)
    const { user: _user } = useAuthContext()
    
    return (
      <>
        {/* Floating YogaPosePanel above the toolbar */}
        {isYogaPoseSelected && (
          <div 
            className="tlui-panel"
            style={{
              position: 'fixed',
              bottom: '64px', // 8px (toolbar bottom) + 40px (toolbar height) + 8px (gap) + 8px (extra up)
              left: '50%',
              transform: 'translateX(-50%)',
              width: '440px', // Fixed width to match toolbar
              zIndex: 9999,
              maxHeight: '300px',
              overflow: 'hidden',
              pointerEvents: 'auto'
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
          <YogaPosePanel 
            onPoseSelect={(pose) => {
              getPoseState().setSelectedPose(pose);
            }}
            selectedPose={getPoseState().selectedPose}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>
        )}

        <div style={{ 
          width: '440px',
          '--tlui-toolbar-width': '440px',
          position: 'fixed',
          bottom: '8px', // 8px gap from bottom
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000
        } as React.CSSProperties}>
          <style>
            {`
              /* Force toolbar width to 440px */
              div[style*="width: 440px"] .tlui-toolbar {
                width: 440px !important;
              }
              div[style*="width: 440px"] .tlui-toolbar__tools {
                width: 440px !important;
                max-width: 440px !important;
              }
              div[style*="width: 440px"] .tlui-toolbar__tools > * {
                flex: 1 !important;
                width: 100% !important;
              }
              div[style*="width: 440px"] .tlui-toolbar__tools .tlui-button {
                width: 100% !important;
                flex: 1 !important;
              }
              div[style*="width: 440px"] .tlui-toolbar__tools .tlui-button[data-state="selected"]::after,
              div[style*="width: 440px"] .tlui-toolbar__tools .tlui-button[aria-pressed="true"]::after,
              div[style*="width: 440px"] .tlui-toolbar__tools .tlui-button.tlui-button__selected::after {
                background-color: hsl(0 0% 94%) !important;
              }
              div[style*="width: 440px"] .tlui-toolbar__tools .tlui-button[data-state="selected"],
              div[style*="width: 440px"] .tlui-toolbar__tools .tlui-button[aria-pressed="true"],
              div[style*="width: 440px"] .tlui-toolbar__tools .tlui-button.tlui-button__selected {
                color: var(--color-text) !important;
              }
            `}
          </style>
          <DefaultToolbar {...props}>
            {/* Custom Yoga Pose Tool Button - Always visible */}
            <div style={{ padding: '0 4px' }}>
              <button
                onMouseEnter={() => setIsHoveringPoseTool(true)}
                onMouseLeave={() => setIsHoveringPoseTool(false)}
                onClick={() => {
                  if (isYogaPoseSelected) {
                    // Deactivate yoga pose tool and switch to select
                    editor.setCurrentTool('select')
                  } else {
                    // Activate yoga pose tool
                    editor.setCurrentTool('yoga-pose-tool')
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  backgroundColor: isYogaPoseSelected 
                    ? (isHoveringPoseTool ? 'hsl(0 0% 96.1%)' : 'hsl(0 0% 94%)') 
                    : (isHoveringPoseTool ? 'hsl(0 0% 96.1%)' : 'transparent'),
                  color: 'var(--color-text)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                  position: 'relative'
                }}
                title={isYogaPoseSelected ? 'Exit Yoga Pose Tool' : 'Yoga Pose Tool'}
              >
                {isYogaPoseSelected && isHoveringPoseTool ? (
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                ) : (
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 400 400" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="23.7138" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M53.3214 378.29C48.7952 378.376 25.8009 387.388 22.9267 381.718C11.7629 359.699 52.2853 324.225 63.1906 314.427C131.032 253.479 206.364 210.474 293.345 230.136C309.62 233.814 327.128 241.669 332.663 262.742C339.019 286.938 345.673 318.52 345.673 344.127C345.673 365.685 342.055 365.403 355.522 356.745C362.318 352.376 379.465 344.851 386.119 353.531C387.921 355.882 389.14 363.509 386.361 365.336M225.448 136.499C221.027 120.076 225.196 170.556 225.903 187.563C226.163 193.806 229.062 225.803 216.615 225.803M197.983 52.5269C175.092 45.1433 189.055 115.596 219.618 119.631C280.084 127.612 235.811 23.6007 197.983 49.1472M108.083 30.9972C97.8879 59.1956 127.586 98.8249 141.33 121.691C151.127 137.99 198.523 176.926 217.999 182.983M289.465 12.4131C302.589 5.51314 299.323 87.2355 298.894 93.8838C297.479 115.796 291.371 140.149 279.132 158.546C273.706 166.703 235.013 184.237 230.484 192.693"/>
                  </svg>
                )}
              </button>
            </div>
            
            {isYogaPoseSelected ? (
              // Show categories when yoga pose tool is selected
              <div style={{ 
                display: 'flex', 
                gap: '0px', 
                padding: '4px 4px', 
                alignItems: 'center',
                flex: 1,
                minHeight: '40px'
              }}>
                {yogaCategories.map((category) => (
                  <button
                    key={category.category}
                    onClick={() => setActiveCategory(category.category)}
                    style={{ 
                      whiteSpace: 'nowrap',
                      fontSize: '12px',
                      padding: '6px 12px',
                      backgroundColor: activeCategory === category.category ? 'hsl(0 0% 94%)' : 'transparent',
                      color: 'var(--color-text)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      flex: 1,
                      margin: '0 2px'
                    }}
                    onMouseEnter={(e) => {
                      if (activeCategory !== category.category) {
                        e.currentTarget.style.backgroundColor = 'hsl(0 0% 96.1%)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeCategory !== category.category) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {category.title}
                  </button>
                ))}
              </div>
            ) : (
              // Show normal tools when yoga pose tool is not selected
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                flex: 1,
                minHeight: '40px',
                padding: '0 4px'
              }}>
                <DefaultToolbarContent />
              </div>
            )}
          </DefaultToolbar>
        </div>
      </>
    )
  },
})

// [3] Custom asset URLs for our yoga icon
export const customAssetUrls: TLUiAssetUrlOverrides = {
  icons: {
    'yoga-icon': '/yoga-pose-icon.svg',
  },
}

// [4] Custom tools and shapes
const customTools = [YogaPoseTool]
const customShapeUtils = [YogaPoseShapeUtil, YogaPoseSvgShapeUtil]

export const FlowPlanner: React.FC = () => {
  // Simple state for canvas list - shared between menu and left panel
  const [canvases, setCanvases] = React.useState<Array<{id: string, title: string}>>([]);
  const [currentCanvasId, setCurrentCanvasId] = React.useState<string>('');
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = React.useState(false);
  const editorRef = React.useRef<Editor | null>(null);
  const { user: _user, signOut } = useAuthContext();

  // Use cloud sync for the current canvas
  const { store: syncStore, getSyncStatus } = useCloudSync({
    roomId: currentCanvasId || 'default',
    userId: _user?.id,
  });
  
  // Load canvases from localStorage on mount
  React.useEffect(() => {
    console.log('Loading canvases from localStorage...');
    const savedCanvases = localStorage.getItem('yoga_flow_canvas_list');
    console.log('Saved canvases:', savedCanvases);
    
    if (savedCanvases) {
      try {
        const parsed = JSON.parse(savedCanvases);
        console.log('Parsed canvases:', parsed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCanvases(parsed);
          // Set current canvas to the first one, or the last one that was active
          const lastActiveCanvas = localStorage.getItem('yoga_flow_current_canvas');
          console.log('Last active canvas:', lastActiveCanvas);
          if (lastActiveCanvas && parsed.find(c => c.id === lastActiveCanvas)) {
            setCurrentCanvasId(lastActiveCanvas);
          } else {
            setCurrentCanvasId(parsed[0].id);
          }
        } else {
          // No valid saved canvases, create default
          const defaultCanvases = [{ id: 'default', title: 'Yoga Flow' }];
          setCanvases(defaultCanvases);
          setCurrentCanvasId('default');
        }
      } catch (err) {
        console.error('Error loading canvases:', err);
        // Error loading, create default
        const defaultCanvases = [{ id: 'default', title: 'Yoga Flow' }];
        setCanvases(defaultCanvases);
        setCurrentCanvasId('default');
      }
    } else {
      // No saved data, create default
      const defaultCanvases = [{ id: 'default', title: 'Yoga Flow' }];
      setCanvases(defaultCanvases);
      setCurrentCanvasId('default');
    }
    
    setIsInitialized(true);
  }, []);

  // Save canvases to localStorage whenever they change (but only after initialization)
  React.useEffect(() => {
    if (isInitialized) {
      console.log('Saving canvases to localStorage:', canvases);
      localStorage.setItem('yoga_flow_canvas_list', JSON.stringify(canvases));
    }
  }, [canvases, isInitialized]);

  // Save current canvas ID whenever it changes (but only after initialization)
  React.useEffect(() => {
    if (isInitialized) {
      console.log('Saving current canvas ID:', currentCanvasId);
      localStorage.setItem('yoga_flow_current_canvas', currentCanvasId);
    }
  }, [currentCanvasId, isInitialized]);

  // Listen for createNewCanvas events from the main menu
  React.useEffect(() => {
    const handleCreateNewCanvas = () => {
      handleCreateCanvas();
    };

    window.addEventListener('createNewCanvas', handleCreateNewCanvas);
    return () => {
      window.removeEventListener('createNewCanvas', handleCreateNewCanvas);
    };
  }, []);

  // Handle creating a new canvas
  const handleCreateCanvas = async () => {
    console.log('Create New Canvas button clicked!');
    const title = prompt('Enter canvas title:') || 'Untitled Canvas';
    const newCanvas = {
      id: `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim()
    };
    console.log('Creating new canvas:', newCanvas);
    
    // Update the canvas list
    setCanvases(prev => {
      const updated = [...prev, newCanvas];
      console.log('Updated canvases after create:', updated);
      return updated;
    });
    
    // Switch to new canvas
    setCurrentCanvasId(newCanvas.id);
  };

  // Simple canvas manager with cloud sync
  const SimpleCanvasManager = () => {
    const syncStatus = getSyncStatus();
    
    // Sync status indicator
    const SyncIndicator = () => {
      const getStatusColor = () => {
        if (syncStatus.hasError) return 'text-red-600';
        if (syncStatus.isConnected) return 'text-green-600';
        if (syncStatus.isSyncing) return 'text-blue-600';
        return 'text-yellow-600';
      };

      const getStatusText = () => {
        if (syncStatus.hasError) return 'Sync Error';
        if (syncStatus.isConnected) return 'Synced';
        if (syncStatus.isSyncing) return 'Syncing...';
        return 'Connecting...';
      };

      return (
        <div className="fixed top-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                syncStatus.isConnected ? 'bg-green-500' :
                syncStatus.isSyncing ? 'bg-blue-500' :
                syncStatus.hasError ? 'bg-red-500' :
                'bg-yellow-500'
              }`} />
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
            
            {syncStatus.error && (
              <span className="text-xs text-red-500">
                {syncStatus.error.message}
              </span>
            )}
          </div>
        </div>
      );
    };

    return <SyncIndicator />;
  };

  const handleMount = (mountedEditor: Editor) => {
    // Store the editor reference for later use
    editorRef.current = mountedEditor;
    
    mountedEditor.updateInstanceState({ isGridMode: true });
    
    // Add debug listener for export operations
    const unsubscribe = mountedEditor.store.listen(() => {
      // This will help us track when the editor state changes (including during exports)
      const currentState = getSnapshot(mountedEditor.store);
      // Access shapes from the TLEditorSnapshot
      const snapshot = currentState as any;
      const yogaPoseShapes = Object.values(snapshot.shapes || {}).filter(
        (shape: any) => shape && shape.typeName === 'shape' && shape.type === 'yoga-pose-svg'
      );
      
      if (yogaPoseShapes.length > 0) {
        console.log('🎨 Editor state updated, yoga pose shapes found:', yogaPoseShapes.length);
      }
    });
    
    // Ensure only one page per canvas - remove extra pages
    const pages = mountedEditor.getPages();
    if (pages.length > 1) {
      const currentPageId = mountedEditor.getCurrentPageId();
      pages.forEach(page => {
        if (page.id !== currentPageId) {
          mountedEditor.deletePage(page.id);
        }
      });
    }
    
    console.log('🚀 Editor mounted with debug logging enabled');
  };

  const components = createComponents();

  // Canvas context value
  const canvasContextValue: CanvasContextType = {
    canvases,
    currentCanvasId,
    setCanvases,
    setCurrentCanvasId,
  };

  return (
    <CanvasContext.Provider value={canvasContextValue}>
      <div 
        className="tldraw__editor h-screen w-screen"
        style={{
          display: 'flex',
          width: '100vw',
          height: '100vh',
          padding: '40px 40px 40px 8px',
          backgroundColor: 'var(--color-panel)',
          gap: '8px',
          boxSizing: 'border-box'
        }}
      >
        {/* Canvas Title Menu - Left Side */}
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            minWidth: '200px',
            maxWidth: '200px',
            height: '100%',
            padding: '0',
            backgroundColor: 'transparent',
            border: 'none',
            gap: '8px'
          }}
        >
          {/* Canvas List and Create Button Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            {/* Create New Canvas Button - At top */}
            <button
              onClick={handleCreateCanvas}
              style={{
                width: '100%',
                padding: '6px 12px',
                backgroundColor: 'hsl(0 0% 98%)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-panel-contrast)',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '500',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'hsl(0 0% 96.1%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'hsl(0 0% 98%)';
              }}
              title="Create New Canvas"
            >
              + Create New Canvas
            </button>

            {/* Canvas List - Sorted alphabetically */}
            {canvases
              .sort((a, b) => a.title.localeCompare(b.title))
              .map((canvas) => (
              <button
                key={canvas.id}
                onClick={() => {
                  setCurrentCanvasId(canvas.id);
                }}
                style={{
                  width: '100%',
                  padding: '6px 12px',
                  backgroundColor: currentCanvasId === canvas.id 
                    ? 'hsl(0 0% 94%)'
                    : 'hsl(0 0% 98%)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-panel-contrast)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  if (currentCanvasId !== canvas.id) {
                    e.currentTarget.style.backgroundColor = 'hsl(0 0% 96.1%)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentCanvasId !== canvas.id) {
                    e.currentTarget.style.backgroundColor = 'hsl(0 0% 98%)';
                  }
                }}
                title={canvas.title}
              >
                {canvas.title}
              </button>
            ))}
          </div>

          {/* Account Settings Button - Expandable */}
          {_user && (
            <div style={{ 
              width: '100%'
            }}>
              <button
                onClick={() => {
                  console.log('Account Settings button clicked')
                  setIsAccountMenuOpen(!isAccountMenuOpen)
                }}
                style={{
                  width: '100%',
                  padding: '6px 12px',
                  backgroundColor: 'hsl(0 0% 98%)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-panel-contrast)',
                  borderRadius: isAccountMenuOpen ? '8px 8px 0 0' : '8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => {
                  if (!isAccountMenuOpen) {
                    e.currentTarget.style.backgroundColor = 'hsl(0 0% 96.1%)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAccountMenuOpen) {
                    e.currentTarget.style.backgroundColor = 'hsl(0 0% 98%)';
                  }
                }}
                title="Account Settings"
              >
                <span>⚙️ Account Settings</span>
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{
                    transform: isAccountMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </button>
              
              {/* Expandable Account Settings Content */}
              <div
                style={{
                  width: '100%',
                  maxHeight: isAccountMenuOpen ? '400px' : '0px',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease, opacity 0.3s ease',
                  opacity: isAccountMenuOpen ? 1 : 0,
                  backgroundColor: 'hsl(0 0% 98%)',
                  border: '1px solid var(--color-panel-contrast)',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px'
                }}
              >
                <div style={{ padding: '16px' }}>
                  {/* Email (read-only) */}
                  <div style={{ marginBottom: '12px' }}>
                    <label 
                      style={{
                        display: 'block',
                        fontSize: '10px',
                        fontWeight: '500',
                        color: 'var(--color-text-3)',
                        marginBottom: '4px'
                      }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      value={_user.email || ''}
                      disabled
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '11px',
                        backgroundColor: 'hsl(0 0% 96.1%)',
                        color: '#9ca3af',
                        border: '1px solid var(--color-divider)',
                        borderRadius: '6px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Display Name */}
                  <div style={{ marginBottom: '16px' }}>
                    <label 
                      style={{
                        display: 'block',
                        fontSize: '10px',
                        fontWeight: '500',
                        color: 'var(--color-text-3)',
                        marginBottom: '4px'
                      }}
                    >
                      Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter display name"
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '11px',
                        backgroundColor: '#ffffff',
                        color: 'var(--color-text)',
                        border: '1px solid var(--color-divider)',
                        borderRadius: '6px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Account Actions */}
                  <div 
                    style={{
                      borderTop: '1px solid var(--color-divider)',
                      paddingTop: '12px'
                    }}
                  >
                    <button
                      onClick={async () => {
                        const result = await signOut();
                        if (result.error) {
                          console.error('Sign out error:', result.error);
                        }
                        setIsAccountMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: '500',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.1s ease',
                        marginBottom: '6px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'hsl(0 0% 96.1%)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      Sign Out
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                          // TODO: Implement account deletion
                          console.log('Account deletion not implemented yet');
                          setIsAccountMenuOpen(false);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: '500',
                        backgroundColor: 'transparent',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.1s ease',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fef2f2'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Canvas - Right Side */}
        <div 
          style={{
            flex: '1',
            backgroundColor: 'var(--color-background)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--color-divider)'
          }}
        >
      <Tldraw
            // Use the sync store instead of local store
            store={syncStore}
        // Pass in the array of custom tool classes
        tools={customTools}
        // Pass in custom shape utilities
        shapeUtils={customShapeUtils}
        // Pass in our ui overrides
        overrides={uiOverrides}
        // Pass in our custom components
            components={{
              ...components,
              // You can add a custom UI slot here if needed
            }}
        // Pass in our custom asset urls
        assetUrls={customAssetUrls}
            // Enable built-in grid
            onMount={handleMount}
          >
            {/* Place SimpleCanvasManager here so it has access to the editor context */}
            <SimpleCanvasManager />
          </Tldraw>
        </div>
    </div>
    </CanvasContext.Provider>
  );
};