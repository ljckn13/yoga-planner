import React, { useLayoutEffect, useRef } from 'react';
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
} from 'tldraw';
import 'tldraw/tldraw.css';
import { YogaPoseShapeUtil, YogaPoseTool, YogaPoseSvgShapeUtil } from '../shapes';
import { YogaPosePanel } from './YogaPosePanel';
import { getPoseState } from '../utils/pose-state';
import { useAutoSave } from '../hooks/useAutoSave';
import { useCanvasManager } from '../hooks/useCanvasManager';
import { yogaCategories } from '../assets/yoga-flows';

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
  
  React.useEffect(() => {
    if (!editor) return;
    
    const updateCanvasTitle = () => {
      try {
        const canvasList = localStorage.getItem('yoga_flow_canvas_list');
        if (canvasList) {
          const canvases = JSON.parse(canvasList);
          // Find the current canvas by checking which one has the most recent lastModified
          const currentCanvas = canvases.reduce((latest: any, current: any) => {
            if (!latest) return current;
            const latestDate = new Date(latest.metadata.lastModified);
            const currentDate = new Date(current.metadata.lastModified);
            return currentDate > latestDate ? current : latest;
          }, null);
          
          if (currentCanvas?.metadata?.title) {
            setCanvasTitle(currentCanvas.metadata.title);
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
  }, [editor]);
  
  return canvasTitle;
}

// Custom page menu that shows canvas title instead of page name
function CustomPageMenu() {
  const editor = useEditor();
  const currentPage = useValue('current page', () => editor.getCurrentPage(), [editor]);
  const canvasTitle = useCurrentCanvasTitle(editor);

  return (
    <div className="tlui-page-menu">
      <div className="tlui-page-menu__header">
        <div className="tlui-page-menu__header__title">
          {canvasTitle}
        </div>
      </div>
    </div>
  );
}

// Custom main menu with canvas management
function CustomMainMenu() {
  const editor = useEditor();
  const {
    canvases,
    currentCanvas,
    createCanvas,
    updateCanvas,
    deleteCanvas,
    switchCanvas,
  } = useCanvasManager(editor, {
    defaultCanvasTitle: 'Yoga Flow',
    autoCreateDefault: true,
  });

  const handleCreateCanvas = async () => {
    const title = prompt('Enter canvas title:') || undefined;
    if (title) {
      try {
        await createCanvas(title);
      } catch (err) {
        console.error('Failed to create canvas:', err);
      }
    }
  };

  const handleRenameCanvas = async () => {
    if (!currentCanvas) return;
    const newTitle = prompt('Enter new title:', currentCanvas.metadata.title);
    if (newTitle && newTitle.trim() && newTitle !== currentCanvas.metadata.title) {
      try {
        await updateCanvas(currentCanvas.metadata.id, { title: newTitle.trim() });
      } catch (err) {
        console.error('Failed to rename canvas:', err);
      }
    }
  };

  const handleDeleteCanvas = async () => {
    if (!currentCanvas || canvases.length <= 1) {
      alert('Cannot delete the last canvas. Create a new one first.');
      return;
    }
    
    if (confirm(`Are you sure you want to delete "${currentCanvas.metadata.title}"?`)) {
      try {
        await deleteCanvas(currentCanvas.metadata.id);
      } catch (err) {
        console.error('Failed to delete canvas:', err);
      }
    }
  };

  const handleSwitchCanvas = async (canvasId: string) => {
    if (currentCanvas?.metadata.id === canvasId) return;
    
    try {
      await switchCanvas(canvasId);
    } catch (err) {
      console.error('Failed to switch canvas:', err);
    }
  };

  return (
    <DefaultMainMenu>
      <TldrawUiMenuGroup id="canvas-management">
        <TldrawUiMenuItem
          id="create-canvas"
          label="Create New Canvas"
          icon="plus"
          onSelect={handleCreateCanvas}
        />
        {canvases.length > 1 && (
          <TldrawUiMenuSubmenu
            id="switch-canvas"
            label="Switch Canvas"
            size="small"
          >
            {canvases.map((canvas) => (
              <TldrawUiMenuItem
                key={canvas.metadata.id}
                id={`switch-to-${canvas.metadata.id}`}
                label={canvas.metadata.title}
                icon={currentCanvas?.metadata.id === canvas.metadata.id ? "check" : "blank"}
                onSelect={() => handleSwitchCanvas(canvas.metadata.id)}
              />
            ))}
          </TldrawUiMenuSubmenu>
        )}
        {currentCanvas && (
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
  const components = createComponents();
  
  // Add auto-save functionality
  const AutoSaveIndicator = () => {
    const editor = useEditor();
    const { saveStatus, lastSaved, manualSave, clearSavedState } = useAutoSave(editor, {
      canvasId: 'main-canvas',
      autoSaveDelay: 0, // Instant save (was 2000ms)
      enableAutoSave: true,
    });

    const getStatusColor = () => {
      switch (saveStatus) {
        case 'saved': return 'text-green-600';
        case 'saving': return 'text-blue-600';
        case 'error': return 'text-red-600';
        case 'unsaved': return 'text-yellow-600';
        default: return 'text-gray-600';
      }
    };

    const getStatusText = () => {
      switch (saveStatus) {
        case 'saved': return 'Saved';
        case 'saving': return 'Saving...';
        case 'error': return 'Error';
        case 'unsaved': return 'Unsaved';
        default: return 'Unknown';
      }
    };

    return (
      <div className="fixed top-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              saveStatus === 'saved' ? 'bg-green-500' :
              saveStatus === 'saving' ? 'bg-blue-500' :
              saveStatus === 'error' ? 'bg-red-500' :
              'bg-yellow-500'
            }`} />
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          
          {lastSaved && (
            <span className="text-xs text-gray-500">
              {lastSaved.toLocaleTimeString()}
            </span>
          )}
          
          <div className="flex gap-1">
            <button
              onClick={manualSave}
              disabled={saveStatus === 'saving'}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              title="Save manually (Ctrl+S)"
            >
              Save
            </button>
            <button
              onClick={clearSavedState}
              className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              title="Clear saved state"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="tldraw__editor h-screen w-screen">
      <Tldraw
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
        onMount={(editor) => {
          editor.updateInstanceState({ isGridMode: true });
          
          // Ensure only one page per canvas - remove extra pages
          const pages = editor.getPages();
          if (pages.length > 1) {
            const currentPageId = editor.getCurrentPageId();
            pages.forEach(page => {
              if (page.id !== currentPageId) {
                editor.deletePage(page.id);
              }
            });
          }
        }}
      >
        {/* Place AutoSaveIndicator here so it has access to the editor context */}
        <AutoSaveIndicator />
      </Tldraw>
      <style>
        {`
          /* System font override for UI elements only, not text shapes */
          .tldraw__editor .tlui-panel,
          .tldraw__editor .tlui-toolbar,
          .tldraw__editor .tlui-menu,
          .tldraw__editor .tlui-dialog,
          .tldraw__editor .tlui-button,
          .tldraw__editor .tlui-input {
            font-family: system-ui !important;
          }
          
          /* Completely remove font overrides for text shapes - let tldraw handle fonts naturally */
          
          /* Alternative: Use a specific font like Inter */
          /* .tldraw__editor,
          .tldraw__editor * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          } */
          
          /* Alternative: Use a more modern font stack */
          /* .tldraw__editor,
          .tldraw__editor * {
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif !important;
          } */

          /* Hide stroke on transparent geo shapes */
          .tldraw__editor [data-shape-type="geo"][data-fill="none"] {
            stroke: none !important;
            stroke-width: 0 !important;
          }
          
          /* Hide Fill, Dash, and Size options in style panel */
          .tlui-style-panel [data-section="fill"],
          .tlui-style-panel .tlui-style-panel__section[data-section="fill"],
          .tlui-style-panel .tlui-style-panel__section:has([data-section="fill"]),
          .tlui-style-panel [data-testid="style.fill"],
          .tlui-style-panel [data-testid="style.fill.none"],
          .tlui-style-panel [data-testid="style.fill.solid"],
          .tlui-style-panel [data-testid="style.fill.pattern"],
          .tlui-style-panel [data-testid="style.fill.semi"],
          
          .tlui-style-panel [data-section="dash"],
          .tlui-style-panel .tlui-style-panel__section[data-section="dash"],
          .tlui-style-panel .tlui-style-panel__section:has([data-section="dash"]),
          .tlui-style-panel [data-testid="style.dash"],
          .tlui-style-panel [data-testid="style.dash.draw"],
          .tlui-style-panel [data-testid="style.dash.solid"],
          .tlui-style-panel [data-testid="style.dash.dashed"],
          .tlui-style-panel [data-testid="style.dash.dotted"],
          
          .tlui-style-panel [data-section="size"],
          .tlui-style-panel .tlui-style-panel__section[data-section="size"],
          .tlui-style-panel .tlui-style-panel__section:has([data-section="size"]),
          .tlui-style-panel [data-testid="style.size"],
          .tlui-style-panel [data-testid="style.size.s"],
          .tlui-style-panel [data-testid="style.size.m"],
          .tlui-style-panel [data-testid="style.size.l"],
          .tlui-style-panel [data-testid="style.size.xl"] {
            display: none !important;
          }
          
          /* Alternative selectors for Fill, Dash, Size sections */
          .tlui-style-panel .tlui-style-panel__section:nth-child(1),
          .tlui-style-panel .tlui-style-panel__section:nth-child(2),
          .tlui-style-panel .tlui-style-panel__section:nth-child(3) {
            display: none !important;
          }
          
          /* Hide divider lines in style panel */
          .tlui-style-panel .tlui-style-panel__divider,
          .tlui-style-panel hr,
          .tlui-style-panel .tlui-divider,
          .tlui-style-panel [data-testid="style.divider"],
          .tlui-style-panel .tlui-style-panel__section:has(hr),
          .tlui-style-panel .tlui-style-panel__section:has(.tlui-divider),
          .tlui-style-panel .tlui-style-panel__section_common {
            display: none !important;
          }
          
          /* Global button styling for all tldraw UI - Light mode only */
          .tlui-button[data-state="selected"]::after,
          .tlui-button[aria-pressed="true"]::after,
          .tlui-button.tlui-button__selected::after {
            background-color: hsl(0 0% 94%) !important;
          }
          
          .tlui-button[data-state="selected"],
          .tlui-button[aria-pressed="true"],
          .tlui-button.tlui-button__selected {
            color: var(--color-text) !important;
          }
          
          /* Hover states to match category buttons */
          .tlui-button:hover::after {
            background-color: hsl(0 0% 96.1%) !important;
          }
          
          /* Style panel and other UI buttons */
          .tlui-style-panel .tlui-button[data-state="selected"]::after,
          .tlui-style-panel .tlui-button[aria-pressed="true"]::after,
          .tlui-style-panel .tlui-button.tlui-button__selected::after {
            background-color: hsl(0 0% 94%) !important;
          }
          
          .tlui-style-panel .tlui-button[data-state="selected"],
          .tlui-style-panel .tlui-button[aria-pressed="true"],
          .tlui-style-panel .tlui-button.tlui-button__selected {
            color: var(--color-text) !important;
          }
          
          .tlui-style-panel .tlui-button:hover::after {
            background-color: hsl(0 0% 96.1%) !important;
          }
          
          /* Menu items and other UI elements */
          .tlui-menu .tlui-button[data-state="selected"]::after,
          .tlui-menu .tlui-button[aria-pressed="true"]::after,
          .tlui-menu .tlui-button.tlui-button__selected::after {
            background-color: hsl(0 0% 94%) !important;
          }
          
          .tlui-menu .tlui-button[data-state="selected"],
          .tlui-menu .tlui-button[aria-pressed="true"],
          .tlui-menu .tlui-button.tlui-button__selected {
            color: var(--color-text) !important;
          }
          
          .tlui-menu .tlui-button:hover::after {
            background-color: hsl(0 0% 96.1%) !important;
          }
          
          /* Any other tldraw UI components */
          .tlui-panel .tlui-button[data-state="selected"]::after,
          .tlui-panel .tlui-button[aria-pressed="true"]::after,
          .tlui-panel .tlui-button.tlui-button__selected::after {
            background-color: hsl(0 0% 94%) !important;
          }
          
          .tlui-panel .tlui-button[data-state="selected"],
          .tlui-panel .tlui-button[aria-pressed="true"],
          .tlui-panel .tlui-button.tlui-button__selected {
            color: var(--color-text) !important;
          }
          
          .tlui-panel .tlui-button:hover::after {
            background-color: hsl(0 0% 96.1%) !important;
          }
          
          /* Fix zoom menu positioning */
          .tlui-zoom-menu {
            bottom: 8px !important;
            left: 8px !important;
          }

          /* Hide page-related UI elements */
          .tlui-page-menu__header__title {
            font-weight: 600 !important;
            color: var(--color-text) !important;
            font-family: system-ui !important;
            font-size: 14px !important;
            line-height: 1.2 !important;
            max-width: 200px !important;
            width: fit-content !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            display: block !important;
          }
          
          /* Hide any page creation/management UI */
          .tlui-page-menu__header__actions,
          .tlui-page-menu__header button[data-testid="page-menu.new-page"],
          .tlui-page-menu__header button[data-testid="page-menu.duplicate-page"],
          .tlui-page-menu__header button[data-testid="page-menu.delete-page"] {
            display: none !important;
          }
          
          /* Hide page list if it appears */
          .tlui-page-menu__list,
          .tlui-page-menu__pages {
            display: none !important;
          }

          /* Dark mode - completely override all custom styles */
          .tldraw[data-theme="dark"] .tlui-button[data-state="selected"]::after,
          .tldraw[data-theme="dark"] .tlui-button[aria-pressed="true"]::after,
          .tldraw[data-theme="dark"] .tlui-button.tlui-button__selected::after,
          .tldraw[data-theme="dark"] .tlui-button:hover::after,
          .tldraw[data-theme="dark"] .tlui-style-panel .tlui-button[data-state="selected"]::after,
          .tldraw[data-theme="dark"] .tlui-style-panel .tlui-button[aria-pressed="true"]::after,
          .tldraw[data-theme="dark"] .tlui-style-panel .tlui-button.tlui-button__selected::after,
          .tldraw[data-theme="dark"] .tlui-style-panel .tlui-button:hover::after,
          .tldraw[data-theme="dark"] .tlui-menu .tlui-button[data-state="selected"]::after,
          .tldraw[data-theme="dark"] .tlui-menu .tlui-button[aria-pressed="true"]::after,
          .tldraw[data-theme="dark"] .tlui-menu .tlui-button.tlui-button__selected::after,
          .tldraw[data-theme="dark"] .tlui-menu .tlui-button:hover::after,
          .tldraw[data-theme="dark"] .tlui-panel .tlui-button[data-state="selected"]::after,
          .tldraw[data-theme="dark"] .tlui-panel .tlui-button[aria-pressed="true"]::after,
          .tldraw[data-theme="dark"] .tlui-panel .tlui-button.tlui-button__selected::after,
          .tldraw[data-theme="dark"] .tlui-panel .tlui-button:hover::after {
            background-color: initial !important;
          }
        `}
      </style>
    </div>
  );
};